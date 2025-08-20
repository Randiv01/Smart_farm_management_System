import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/trigger", async (req, res) => {
  const { phone, email, message } = req.body;

  try {
    // 1️⃣ Simulate SMS
    console.log(`📱 SMS simulated to ${phone}: ${message}`);

    // 2️⃣ Simulate Phone Call
    console.log(`📞 Call simulated to ${phone}: ${message}`);

    // 3️⃣ Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Farm Emergency" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🚨 Emergency Protocol Activated",
      text: message,
    });

    res.json({ success: true, message: "Emergency protocol triggered (email sent, SMS & call simulated)" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
