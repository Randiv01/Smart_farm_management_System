const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://randiv:randiv123@cluster0.j8suyzq.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

const sensorSchema = new mongoose.Schema({
  distance: Number,
  state: String,
  timestamp: { type: Date, default: Date.now }
});
const Sensor = mongoose.model('Sensor', sensorSchema);

const port = new SerialPort({
  path: 'COM5',
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', async (data) => {
  data = data.trim();
  try {
    const obj = JSON.parse(data);
    const { distance, state } = obj;
    if (typeof distance === 'number' && typeof state === 'string') {
      const sensorData = new Sensor({ distance, state });
      await sensorData.save();
      console.log(`📥 Saved to DB: distance=${distance} cm, state=${state}`);
    } else {
      console.log("⚠️ Invalid data structure:", data);
    }
  } catch (err) {
    console.log("⚠️ Could not parse JSON:", data);
  }
});
