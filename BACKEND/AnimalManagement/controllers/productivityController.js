import AnimalProductivity from '../models/AnimalProductivity.js'; // Changed from 'Productivity'
import Animal from '../models/Animal.js';
import AnimalType from '../models/AnimalType.js';
import mongoose from 'mongoose';

// Create productivity record with validation against animal type fields
export const createProductivityRecord = async (req, res) => {
  try {
    const { animalId, batchId, isGroup, date, notes, recordedBy, ...productivityData } = req.body;

    if (!animalId && !batchId) {
      return res.status(400).json({ message: 'Animal ID or Batch ID is required' });
    }

    let animalType;
    let animal;
    let batchAnimals = [];

    if (isGroup && batchId) {
      batchAnimals = await Animal.find({ batchId }).populate('type').lean();
      if (batchAnimals.length === 0) {
        return res.status(404).json({ message: 'Batch not found or empty' });
      }
      animalType = batchAnimals[0].type;
    } else if (animalId) {
      animal = await Animal.findById(animalId).populate('type').lean();
      if (!animal) {
        return res.status(404).json({ message: 'Animal not found' });
      }
      animalType = animal.type;
    }

    if (animalType && animalType.productivityFields) {
      const validationErrors = [];
      
      animalType.productivityFields.forEach(field => {
        if (field.required && !productivityData[field.name]) {
          validationErrors.push(`${field.label} is required`);
        }
        
        if (productivityData[field.name] !== undefined) {
          if (field.type === 'number' && isNaN(Number(productivityData[field.name]))) {
            validationErrors.push(`${field.label} must be a number`);
          }
        }
      });
      
      Object.keys(productivityData).forEach(key => {
        if (!animalType.productivityFields.find(f => f.name === key)) {
          validationErrors.push(`Field '${key}' is not defined for this animal type`);
        }
      });
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
      }
    }

    const recordData = {
      animalId: isGroup ? null : animalId,
      batchId: isGroup ? batchId : null,
      isGroup,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      recordedBy: recordedBy || req.user?.name || 'System',
      ...productivityData
    };

    const record = new AnimalProductivity(recordData); // Changed
    await record.save();

    const populatedRecord = await AnimalProductivity.findById(record._id) // Changed
      .populate('animalId', 'animalId data')
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name productivityFields'
        }
      }).lean();

    res.status(201).json({
      message: 'Productivity record created successfully',
      record: populatedRecord
    });
  } catch (error) {
    console.error('Create productivity record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity records for an animal
export const getAnimalProductivity = async (req, res) => {
  try {
    const { animalId } = req.params;
    const { startDate, endDate, productType } = req.query;

    const animal = await Animal.findById(animalId).populate('type').lean();
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    let query = { animalId, isGroup: false };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (productType) query.productType = productType;

    const records = await AnimalProductivity.find(query) // Changed
      .populate('animalId', 'animalId data')
      .sort({ date: -1 })
      .lean();

    const fieldTotals = {};
    const fieldAverages = {};
    
    if (animal.type?.productivityFields) {
      animal.type.productivityFields.forEach(field => {
        const fieldRecords = records.filter(record => record[field.name] !== undefined);
        const total = fieldRecords.reduce((sum, record) => sum + (Number(record[field.name]) || 0), 0);
        fieldTotals[field.name] = total;
        fieldAverages[field.name] = fieldRecords.length > 0 ? total / fieldRecords.length : 0;
      });
    }

    res.json({
      animalId,
      animalType: animal.type?.name || 'Unknown',
      productivityFields: animal.type?.productivityFields || [],
      records,
      totalRecords: records.length,
      fieldTotals,
      fieldAverages
    });
  } catch (error) {
    console.error('Get animal productivity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity records for a batch
export const getBatchProductivity = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate, productType } = req.query;

    let query = { batchId, isGroup: true };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (productType) query.productType = productType;

    const records = await AnimalProductivity.find(query) // Changed
      .sort({ date: -1 })
      .lean();

    const batchAnimals = await Animal.find({ batchId })
      .populate('type', 'name productivityFields')
      .select('animalId data type')
      .lean();

    const fieldTotals = {};
    const fieldAverages = {};
    
    if (batchAnimals.length > 0 && batchAnimals[0].type?.productivityFields) {
      batchAnimals[0].type.productivityFields.forEach(field => {
        const fieldRecords = records.filter(record => record[field.name] !== undefined);
        const total = fieldRecords.reduce((sum, record) => sum + (Number(record[field.name]) || 0), 0);
        fieldTotals[field.name] = total;
        fieldAverages[field.name] = batchAnimals.length > 0 ? total / batchAnimals.length : 0;
      });
    }

    res.json({
      batchId,
      records,
      batchAnimals,
      totalRecords: records.length,
      fieldTotals,
      fieldAverages
    });
  } catch (error) {
    console.error('Get batch productivity error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity analytics for dashboard
export const getProductivityAnalytics = async (req, res) => {
  try {
    const { animalTypeId, timeframe = 'month', groupBy = 'day' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case 'day': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = { date: { $gte: startDate, $lte: now } };

    if (animalTypeId) {
      const animals = await Animal.find({ type: animalTypeId }).select('_id').lean();
      const animalIds = animals.map(animal => animal._id);
      query.$or = [
        { animalId: { $in: animalIds }, isGroup: false },
        { batchId: { $exists: true }, isGroup: true }
      ];
    }

    const records = await AnimalProductivity.find(query) // Changed
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name productivityFields'
        }
      })
      .sort({ date: 1 })
      .lean();

    let animalType;
    if (animalTypeId) {
      animalType = await AnimalType.findById(animalTypeId).lean();
    }

    const analytics = {};
    const dates = [];
    
    records.forEach(record => {
      let dateKey;
      switch (groupBy) {
        case 'hour': dateKey = record.date.toISOString().slice(0, 13); break;
        case 'day': dateKey = record.date.toISOString().split('T')[0]; break;
        case 'week':
          const weekNum = Math.ceil((record.date.getDate() + 6) / 7);
          dateKey = `${record.date.getFullYear()}-W${weekNum}`;
          break;
        case 'month': dateKey = record.date.toISOString().slice(0, 7); break;
        default: dateKey = record.date.toISOString().split('T')[0];
      }
      
      if (!analytics[dateKey]) {
        analytics[dateKey] = { date: dateKey, records: 0, values: {}, animals: new Set() };
        dates.push(dateKey);
      }
      
      analytics[dateKey].records++;
      if (record.animalId) {
        analytics[dateKey].animals.add(record.animalId._id.toString());
      }
      
      if (animalType?.productivityFields) {
        animalType.productivityFields.forEach(field => {
          if (record[field.name] !== undefined) {
            if (!analytics[dateKey].values[field.name]) {
              analytics[dateKey].values[field.name] = { total: 0, count: 0, average: 0 };
            }
            analytics[dateKey].values[field.name].total += Number(record[field.name]) || 0;
            analytics[dateKey].values[field.name].count++;
          }
        });
      }
    });
    
    Object.keys(analytics).forEach(dateKey => {
      Object.keys(analytics[dateKey].values).forEach(fieldName => {
        const fieldData = analytics[dateKey].values[fieldName];
        fieldData.average = fieldData.count > 0 ? fieldData.total / fieldData.count : 0;
      });
      analytics[dateKey].animalCount = analytics[dateKey].animals.size;
      delete analytics[dateKey].animals;
    });

    const analyticsArray = dates.sort().map(dateKey => analytics[dateKey]);

    res.json({
      timeframe,
      groupBy,
      startDate,
      endDate: now,
      animalType: animalType ? { _id: animalType._id, name: animalType.name, productivityFields: animalType.productivityFields } : null,
      analytics: analyticsArray,
      totalRecords: records.length
    });
  } catch (error) {
    console.error('Get productivity analytics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity summary for dashboard
export const getProductivitySummary = async (req, res) => {
  try {
    const { animalType, period = 'month' } = req.query;
    
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    let query = { date: { $gte: startDate } };

    if (animalType) {
      const animals = await Animal.find({ type: animalType }).select('_id').lean();
      const animalIds = animals.map(animal => animal._id);
      query.$or = [
        { animalId: { $in: animalIds }, isGroup: false },
        { batchId: { $exists: true }, isGroup: true }
      ];
    }

    const records = await AnimalProductivity.find(query) // Changed
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name productivityFields'
        }
      })
      .sort({ date: -1 })
      .lean();

    const summaryByProduct = records.reduce((acc, record) => {
      const productType = record.productType || 'default';
      if (!acc[productType]) {
        acc[productType] = { totalQuantity: 0, records: [], averagePerDay: 0 };
      }
      
      let quantity = 0;
      if (record.productType) {
        quantity = record.quantity || 0;
      } else if (record.animalId?.type?.productivityFields) {
        const numericField = record.animalId.type.productivityFields.find(f => f.type === 'number');
        if (numericField && record[numericField.name] !== undefined) {
          quantity = Number(record[numericField.name]) || 0;
        }
      }
      
      acc[productType].totalQuantity += quantity;
      acc[productType].records.push(record);
      return acc;
    }, {});

    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    Object.keys(summaryByProduct).forEach(productType => {
      summaryByProduct[productType].averagePerDay = summaryByProduct[productType].totalQuantity / Math.max(1, daysDiff);
    });

    res.json({
      period,
      startDate,
      endDate: now,
      totalRecords: records.length,
      totalQuantity: Object.values(summaryByProduct).reduce((sum, product) => sum + product.totalQuantity, 0),
      byProductType: summaryByProduct,
      allRecords: records
    });
  } catch (error) {
    console.error('Get productivity summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update productivity record
export const updateProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, notes, recordedBy, ...productivityData } = req.body;

    const existingRecord = await AnimalProductivity.findById(id) // Changed
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'productivityFields'
        }
      }).lean();

    if (!existingRecord) {
      return res.status(404).json({ message: 'Productivity record not found' });
    }

    if (existingRecord.animalId?.type?.productivityFields) {
      const validationErrors = [];
      const animalType = existingRecord.animalId.type;
      
      Object.keys(productivityData).forEach(key => {
        const definedField = animalType.productivityFields.find(f => f.name === key);
        if (!definedField) {
          validationErrors.push(`Field '${key}' is not defined for this animal type`);
        }
      });
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
      }
    }

    const updateData = {
      ...productivityData,
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes }),
      ...(recordedBy !== undefined && { recordedBy }),
      updatedAt: new Date()
    };

    const updatedRecord = await AnimalProductivity.findByIdAndUpdate( // Changed
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'animalId',
      populate: {
        path: 'type',
        select: 'name productivityFields'
      }
    }).lean();

    res.json({
      message: 'Productivity record updated successfully',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Update productivity record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete productivity record
export const deleteProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await AnimalProductivity.findByIdAndDelete(id).lean(); // Changed

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Productivity record not found' });
    }

    res.json({
      message: 'Productivity record deleted successfully',
      record: deletedRecord
    });
  } catch (error) {
    console.error('Delete productivity record error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity trends over time
export const getProductivityTrends = async (req, res) => {
  try {
    const { animalTypeId, timeframe = '30days' } = req.query;

    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7days': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30days': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90days': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case 'year': startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = { date: { $gte: startDate, $lte: now } };

    if (animalTypeId) {
      const animals = await Animal.find({ type: animalTypeId }).select('_id').lean();
      const animalIds = animals.map(animal => animal._id);
      query.$or = [
        { animalId: { $in: animalIds }, isGroup: false },
        { batchId: { $exists: true }, isGroup: true }
      ];
    }

    const records = await AnimalProductivity.find(query) // Changed
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name productivityFields'
        }
      })
      .sort({ date: 1 })
      .lean();

    let animalType;
    if (animalTypeId) {
      animalType = await AnimalType.findById(animalTypeId).lean();
    }

    const trends = records.reduce((acc, record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, totalQuantity: 0, records: [], animalCount: new Set() };
      }
      
      let quantity = 0;
      if (record.productType) {
        quantity = record.quantity || 0;
      } else if (animalType?.productivityFields) {
        const numericField = animalType.productivityFields.find(f => f.type === 'number');
        if (numericField && record[numericField.name] !== undefined) {
          quantity = Number(record[numericField.name]) || 0;
        }
      }
      
      acc[dateStr].totalQuantity += quantity;
      acc[dateStr].records.push(record);
      
      if (record.animalId) {
        acc[dateStr].animalCount.add(record.animalId._id.toString());
      }
      
      return acc;
    }, {});

    const trendsArray = Object.values(trends).map(day => ({
      ...day,
      averagePerAnimal: day.animalCount.size > 0 ? day.totalQuantity / day.animalCount.size : 0,
      animalCount: day.animalCount.size
    }));

    res.json({
      timeframe,
      startDate,
      endDate: now,
      animalType: animalType ? { _id: animalType._id, name: animalType.name } : null,
      trends: trendsArray,
      totalRecords: records.length,
      totalQuantity: trendsArray.reduce((sum, day) => sum + day.totalQuantity, 0)
    });
  } catch (error) {
    console.error('Get productivity trends error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllProductivityRecords = async (req, res) => {
  try {
    const records = await AnimalProductivity.find({}) // Changed
      .populate({
        path: 'animalId',
        populate: {
          path: 'type',
          select: 'name productivityFields'
        }
      })
      .lean();

    res.json({
      allRecords: records
    });
  } catch (error) {
    console.error('Get all productivity records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get productivity totals for different time periods
export const getProductivityTotals = async (req, res) => {
  try {
    const { animalTypeId, fieldName } = req.query;

    if (!animalTypeId || !fieldName) {
      return res.status(400).json({ message: 'Animal type ID and field name are required' });
    }

    const animals = await Animal.find({ type: animalTypeId }).select('_id').lean();
    const animalIds = animals.map(animal => animal._id);

    const now = new Date();
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const weekStart = new Date(new Date().setDate(now.getDate() - 7));
    const monthStart = new Date(new Date().setDate(now.getDate() - 30));
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const queries = {
      daily: { date: { $gte: todayStart }, animalId: { $in: animalIds }, isGroup: false, [fieldName]: { $exists: true } },
      weekly: { date: { $gte: weekStart }, animalId: { $in: animalIds }, isGroup: false, [fieldName]: { $exists: true } },
      monthly: { date: { $gte: monthStart }, animalId: { $in: animalIds }, isGroup: false, [fieldName]: { $exists: true } },
      yearly: { date: { $gte: yearStart }, animalId: { $in: animalIds }, isGroup: false, [fieldName]: { $exists: true } },
      allTime: { animalId: { $in: animalIds }, isGroup: false, [fieldName]: { $exists: true } }
    };

    const results = await Promise.all(Object.values(queries).map(query =>
      AnimalProductivity.aggregate([ // Changed
        { $match: query },
        { $group: { _id: null, total: { $sum: `$${fieldName}` } } }
      ])
    ));

    const [daily, weekly, monthly, yearly, allTime] = results.map(result => result[0]?.total || 0);

    res.json({
      animalTypeId,
      fieldName,
      totals: { daily, weekly, monthly, yearly, allTime },
      animalCount: animals.length
    });
  } catch (error) {
    console.error('Get productivity totals error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};