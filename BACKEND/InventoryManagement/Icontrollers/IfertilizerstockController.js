import IFertilizer from "../Imodels/IFertilizer.js";

// Get all fertilizers
export const getFertilizers = async (req, res) => {
  try {
    const { fertilizerType, search } = req.query;
    
    let query = { isActive: true };
    
    if (fertilizerType && fertilizerType !== "All Types") {
      query.fertilizerType = fertilizerType;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const fertilizers = await IFertilizer.find(query).sort({ createdAt: -1 });
    res.status(200).json(fertilizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single fertilizer
export const getFertilizer = async (req, res) => {
  try {
    const fertilizer = await IFertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    res.status(200).json(fertilizer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new fertilizer
export const createFertilizer = async (req, res) => {
  try {
    const { name, quantity, remaining, unit, fertilizerType, expiryDate } = req.body;
    
    const fertilizer = new IFertilizer({
      name,
      quantity,
      remaining,
      unit,
      fertilizerType,
      expiryDate
    });
    
    const savedFertilizer = await fertilizer.save();
    res.status(201).json(savedFertilizer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update fertilizer
export const updateFertilizer = async (req, res) => {
  try {
    const fertilizer = await IFertilizer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    res.status(200).json(fertilizer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete fertilizer (soft delete)
export const deleteFertilizer = async (req, res) => {
  try {
    const fertilizer = await IFertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    fertilizer.isActive = false;
    await fertilizer.save();
    
    res.status(200).json({ message: 'Fertilizer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refill fertilizer
export const refillFertilizer = async (req, res) => {
  try {
    const { refillQuantity } = req.body;
    const fertilizer = await IFertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    await fertilizer.refillStock(parseInt(refillQuantity));
    
    res.status(200).json(fertilizer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record usage
export const useFertilizer = async (req, res) => {
  try {
    const { quantityUsed, recordedBy } = req.body;
    const fertilizer = await IFertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    if (fertilizer.remaining < quantityUsed) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    await fertilizer.recordUsage(quantityUsed, recordedBy);
    res.status(200).json(fertilizer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get usage data for chart
export const getUsageData = async (req, res) => {
  try {
    const fertilizer = await IFertilizer.findById(req.params.id);
    
    if (!fertilizer) {
      return res.status(404).json({ message: 'Fertilizer not found' });
    }
    
    // If no usage history exists, generate sample data for demonstration
    if (!fertilizer.usageHistory || fertilizer.usageHistory.length === 0) {
      // Generate sample usage data for the past 6 months
      const sampleData = generateSampleUsageData();
      return res.status(200).json(sampleData);
    }
    
    // Process actual usage data
    const monthlyUsage = {};
    
    fertilizer.usageHistory.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!monthlyUsage[monthYear]) {
        monthlyUsage[monthYear] = {
          month: monthName,
          usage: 0
        };
      }
      
      monthlyUsage[monthYear].usage += entry.quantityUsed;
    });
    
    // Convert to array and sort by month
    const usageData = Object.values(monthlyUsage).sort((a, b) => {
      return new Date(a.month) - new Date(b.month);
    });
    
    res.status(200).json(usageData);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate sample usage data
const generateSampleUsageData = () => {
  const months = [];
  const currentDate = new Date();
  
  // Generate data for the past 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const usage = Math.floor(Math.random() * 20) + 5; // Random usage between 5-25
    
    months.push({
      month: monthName,
      usage: usage
    });
  }
  
  return months;
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockFertilizers = await IFertilizer.find({
      isActive: true,
      $expr: { $lt: ['$remaining', { $multiply: ['$quantity', 0.2] }] } // Less than 20% remaining
    });
    
    res.status(200).json(lowStockFertilizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expiring soon alerts
export const getExpiringAlerts = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringFertilizers = await IFertilizer.find({
      isActive: true,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
    });
    
    res.status(200).json(expiringFertilizers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};