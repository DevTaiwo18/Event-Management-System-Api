const Event = require("./../models/Event")
const Ticket = require("./../models/Ticket")
const { multerUploads, dataUri, uploader, cloudinaryConfig } = require('./../middlewares/cloudinary');
const User = require("../models/user");

const createEvent = async (req, res, next) => {
    const userId = req.user.id;
    try {
        multerUploads(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Error uploading image'
                });
            }

            cloudinaryConfig();

            const { name, description, date, location, category, venue } = req.body;

            const eventDate = new Date(date);
            if (isNaN(eventDate) || eventDate <= Date.now()) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid event date. Please provide a future date.'
                });
            }

            let image = null;

            if (req.file) {
                const imageDataUri = dataUri(req);
                const result = await uploader.upload(imageDataUri, { folder: 'event_images' });
                image = result.secure_url;
            }

            const event = await Event.create({
                name,
                description,
                date: eventDate,
                location,
                category,
                createdBy: req.user._id,
                image,
                venue
            });

            res.status(201).json({
                status: "success",
                message: "Event created successfully",
                event
            });
        });
    } catch (error) {
        next(error);
    }
};

const getallEvents = async (req, res, next) => {
    try {
        const events = await Event.find();

        res.status(200).json({
            status: 'success',
            results: events.length,
            events
        });
    } catch (error) {
        next(error);
    }
};

const getsigleEvents = async (req, res, next) => {
    const eventId = req.params.eventId;

    try {
        const event = await Event.findById(eventId);

        if (!event) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        res.status(200).json({
            status: 'success',
            event
        });
    } catch (error) {
        next(error);
    }
};

const updateEvents = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.eventId;

        const event = await Event.findById(eventId);

        if (!event) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({
                status: "Error",
                message: "You're not authorized to update this Event.",
            });
        }

        const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            message: "Event updated successfully",
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error updating event:', error);
        next(error);
    }
};

const deleteEvents = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log(userId);
        const eventId = req.params.eventId;

        const event = await Event.findById(eventId);
        console.log(event);

        if (event.createdBy.toString() !== userId) {
            return res.status(403).json({
                status: "Error",
                message: "You're not authorized to delete this Event."
            });
        }

        const deletedEvent = await Event.findByIdAndDelete(eventId);

        if (!deletedEvent) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        res.status(200).json({
            status: "Success",
            message: "Event successfully deleted",
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        next(error);
    }
};

const createTicket = async (req, res, next) => {
    try {
        const { eventId, userId, type, sit, price, bankName, bankAccount, bankHolderName } = req.body;

        if (!['Regular', 'VIP'].includes(type)) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid ticket type."
            });
        }

        const newTicket = new Ticket({
            eventId,
            userId,
            type,
            sit,
            price,
            bankName,
            bankAccount,
            bankHolderName
        });

        await newTicket.save();

        res.status(201).json({
            status: "success",
            message: `${type} ticket created successfully`,
            ticket: newTicket
        });
    } catch (error) {
        next(error);
    }
};

const getTicketforEvent = async (req, res, next) => {
    try {
        const eventId = req.params.ticketId;

        const tickets = await Ticket.find({ eventId });

        if (!tickets) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        res.status(200).json({
            status: "success",
            message: "Tickets for the event fetched successfully",
            resulit: tickets.length,
            tickets
        });
    } catch (error) {
        next(error);
    }
}

const updateTicket = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const ticketId = req.params.ticketId;
        const { sit, price, bankName, bankAccount, bankHolderName } = req.body;

        const ticket = await Ticket.findById(ticketId);

        if (ticket.userId.toString() !== userId) {
            return res.status(403).json({
                status: "Error",
                message: "You're not authorized to update this ticket.",
            });
        }
        
        if (!ticket) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        if (ticket.price > 0) {
            if (!bankName || !bankAccount || !bankHolderName) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Missing required payment details for a paid ticket.'
                });
            }

            ticket.sit = sit;
            ticket.price = price;
            ticket.bankName = bankName;
            ticket.bankAccount = bankAccount;
            ticket.bankHolderName = bankHolderName;
        } else {
            ticket.sit = sit;
            ticket.price = price;
        }

        const updatedTicket = await ticket.save();

        res.status(200).json({
            status: 'success',
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });
    } catch (error) {
        next(error);
    }
};

