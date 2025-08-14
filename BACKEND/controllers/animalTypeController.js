import AnimalType from "../models/AnimalType.js";

export const getAnimalTypes = async (req, res) => {
  try {
    const types = await AnimalType.find();
    res.json(types);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const addAnimalType = async (req, res) => {
  console.log("REQ.BODY:", req.body);   // check form fields
  console.log("REQ.FILE:", req.file);   // check file upload

  try {
    const { name, fields } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!req.file) return res.status(400).json({ message: "Banner image is required" });

    const animalType = new AnimalType({
      name,
      bannerImage: `/uploads/${req.file.filename}`,
      fields: JSON.parse(fields),
      total: 0 // initial total
    });

    const saved = await animalType.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving animal type:", err);
    res.status(500).json({ message: "Failed to save animal type" });
  }
};
