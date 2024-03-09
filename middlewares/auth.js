const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const Users = require("./../models/user");
const { BlacklistTokens } = require("./../models/tokenBlacklist");

const protectRoutes = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            const error = new Error("You are currently not logged in. Please log in to continue");
            error.statusCode = 401;
            return next(error);
        }

        const blacklistedToken = await BlacklistTokens.findOne({ token });
        if (blacklistedToken) {
            const error = new Error("Invalid token supplied. Please login again");
            error.statusCode = 401;
            return  next(error);
        }

        const decoded = await promisify(jwt.verify)(token, process.env.jwtSecret);
        const user = await Users.findById(decoded.id).select("-password -__v");

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "Can't find user with the specified token"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { protectRoutes };
