const mongoose = require("mongoose");
const { Schema } = mongoose; 

const eventSchema = new Schema({ 
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true 
    },
    category: {
        type: String,
        enum: ['sport', 'travel', 'conference', 'business', 'festival', 'music'],
        required: true
    },
    venue: {
        type: String,
        required: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    image: { 
        type: String,
        required: false 
    }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
