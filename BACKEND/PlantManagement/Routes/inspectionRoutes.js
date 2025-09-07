import express from "express";
import asyncHandler from "express-async-handler";
import Inspection from "../models/inspectionModel.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();

// GET all inspections
router.get("/", asyncHandler(async (req, res) => {
  const inspections = await Inspection.find().sort({ date: -1 });
  res.json(inspections);
}));

// POST new inspection
router.post("/", asyncHandler(async (req, res) => {
  const newInspection = await Inspection.create(req.body);
  res.status(201).json(newInspection);
}));

// PUT update inspection
router.put("/:id", asyncHandler(async (req, res) => {
  const updated = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
}));

// DELETE inspection
router.delete("/:id", asyncHandler(async (req, res) => {
  await Inspection.findByIdAndDelete(req.params.id);
  res.json({ success: true });
}));

// PDF download
router.get("/download/:id", asyncHandler(async (req, res) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) return res.status(404).json({ message: "Not found" });

  const filePath = path.join("Uploads", `inspection_${inspection._id}.pdf`);
  if (!fs.existsSync(filePath)) {
    // Generate PDF if doesn't exist
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(20).text("Inspection Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Greenhouse: ${inspection.tunnel}`);
    doc.text(`Inspector: ${inspection.inspector}`);
    doc.text(`Date: ${inspection.date.toDateString()}`);
    doc.text(`Status: ${inspection.status}`);
    doc.text(`Notes: ${inspection.notes || "N/A"}`);
    doc.end();

    stream.on("finish", () => res.download(filePath));
  } else {
    res.download(filePath);
  }
}));

export default router;
