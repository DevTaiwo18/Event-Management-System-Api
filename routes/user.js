const express = require('express');
const { getProfile, updateProfile, deleteProfile, changePassword, getUserEvents, getMyRegisterEvent, registerforEvent, viewTransactionsHistory,UserregisterforMyEvent } =  require("../controllers/userController");
const { protectRoutes } = require('../middlewares/auth');
const router = express.Router();

router.get('/profile', protectRoutes, getProfile);
router.patch('/profile', protectRoutes, updateProfile);
router.delete('/profile', protectRoutes, deleteProfile);
router.patch('/changepassword', protectRoutes, changePassword);
router.get('/my-events', protectRoutes, getUserEvents);
router.get("/my-transactions", protectRoutes, viewTransactionsHistory);
router.get("/Userregisteringformyevent/:eventId", protectRoutes, UserregisterforMyEvent)
router.get("/myregister-event", protectRoutes, getMyRegisterEvent);
router.post("/registerforevent", protectRoutes, registerforEvent)

module.exports = router;