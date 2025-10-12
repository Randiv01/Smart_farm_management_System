import mongoose from 'mongoose';

const TelemetrySchema = new mongoose.Schema({
  greenhouseId: { type: String, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  soilMoisture: { type: Number },
  lightLevel: { type: Number },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Telemetry', TelemetrySchema);

