const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Please supply token"]
    }
});

const BlacklistTokens = mongoose.model('BlacklistTokens', blacklistSchema);

module.exports = { BlacklistTokens };
