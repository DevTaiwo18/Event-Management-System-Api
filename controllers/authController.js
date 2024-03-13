const User = require("./../models/user");
const notify = require("./../services/notification");
const signJWT = require("./../utils/jwt");
const bcrypt = require('bcryptjs')
const {BlacklistTokens} = require('./../models/tokenBlacklist')
const yup = require("yup")

const signup = async (req, res, next) => {

    const { email, password, username} = req.body;
   
    const rules = yup.object().shape({
        email: yup.string().email("Invalid email format").required(),
        username: yup.string().required(),
        password: yup.string().min(6).required() 
    });

    try {

        let validate = await rules.validate({ email, password, username })
        if (!validate) {
            const error = new Error('Validation error');
            error.statusCode = 400;
            error.errors = error.errors;
            next(error);
        }
        const salt = await bcrypt.genSalt(12);
        const hashedpassword = await bcrypt.hash(password, salt);


        const newUser = await User.create({
            email,
            password: hashedpassword,
            username,
        })

        const token = signJWT(newUser._id, newUser.email);

        await notify({ username: newUser.username, email: newUser.email });

        res.status(201).json({
            status: "success",
            messgae: "User created successfully",
            user: newUser,
            token
        })


    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    const { email, password } = req.body;
    const rule = yup.object().shape({
        email: yup.string().required().trim(),
        password: yup.string().required()
    })

    try {
        let val = await rule.validate({ email, password })
        if (!val) {
            const error = new Error('Validation error');
            error.statusCode = 400;
            error.errors = error.errors;
            next(error);
        }

        const user = await User.findOne({ email }).select("+password")
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const error = new Error("Invalid input data");
            error.statusCode = 404;
            return next(error)
        }

        const token = signJWT(user.id, user.email);
        res.status(200).json({
            status: "success",
            message: "Login successful",
            user,
            token
        })
    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    const { token } = req.body;
    try {
        if (!token) {
            return res.status(400).json({
                status: "fail",
                message: "Please supply token in request body",
            });
        }
    
        const blacklistedToken = await BlacklistTokens.create({ token });
    
        if (!blacklistedToken) {
            const error = new Error("Failed to blacklist token");
            error.statusCode = 500;
            return next(error);
        }
    
        res.status(200).json({
            status: "success",
            message: "Logout successful",
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

module.exports = { signup, login, logout }; 