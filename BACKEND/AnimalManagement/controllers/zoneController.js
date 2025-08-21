import Zone from "../models/Zone.js";

// GET all zones with additional statistics
export const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: -1 });

    // Calculate statistics
    const totalZones = zones.length;
    const zoneTypesCount = {};
    let totalCapacity = 0;
    let totalOccupancy = 0;

    zones.forEach(zone => {
      // Count zone types
      zoneTypesCount[zone.type] = (zoneTypesCount[zone.type] || 0) + 1;

      // Calculate capacity and occupancy
      totalCapacity += zone.capacity;
      totalOccupancy += zone.currentOccupancy;
    });

    const fillPercentage = totalCapacity > 0
      ? Math.round((totalOccupancy / totalCapacity) * 100)
      : 0;

    res.json({
      zones,
      statistics: {
        totalZones,
        zoneTypesCount,
        fillPercentage
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE a new zone
export const addZone = async (req, res) => {
  try {
    const lastZone = await Zone.findOne().sort({ createdAt: -1 });
    const num = lastZone ? parseInt(lastZone.zoneID.split("-")[1]) + 1 : 1;
    const zoneID = `MOZ-${num.toString().padStart(4, "0")}`;

    const zone = new Zone({ zoneID, ...req.body });
    await zone.save();
    res.status(201).json(zone);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// UPDATE an existing zone
export const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedZone = await Zone.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedZone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json(updatedZone);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({
        error: "Validation failed",
        details: errors
      });
    }
    res.status(500).json({ error: err.message });
  }
};

// DELETE a zone
export const deleteZone = async (req, res) => {
  try {
    const deletedZone = await Zone.findByIdAndDelete(req.params.id);

    if (!deletedZone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json({ message: "Zone deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET zone type counts for dashboard chart
export const getZoneTypeCounts = async (req, res) => {
  try {
    const zoneTypesCount = await Zone.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);
    const result = {};
    zoneTypesCount.forEach(item => {
      result[item._id] = item.count;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET farm utilization percentage
export const getFarmUtilization = async (req, res) => {
  try {
    const stats = await Zone.aggregate([
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$capacity" },
          totalOccupancy: { $sum: "$currentOccupancy" }
        }
      }
    ]);

    let utilization = 0;
    if (stats.length > 0 && stats[0].totalCapacity > 0) {
      utilization = Math.round((stats[0].totalOccupancy / stats[0].totalCapacity) * 100);
    }

    res.json({ utilization });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};