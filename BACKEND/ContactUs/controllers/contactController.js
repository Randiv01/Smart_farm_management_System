import Contact from "../models/contactModel.js";

// POST /api/contact
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    res.status(201).json({ success: true, message: "✅ Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error saving contact message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/contact
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    console.error("❌ Error fetching contact messages:", error);
    res.status(500).json({ error: "Server error" });
  }
};
