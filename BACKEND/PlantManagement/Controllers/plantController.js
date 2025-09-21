import asyncHandler from 'express-async-handler';
import Plant from '../models/plantModel.js';
import path from 'path';
import fs from 'fs';

// CREATE
const savePlantData = asyncHandler(async (req, res) => {
  try {
    const {
      plantName,
      category,
      greenhouseId,
      length,
      width,
      location,
      plantedDate,
      expectedHarvest,
      estimatedYield,
      status
    } = req.body;

    const plant = await Plant.create({
      plantName,
      category,
      greenhouseId,
      length,
      width,
      location,
      plantedDate,
      expectedHarvest,
      estimatedYield,
      status,
      // FIXED: Consistent path format (lowercase 'uploads')
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    res.status(201).json({ success: true, message: 'Plant saved', data: plant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error saving plant' });
  }
});

// GET All
const getAllPlants = asyncHandler(async (req, res) => {
  const plants = await Plant.find({});
  res.status(200).json(plants);
});

export { savePlantData, getAllPlants };