const deleteTicket = async (req, res, next) => {
    try {
        const ticketId = req.params.ticketId;
        const userId = req.user.id;

        const ticket = await Ticket.findById(ticketId);

        if (ticket.userId.toString() !== userId) {
            return res.status(403).json({
                status: "Error",
                message: "You're not authorized to delete this ticket.",
            });
        }

        const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

        if (!deletedTicket) {
            const error = new Error("CastError")
            error.statuscode = 204
            return next(error)
        }

        res.status(200).json({
            status: 'success',
            message: 'Ticket deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

const getUpcomimgEvent = async (req, res, next) => {
    try {
        const currentDate = new Date();
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);


        const upcomingEvents = await Event.find({ date: { $gt: lastDayOfMonth } })
            .sort({ date: 1 })
            .exec();


        res.status(200).json({
            status: "success",
            message: "Upcoming events fetched successfully",
            result: upcomingEvents.length,
            events: upcomingEvents
        });
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        next(error);
    }
};

const getFeaturedEvent = async (req, res, next) => {
    try {
        const currentDate = new Date();

        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + 7);

        const featuredEvents = await Event.find({
            date: { $gte: currentDate, $lte: endDate }
        }).sort({ date: 1 }).exec();

        res.status(200).json({
            status: "success",
            message: "Featured events fetched successfully",
            result: featuredEvents.length,
            events: featuredEvents
        });
    } catch (error) {
        console.error('Error fetching featured events:', error);
        next(error);
    }
}

const getEventForCategories = async (req, res, next) => {
    try {
        const { category } = req.params;

        if (!category) {
            return res.status(400).json({
                status: "fail",
                message: "Category parameter is missing in the request."
            });
        }

        const events = await Event.find({ category });

        res.status(200).json({
            status: "success",
            message: "Events fetched successfully",
            events
        });
    } catch (error) {
        console.error('Error fetching events for category:', error);
        next(error);
    }
};

const getLengthofCategories = async (req, res, next) => {
    try {
        const categories = await Event.distinct("category");
        const categoriesWithLength = [];

        for (const category of categories) {
            const events = await Event.find({ category });
            categoriesWithLength.push({ category, length: events.length });
        }

        res.status(200).json({
            status: "success",
            message: "Length of categories fetched successfully",
            categories: categoriesWithLength
        });
    } catch (error) {
        console.error('Error fetching length of categories:', error);
        next(error);
    }
};

const getSearchEvent = async (req, res, next) => {
    try {
        const { name, category, time } = req.params;
        let query = {};

        if (name !== 'any') {
            query.name = { $regex: name, $options: "i" };
        }

        if (category !== 'any') {
            query.category = category;
        }

        const now = new Date();
        switch (time) {
            case 'today':
                query.date = {
                    $gte: new Date(now.setHours(0, 0, 0, 0)),
                    $lt: new Date(now.setHours(23, 59, 59, 999)),
                };
                break;
            case 'tomorrow':
                const tomorrow = new Date(now)
                tomorrow.setDate(now.getDate() + 1);
                query.date = {
                    $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
                    $lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
                };
                break;
            case 'this_week': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
                startOfWeek.setHours(0, 0, 0, 0);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

                query.date = { $gte: startOfWeek, $lt: endOfWeek };
                break;
            }
            case 'next_week': {
                const nextWeek = new Date(now);
                nextWeek.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
                const startOfNextWeek = new Date(nextWeek.setHours(0, 0, 0, 0));

                const endOfNextWeek = new Date(startOfNextWeek);
                endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
                endOfNextWeek.setHours(23, 59, 59, 999);

                query.date = { $gte: startOfNextWeek, $lt: endOfNextWeek };
                break;
            }
            case 'next_month':
                let firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                let lastDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                query.date = { $gte: firstDayOfNextMonth, $lt: lastDayOfNextMonth };
                break;
            case 'future':
                query.date = { $gte: now };
                break;
        }

        console.log("Query object:", query);
        const events = await Event.find(query).sort({ date: 1 });
        console.log("Events found:", events);


        res.status(200).json({
            status: "success",
            count: events.length,
            events,
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ status: "error", message: "Error fetching events", error: error.message });
    }
};

const getautodelete = async (req, res, next) => {

}

const getLengthofEventUser = async (req, res, next) => {
    try {
        const eventCount = await Event.countDocuments();

        const allEvents = await Event.find();
        const uniqueVenues = [...new Set(allEvents.map(event => event.venue))];

        const venueCount = uniqueVenues.length;
        const userCount = await User.countDocuments();

        res.json({ userCount, eventCount, venueCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createEvent, getallEvents, getsigleEvents, updateEvents, deleteEvents, createTicket, getTicketforEvent, updateTicket, deleteTicket, getUpcomimgEvent, getFeaturedEvent, getEventForCategories, getLengthofCategories, getSearchEvent, getLengthofEventUser }