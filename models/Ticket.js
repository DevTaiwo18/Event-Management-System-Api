const mongoose = require("mongoose");
const { string } = require("yup");
const { Schema } = mongoose;

const ticketSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Regular', 'VIP'],
        required: true
    },
    sit:{
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    bankName: {
        type: String,
        required: function() { return this.price > 0; }
    },
    bankAccount: {
        type: Number,
        required: function() { return this.price > 0; }
    },
    bankHolderName: {
        type: String,
        required: function() { return this.price > 0; }
    }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
