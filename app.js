const express = require("express");
const cors = require("cors")
const morgan = require("morgan")
const errorHandler = require("./middlewares/error");
const authRouters = require('./routes/auth');
const userRouters = require("./routes/user");
const eventRouters = require("./routes/event")
const { handlePaystackWebhook } = require("./services/payment");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));


app.get("/", (req, res) => {
    res.send("Hello, world! welcome! to EventFlow");
});

app.get("/api/v1", (req, res) => {
    res.send("Hello, world! welcome! to EventFlow Api")
});

app.use("/api/v1/auth", authRouters);
app.use('/api/v1/user', userRouters);
app.use("/api/v1/event", eventRouters);
app.use("/api/v1/payment/webhooks", handlePaystackWebhook);

app.all("*", (req, res) =>  {
    res.send(`${req.method} ${req.originalUrl} is not supported`)
});

app.use(errorHandler);

module.exports = app;
