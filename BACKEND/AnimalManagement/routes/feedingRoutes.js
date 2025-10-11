import express from "express";
import { getAnimals, getFeeds, scheduleFeeding, getFeedingHistory, createFeedingHistory } from "../controllers/feedingController.js";

const router = express.Router();

router.get("/animals", getAnimals);
router.get("/feeds", getFeeds);
router.get("/history", getFeedingHistory);
router.post("/history", createFeedingHistory);
router.post("/", scheduleFeeding);

export default router;
