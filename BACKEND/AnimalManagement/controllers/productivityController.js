import Productivity from '../models/Productivity.js';
import Animal from '../models/Animal.js';

// Create productivity record
export const createProductivityRecord = async (req, res) => {
  try {
    const { animalId, batchId, isGroup, productType, quantity, unit, date, notes } = req.body;

    // Validate required fields
    if (!productType || quantity === undefined) {
      return res.status(400).json({ message: 'Product type and quantity are required' });
    }

    // If it's for an individual animal, verify the animal exists
    if (!isGroup && animalId) {
      const animal = await Animal.findById(animalId);
      if (!animal) {
        return res.status(404).json({ message: 'Animal not found' });
      }
    }

    // If it's for a batch, verify batch exists and has animals
    if (isGroup && batchId) {
      const batchAnimals = await Animal.find({ batchId });
      if (batchAnimals.length === 0) {
        return res.status(404).json({ message: 'Batch not found or empty' });
      }
    }

    const record = new Productivity({
      animalId: isGroup ? null : animalId,
      batchId: isGroup ? batchId : null,
      isGroup,
      productType,
      quantity: parseFloat(quantity),
      unit: unit || '',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      recordedBy: req.user?.name || 'System'
    });

    await record.save();

    // Populate animal data for response
    const populatedRecord = await Productivity.findById(record._id)
      .populate('animalId', 'animalId data');

    res.status(201).json({
      message: 'Productivity record created successfully',
      record: populatedRecord
    });
  } catch (error) {
    console.error('Create productivity record error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get productivity records for an animal
export const getAnimalProductivity = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { startDate, endDate, productType } = req.query;

    let query = { animalId, isGroup: false };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Add product type filter if provided
    if (productType) {
      query.productType = productType;
    }

    const records = await Productivity.find(query)
      .populate('animalId', 'animalId data')
      .sort({ date: -1 });

    res.json({
      animalId,
      records,
      totalRecords: records.length,
      totalQuantity: records.reduce((sum, record) => sum + record.quantity, 0)
    });
  } catch (error) {
    console.error('Get animal productivity error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get productivity records for a batch/group
export const getBatchProductivity = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate, productType } = req.query;

    let query = { batchId, isGroup: true };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Add product type filter if provided
    if (productType) {
      query.productType = productType;
    }

    const records = await Productivity.find(query)
      .sort({ date: -1 });

    // Get batch animals for additional info
    const batchAnimals = await Animal.find({ batchId })
      .populate('type', 'name')
      .select('animalId data type');

    res.json({
      batchId,
      records,
      batchAnimals,
      totalRecords: records.length,
      totalQuantity: records.reduce((sum, record) => sum + record.quantity, 0),
      averagePerAnimal: batchAnimals.length > 0 ? 
        records.reduce((sum, record) => sum + record.quantity, 0) / batchAnimals.length : 0
    });
  } catch (error) {
    console.error('Get batch productivity error:', error);
    res.status(500).json({ message: error.message });
  }
};



// Get productivity summary for dashboard
export const getProductivitySummary = async (req, res) => {
  try {
    const { animalType, period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Build query
    let query = { date: { $gte: startDate } };

    // Filter by animal type if provided
    if (animalType) {
      const animals = await Animal.find({ type: animalType }).select('_id');
      const animalIds = animals.map(animal => animal._id);
      query.$or = [
        { animalId: { $in: animalIds }, isGroup: false },
        { 
          batchId: { $exists: true }, 
          isGroup: true,
          'animalId.type': animalType 
        }
      ];
    }

    const records = await Productivity.find(query)
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .sort({ date: -1 });

    // Group by product type
    const summaryByProduct = records.reduce((acc, record) => {
      const productType = record.productType;
      if (!acc[productType]) {
        acc[productType] = {
          totalQuantity: 0,
          records: [],
          averagePerDay: 0
        };
      }
      acc[productType].totalQuantity += record.quantity;
      acc[productType].records.push(record);
      return acc;
    }, {});

    // Calculate daily averages
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    Object.keys(summaryByProduct).forEach(productType => {
      summaryByProduct[productType].averagePerDay = 
        summaryByProduct[productType].totalQuantity / Math.max(1, daysDiff);
    });

    res.json({
      period,
      startDate,
      endDate: now,
      totalRecords: records.length,
      totalQuantity: records.reduce((sum, record) => sum + record.quantity, 0),
      byProductType: summaryByProduct,
      allRecords: records
    });
  } catch (error) {
    console.error('Get productivity summary error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update productivity record
export const updateProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { productType, quantity, unit, date, notes } = req.body;

    const updateData = {
      ...(productType && { productType }),
      ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
      ...(unit !== undefined && { unit }),
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date()
    };

    const updatedRecord = await Productivity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('animalId', 'animalId data');

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Productivity record not found' });
    }

    res.json({
      message: 'Productivity record updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Update productivity record error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete productivity record
export const deleteProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await Productivity.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Productivity record not found' });
    }

    res.json({
      message: 'Productivity record deleted successfully',
      record: deletedRecord
    });
  } catch (error) {
    console.error('Delete productivity record error:', error);
    res.status(500).json({ message: error.message });
  }
};


// Get productivity trends over time
export const getProductivityTrends = async (req, res) => {
  try {
    const { animalType, productType, timeframe = '30days' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch(timeframe) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build query
    let query = { 
      date: { 
        $gte: startDate,
        $lte: now
      }
    };

    if (productType) {
      query.productType = productType;
    }

    // Filter by animal type if provided
    if (animalType) {
      const animals = await Animal.find({ type: animalType }).select('_id');
      const animalIds = animals.map(animal => animal._id);
      query.$or = [
        { animalId: { $in: animalIds }, isGroup: false },
        { 
          batchId: { $exists: true }, 
          isGroup: true,
          'animalId.type': animalType 
        }
      ];
    }

    const records = await Productivity.find(query)
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name'
        }
      })
      .sort({ date: 1 });

      

    // Group by date
    const trends = records.reduce((acc, record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          totalQuantity: 0,
          records: [],
          animalCount: new Set()
        };
      }
      acc[dateStr].totalQuantity += record.quantity;
      acc[dateStr].records.push(record);
      
      // Track unique animals for average calculation
      if (record.animalId) {
        acc[dateStr].animalCount.add(record.animalId._id.toString());
      }
      
      return acc;
    }, {});

    // Convert to array and calculate averages
    const trendsArray = Object.values(trends).map(day => ({
      ...day,
      averagePerAnimal: day.animalCount.size > 0 ? day.totalQuantity / day.animalCount.size : 0,
      animalCount: day.animalCount.size
    }));

    res.json({
      timeframe,
      startDate,
      endDate: now,
      productType,
      animalType,
      trends: trendsArray,
      totalRecords: records.length,
      totalQuantity: records.reduce((sum, record) => sum + record.quantity, 0)
    });
  } catch (error) {
    console.error('Get productivity trends error:', error);
    res.status(500).json({ message: error.message });
  }
};