const mongoose = require("mongoose")

const mongoPassword = process.env.mongoPassword;
let mongoURI = process.env.mongoURI;
mongoURI = mongoURI.replace("<password>", mongoPassword);

const connectToDB = () => {
    try {
        mongoose.connect(mongoURI)
        console.log("DB connected successfully")
    } catch (error) {
        console.log("Error occured during DB connectrion", err)
    }

}

module.exports = connectToDB;