const User = require("../models/user")
const Event = require("./../models/Event")
const Ticket = require("./../models/Ticket")
const Registration = require("../models/Registration")
const { payment } = require("./../services/payment")
const bcrypt = require('bcryptjs');
const moment = require("moment")
const Transaction = require("../models/Transaction")
const cron = require('node-cron');
const nodemailer = require('nodemailer');


const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userProfile = await User.findById(userId);

        if (!userProfile) {
            return res.status(404).json({
                status: "failed",
                message: 'Unable to fetch user profile'
            });
        }

        return res.status(200).json({
            status: "success",
            message: "User profile was successfully fetched!",
            userProfile
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { oldUsername, newUsername } = req.body;

        if (!oldUsername || !newUsername) {
            return res.status(400).json({
                status: "fail",
                message: "Both old and new usernames are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        if (user.username !== oldUsername) {
            return res.status(400).json({
                status: "fail",
                message: "Old username does not match"
            });
        }

        user.username = newUsername;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "User profile updated successfully",
            user: user
        });
    } catch (error) {
        next(error)
    }
};

const deleteProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                status: "fail",
                message: "User not found"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Profile deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                status: 'fail',
                message: 'Both old and new passwords are required',
            });
        }

        const user = await User.findById(userId).select("+password");
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found',
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'fail',
                message: 'Incorrect old password',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Password changed successfully',
        });
    } catch (error) {
        next(error);
    }
};

const getUserEvents = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const userEvents = await Event.find({ createdBy: userId });

        res.status(200).json({
            status: "success",
            message: "User's events fetched successfully",
            result: userEvents.length,
            events: userEvents
        });
    } catch (error) {
        console.error('Error fetching user events:', error);
        next(error);
    }
};

const getMyRegisterEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const registrations = await Registration.find({ userId }).populate('eventId');

        if (!registrations || registrations.length === 0) {
            return res.status(200).json({
                message: 'No events registered by the user',
                events: []
            });
        }

        const events = registrations.map(registration => {
            const eventDate = moment(registration.eventId.date);
            const today = moment();
            const daysUntilEvent = eventDate.diff(today, 'days');

            return {
                eventName: registration.eventId.name,
                eventDate: eventDate.format('YYYY-MM-DD'),
                eventLocation: registration.eventId.location,
                eventVenue: registration.eventId.venue,
                eventCategory: registration.eventId.category,
                daysUntilEvent,
                registrationStatus: registration.status,
                numberOfSeats: registration.numberOfSeats,
                ticketPrice: registration.totalPrice,
                ticketType: registration.ticketType
            };
        });

        return res.status(200).json({
            message: 'My registered by the user',
            events
        });
    } catch (error) {
        next(error);
    }

}

const UserregisterforMyEvent = async (req, res, next) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                status: 'fail',
                message: 'Event not found'
            });
        }
        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to view registrations for this event'
            });
        }

        const registrations = await Registration.find({ eventId, userId: { $ne: userId } }).populate('ticketId');

        const userRegistrations = [];

        for (const registration of registrations) {
            console.log(registration);
            const ticket = registration.ticketId;
            const user = await User.findById(registration.userId);
            const formattedDate = moment(event.date).format('YYYY-MM-DD');

            userRegistrations.push({
                userName: user.username,
                ticketType: ticket.type,
                status: registration.status,
                ticketPrice: ticket.price,
                numberOfSeats: registration.numberOfSeats,
                pricePaid: registration.totalPrice,
            });
        }

        console.log(userRegistrations);

        res.status(200).json({ userRegistrations });
    } catch (error) {
        next(error);
    }
}

const registerforEvent = async (req, res, next) => {
    try {
        const { userId, ticketId, eventId, email, numberOfSeats, ticketType } = req.body;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({
                message: 'Ticket not found'
            });
        }

        if (ticket.sit < numberOfSeats) {
            return res.status(400).json({
                message: 'Insufficient available seats'
            });
        }

        let totalPrice = 0;
        let paymentUrl = null;
        let transactionId = null;
        let status = 'pending';

        if (ticket.price > 0) {
            totalPrice = Number(ticket.price) * Number(numberOfSeats);
            const paymentResponse = await payment({ email, amount: totalPrice });
            if (!paymentResponse.paymentUrl) {
                return res.status(400).json({
                    message: 'Failed to initiate payment'
                });
            }
            paymentUrl = paymentResponse.paymentUrl;
            transactionId = paymentResponse.transactionId;
            const transaction = new Transaction({
                userId,
                eventId,
                amount: totalPrice,
                status,
                transactionId
            });
            await transaction.save();
        } else {
            status = 'completed';
            ticket.sit -= numberOfSeats;
            await ticket.save();
        }

        const registration = new Registration({
            ticketId,
            userId,
            email,
            numberOfSeats,
            ticketType,
            totalPrice,
            status,
            eventId,
            transactionId
        });
        await registration.save();

     

        return res.status(200).json({
            message: 'Registration successful',
            registration,
            paymentUrl
        });
    } catch (error) {
        return next(error);
    }
};

const viewTransactionsHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const transactions = await Transaction.find({ userId }).populate('eventId');

        const formattedTransactions = transactions.map(transaction => ({
            eventName: transaction.eventId.name,
            amount: transaction.amount,
            datePaid: moment(transaction.createdAt).format('YYYY-MM-DD'),
            status: transaction.status
        }));

        res.status(200).json({ transactions: formattedTransactions });
    } catch (error) {
        next(error);
    }
};

const sendEventNotifications = async () => {
    try {
        const currentDate = moment();

        const twoDaysLater = moment().add(2, 'days');

        const registrations = await Registration.find({ eventDate: { $gte: currentDate, $lt: twoDaysLater } }).populate('userId');

        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, 
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD 
            }
        });

        for (const registration of registrations) {
            const { userId, eventName, eventDate } = registration;

            const username = userId.username;

            const mailOptions = {
                from: 'eventflow@demomailtrap.com',
                to: registration.email,
                subject: 'Event Notification',
                html: `
                    <p>Dear ${username},</p>
                    <p>You have registered for the event "${eventName}" which is scheduled on ${moment(eventDate).format('YYYY-MM-DD')}.</p>
                    <p>Regards,</p>
                    <p>EventFlow</p>
                `
            };
            await transporter.sendMail(mailOptions);
        }

        console.log('Event notifications sent successfully');
    } catch (error) {
        console.error('Error sending event notifications:', error);
    }
};

cron.schedule('0 0 * * *', sendEventNotifications);


module.exports = { getProfile, updateProfile, deleteProfile, changePassword, getUserEvents, getMyRegisterEvent, registerforEvent, viewTransactionsHistory, UserregisterforMyEvent }