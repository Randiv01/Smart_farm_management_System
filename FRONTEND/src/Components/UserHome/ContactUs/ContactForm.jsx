import React, { useState } from "react";

const ContactForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.id]: e.target.value }));
  };

  const validate = () => {
    const { name, email, subject, message } = formData;
    if (!name || !email || !subject || !message)
      return "Please fill in all fields.";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailPattern.test(email)) return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setStatus({ type: "error", message: `⚠️ ${err}` });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json(); // ✅ always parse JSON

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setStatus({
        type: "success",
        message: "✅ Your message has been sent! Check your inbox for our thank-you email.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });

    } catch (error) {
      setStatus({ type: "error", message: `⚠️ ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-1 block font-medium text-gray-800">Name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Your Name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block font-medium text-gray-800">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="your@email.com"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="mb-1 block font-medium text-gray-800">Subject</label>
          <select
            id="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select a Subject --</option>
            <option value="support">Product Support</option>
            <option value="billing">Billing & Payment</option>
            <option value="feedback">Feedback</option>
            <option value="partnership">Partnership Inquiry</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="mb-1 block font-medium text-gray-800">Message</label>
          <textarea
            id="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Write your message"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      {/* Status Message */}
      {status.message && (
        <p
          className={`mt-4 text-center font-medium ${
            status.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}

      {/* Footer */}
      {onClose && (
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 underline hover:text-gray-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactForm;
