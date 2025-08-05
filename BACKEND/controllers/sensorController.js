const Sensor = require('../models/Sensor'); // adjust path if needed

// Get last 20 sensor data entries
const getSensorData = async (req, res) => {
  try {
    const data = await Sensor.find().sort({ timestamp: -1 }).limit(20);
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch sensor data', error: error.message });
  }
};

module.exports = {
  getSensorData,
};
