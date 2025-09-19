// E-route/leaveRoutes.js
import express from "express";
import * as ctrl from "../E-control/leaveController.js"; // note the .js extension

const router = express.Router();

// Routes
router.get("/", ctrl.getLeaves);
router.post("/", ctrl.createLeave);
router.put("/:id", ctrl.updateLeave);
router.delete("/:id", ctrl.deleteLeave);

router.get("/balance", ctrl.getBalance);
router.get("/distribution", ctrl.getDistribution);
router.get("/upcoming", ctrl.getUpcoming);
router.get("/stream", ctrl.stream);

export default router; // ✅ default export
