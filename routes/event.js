const express = require("express")
const  { createEvent, getallEvents, getsigleEvents, updateEvents, deleteEvents, getUpcomimgEvent, getFeaturedEvent, getEventForCategories, getLengthofCategories, getSearchEvent, createTicket, getTicketforEvent, updateTicket, deleteTicket, getLengthofEventUser } = require("./../controllers/eventController");
const { protectRoutes } = require("../middlewares/auth");
const router = express.Router()

router.post("/createEvent", protectRoutes, createEvent);
router.get("/getEvent", getallEvents);
router.get("/:eventId", getsigleEvents);
router.put("/:eventId",  protectRoutes, updateEvents);
router.delete("/:eventId",  protectRoutes, deleteEvents);
router.get("/events/upcoming", getUpcomimgEvent);
router.get("/events/featured", getFeaturedEvent);
router.get("/event/usereventvenues", getLengthofEventUser);
router.get("/category/:category", getEventForCategories);
router.get("/categories/length", getLengthofCategories);
router.get("/search/:name/:category/:time", getSearchEvent);
router.post("/createTicket", protectRoutes, createTicket)   
router.get("/getTicket/:ticketId", getTicketforEvent);
router.put("/updateTicket/:ticketId", protectRoutes, updateTicket)
router.delete("/deleteTicket/:ticketId", protectRoutes, deleteTicket)

module.exports = router
