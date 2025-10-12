import express from 'express';
import { getDashboardData, getGreenhouseTelemetry, getValidGreenhouses, storeTelemetryData, getAllPlantManagementIssues } from '../Controllers/dashboardController.js';

const router = express.Router();

// Get dashboard summary data
router.get('/dashboard', getDashboardData);

// Get greenhouse telemetry data
router.get('/telemetry/:greenhouseId', getGreenhouseTelemetry);

// Get_valid greenhouse numbers
router.get('/greenhouses', getValidGreenhouses);

// Store telemetry data from DHT22 sensor
router.post('/telemetry', storeTelemetryData);

// Get all Plant Management issues for header notification
router.get('/plant-management-issues', getAllPlantManagementIssues);

export default router;
