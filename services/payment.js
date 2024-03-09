const https = require('https');
const yup = require('yup');
const crypto = require('crypto');
const Registration = require('../models/Registration');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const emailSchema = yup.string().email().required();
const amountSchema = yup.number().positive().required();
const secret = process.env.SECRET_KEY;

const payment = async ({ email, amount }, req, res, next) => {
    try {
        await emailSchema.validate(email);
        await amountSchema.validate(amount);

        const paymentPayload = JSON.stringify({
            email: email,
            amount: Number(amount) * 100
        });

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/transaction/initialize',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(paymentPayload)
            }
        };

        const paystackResponse = await new Promise((resolve, reject) => {
            const reqpaystack = https.request(options, respaystack => {
                let data = '';
                respaystack.on('data', (chunk) => {
                    data += chunk;
                });
                respaystack.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });
            reqpaystack.on('error', error => {
                next(error);
            });
            reqpaystack.write(paymentPayload);
            reqpaystack.end();
        });

        const transactionId = paystackResponse.data.reference;
        const paymentUrl = paystackResponse.data.authorization_url;

        return { paymentUrl, transactionId };
    } catch (error) {
        next(error);
    }
};

const handlePaystackWebhook = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers['authorization']; 
        const calculatedSignature = crypto.createHmac('sha512', secret)
            .update(JSON.stringify({ body: req.body, authorization: authorizationHeader }))
            .digest('hex');

        if (authorizationHeader !== calculatedSignature) {
            console.log('Signatures do not match!');
            return res.status(404).send({
                status: 'fail',
                message: 'invalid webhook signature'
            });
        }

        const paymentStatus = req.body.event;
        const transactionId = req.body.data.id;

        let registrationStatus;

        switch (paymentStatus) {
            case 'charge.success':
            case 'transfer.success':
                registrationStatus = 'success';
                break;
            case 'charge.failed':
            case 'transfer.failed':
                registrationStatus = 'failed';
                break;
            default:
                registrationStatus = 'pending';
        }

        const updateResult = await Registration.updateOne({ transactionId }, { status: registrationStatus });
        if (updateResult.nModified === 0) {
            return res.status(404).json({
                message: 'Registration not found or already updated'
            });
        }

        const updateTransaction = await Transaction.updateOne({ _id: transactionId }, { status: registrationStatus });

        if (registrationStatus === 'success') {
            const registration = await Registration.findOne({ transactionId });
            if (!registration) {
                return res.status(404).json({
                    message: 'Registration not found'
                });
            }
            const ticket = await Ticket.findById(registration.ticketId);
            if (!ticket) {
                return res.status(404).json({
                    message: 'Ticket not found'
                });
            }
            ticket.sit -= registration.numberOfSeats;
            await ticket.save();
        }

        return res.status(200).json({
            status: 'success',
            message: `Payment status updated successfully: ${registrationStatus}`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { payment, handlePaystackWebhook };
