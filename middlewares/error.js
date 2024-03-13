const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    const error = new Error(message);
    error.statusCode = 400;
    return error
};

const handleDuplicateValueError = (err) => {
    const dupKey = Object.keys(err.keyValue)[0];
    const dupValue = Object.values(err.keyValue)[0];

    const message = `${dupKey} with value "${dupValue}"  exist already`;
    const error = new Error(message);
    error.statusCode = 400;
    return error
}

const handleValidationErrorDB = (err) => {
    const errors = err.errors; 
    const message = `${errors.join(". ")}`;
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const handleJWTError = (err) => {
    const message = err.message;
    const error = new Error(message);
    error.statusCode = 401;
    return error;
};

const handleJWTExpiredError = (err) => {
    const message = err.message;
    const error = new Error(message);
    error.statusCode = 401;
    return error;
};

const handlePasswordAndEmailError = (err) => {
    const message = "incorrect email or password";
    const error = new Error(message);
    error.statusCode = 400;
    return error
}

const handleLogoutError = (err) => {
    const message = "Unable to log out";
    const error = new Error(message);
    error.statusCode = 401;
    return error
}

// errors for development comes here 
const sendDevError = (err, res) => {
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        status: "faIL",
        message: errMsg,
        stack: err.stack,
        error: err
    })
}


// Errors for production comes here
const sendProdError = (err, res) => {

    if (err.code == 11000) {
        const error = handleDuplicateValueError(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else if (err.name == "ValidationError") {
        const error = handleValidationErrorDB(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else if (err.name == 'CastError') {
        const error = handleCastErrorDB(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else if (err.message === "You are currently not logged in. Please log in to continue") {
        const error = handleJWTError(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }
    else if (err.message === "Invalid token supplied. Please login again") {
        const error = handleJWTExpiredError(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else if (err.message === "Invalid input data") {
        const error = handlePasswordAndEmailError(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else if (err.message === "Fail to blacklist token") {
        const error = handleLogoutError(err);
        res.status(error.statusCode).json({
            status: "faIL",
            message: error.message,
        })
    }

    else {
        res.status(500).json({
            status: "error",
            message: "Something went wrong"
        })
    }
}


// All errors middlewear
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV == "development") {
        sendDevError(err, res)
    }
    else {
        sendProdError(err, res)
    }
    next();
}

module.exports = errorHandler;

