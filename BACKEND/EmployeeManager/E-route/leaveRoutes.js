import express from "express";
import * as ctrl from "../E-control/leaveController.js";

const router = express.Router();

// CRUD
router.get("/", ctrl.getLeaves);
router.post("/", ctrl.createLeave);
router.put("/:id", ctrl.updateLeave);
router.delete("/:id", ctrl.deleteLeave);

// Analytics / extras
router.get("/balance", ctrl.getBalance);
router.get("/distribution", ctrl.getDistribution);
router.get("/trend", ctrl.getTrend);          // <- keep before any "/:id" GET route
router.get("/upcoming", ctrl.getUpcoming);
router.get("/stream", ctrl.stream);

export default router;
