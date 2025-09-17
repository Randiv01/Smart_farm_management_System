import Inspection from '../models/inspectionModel.js';
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// CREATE
export const createInspection = async (req, res) => {
  const { greenhouseId, inspector, date, status, note } = req.body;
  const newInspection = new Inspection({ greenhouseId, inspector, date, status, note });
  await newInspection.save();
  res.status(201).json(newInspection);
};

// GET ALL
export const getInspections = async (req, res) => {
  const inspections = await Inspection.find().sort({ date: -1 });
  res.json(inspections);
};

// UPDATE
export const updateInspection = async (req, res) => {
  const updated = await Inspection.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
};

// DELETE
export const deleteInspection = async (req, res) => {
  await Inspection.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};

// PDF DOWNLOAD
export const downloadInspectionPDF = async (req, res) => {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) return res.status(404).json({ message: "Not found" });

  const filePath = path.join("uploads", `inspection_${inspection._id}.pdf`);
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Inspection Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Greenhouse ID: ${inspection.greenhouseId}`);
  doc.text(`Inspector: ${inspection.inspector}`);
  doc.text(`Date: ${inspection.date.toISOString().slice(0, 10)}`);
  doc.text(`Status: ${inspection.status}`);
  doc.text(`Note: ${inspection.note || "N/A"}`);

  doc.end();

  doc.on("finish", () => {
    res.download(filePath);
  });
};
