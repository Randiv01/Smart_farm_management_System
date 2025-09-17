import AnimalFood from "../Imodels/AnimalFood.js";

// Get all animal foods
export const getAnimalFoods = async (req, res) => {
  try {
    const { targetAnimal, search } = req.query;
    
    let query = { isActive: true };
    
    if (targetAnimal && targetAnimal !== "All Animals") {
      query.targetAnimal = targetAnimal;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const animalFoods = await AnimalFood.find(query).sort({ createdAt: -1 });
    res.status(200).json(animalFoods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single animal food
export const getAnimalFood = async (req, res) => {
  try {
    const animalFood = await AnimalFood.findById(req.params.id);
    
    if (!animalFood) {
      return res.status(404).json({ message: 'Animal food not found' });
    }
    
    res.status(200).json(animalFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new animal food
export const createAnimalFood = async (req, res) => {
  try {
    const { name, quantity, remaining, unit, targetAnimal, expiryDate } = req.body;
    
    const animalFood = new AnimalFood({
      name,
      quantity,
      remaining,
      unit,
      targetAnimal,
      expiryDate
    });
    
    const savedAnimalFood = await animalFood.save();
    res.status(201).json(savedAnimalFood);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update animal food
export const updateAnimalFood = async (req, res) => {
  try {
    const animalFood = await AnimalFood.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!animalFood) {
      return res.status(404).json({ message: 'Animal food not found' });
    }
    
    res.status(200).json(animalFood);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete animal food (soft delete)
export const deleteAnimalFood = async (req, res) => {
  try {
    const animalFood = await AnimalFood.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!animalFood) {
      return res.status(404).json({ message: 'Animal food not found' });
    }
    
    res.status(200).json({ message: 'Animal food deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refill animal food
export const refillAnimalFood = async (req, res) => {
  try {
    const { refillQuantity } = req.body;
    const animalFood = await AnimalFood.findById(req.params.id);
    
    if (!animalFood) {
      return res.status(404).json({ message: 'Animal food not found' });
    }
    
    await animalFood.refillStock(parseInt(refillQuantity));
    
    res.status(200).json(animalFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record consumption
export const recordConsumption = async (req, res) => {
  try {
    const { quantityUsed, recordedBy } = req.body;
    const animalFood = await AnimalFood.findById(req.params.id);
    
    if (!animalFood) {
      return res.status(404).json({ message: 'Animal food not found' });
    }
    
    if (animalFood.remaining < quantityUsed) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    await animalFood.recordConsumption(quantityUsed, recordedBy);
    res.status(200).json(animalFood);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get consumption data for chart
export const getConsumptionData = async (req, res) => {
  try {
    const consumptionData = await AnimalFood.getMonthlyConsumption(req.params.id);
    
    // Format data for chart
    const formattedData = consumptionData.map(item => ({
      month: item.month.toLocaleString('default', { month: 'short', year: 'numeric' }),
      consumption: item.consumption
    }));
    
    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockFoods = await AnimalFood.find({
      isActive: true,
      $expr: { $lt: ['$remaining', { $multiply: ['$quantity', 0.2] }] } // Less than 20% remaining
    });
    
    res.status(200).json(lowStockFoods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expiring soon alerts
export const getExpiringAlerts = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringFoods = await AnimalFood.find({
      isActive: true,
      expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
    });
    
    res.status(200).json(expiringFoods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};