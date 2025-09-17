import Greenhouse from '../models/greenhouseModel.js';
import asyncHandler from 'express-async-handler';

// CREATE
export const saveGreenhouseData = asyncHandler(async (req, res) => {
  const greenhouse = await Greenhouse.create(req.body);
  res.status(201).json({ success: true, data: greenhouse });
});

// READ ALL
export const getAllGreenhouses = asyncHandler(async (req, res) => {
  const greenhouses = await Greenhouse.find({});
  res.json(greenhouses);
});
