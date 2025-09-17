const ExportMarket = require('./IExportmarket');
const Product = require('./Product'); // Assuming Product model exists
const mongoose = require('mongoose');

// Get all export market entries
exports.getAllExportMarkets = async (req, res) => {
  try {
    const exportMarkets = await ExportMarket.find()
      .populate('product', 'name category stock price market')
      .lean();
    
    res.status(200).json({
      success: true,
      data: exportMarkets
    });
  } catch (error) {
    console.error('Error fetching export markets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch export markets'
    });
  }
};

// Get single export market entry
exports.getExportMarket = async (req, res) => {
  try {
    const exportMarket = await ExportMarket.findById(req.params.id)
      .populate('product', 'name category stock price market')
      .lean();
    
    if (!exportMarket) {
      return res.status(404).json({
        success: false,
        message: 'Export market entry not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: exportMarket
    });
  } catch (error) {
    console.error('Error fetching export market:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch export market'
    });
  }
};

// Create new export market entry
exports.createExportMarket = async (req, res) => {
  try {
    const { productId, exportCountry, exportDate, quantity, unit, exportPrice } = req.body;
    
    // Validate product exists and is marked for export
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.market !== 'Export') {
      return res.status(400).json({
        success: false,
        message: 'Product is not marked for export market'
      });
    }
    
    // Validate stock availability
    if (product.stock.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for export'
      });
    }
    
    // Create export market entry
    const exportMarket = new ExportMarket({
      product: productId,
      exportCountry,
      exportDate,
      quantity,
      unit: unit || product.stock.unit,
      exportPrice
    });
    
    await exportMarket.save();
    
    // Update product stock
    product.stock.quantity -= quantity;
    await product.save();
    
    res.status(201).json({
      success: true,
      data: exportMarket
    });
  } catch (error) {
    console.error('Error creating export market entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create export market entry'
    });
  }
};

// Update export market entry
exports.updateExportMarket = async (req, res) => {
  try {
    const { exportCountry, exportDate, quantity, unit, exportPrice, status } = req.body;
    
    const exportMarket = await ExportMarket.findById(req.params.id);
    if (!exportMarket) {
      return res.status(404).json({
        success: false,
        message: 'Export market entry not found'
      });
    }
    
    // If updating quantity, validate stock
    if (quantity && quantity !== exportMarket.quantity) {
      const product = await Product.findById(exportMarket.product);
      const stockDifference = quantity - exportMarket.quantity;
      
      if (stockDifference > 0 && product.stock.quantity < stockDifference) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for updated quantity'
        });
      }
      
      // Update product stock
      product.stock.quantity -= stockDifference;
      await product.save();
    }
    
    // Update export market entry
    exportMarket.set({
      exportCountry: exportCountry || exportMarket.exportCountry,
      exportDate: exportDate || exportMarket.exportDate,
      quantity: quantity || exportMarket.quantity,
      unit: unit || exportMarket.unit,
      exportPrice: exportPrice || exportMarket.exportPrice,
      status: status || exportMarket.status
    });
    
    await exportMarket.save();
    
    res.status(200).json({
      success: true,
      data: exportMarket
    });
  } catch (error) {
    console.error('Error updating export market:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update export market'
    });
  }
};

// Delete export market entry
exports.deleteExportMarket = async (req, res) => {
  try {
    const exportMarket = await ExportMarket.findById(req.params.id);
    if (!exportMarket) {
      return res.status(404).json({
        success: false,
        message: 'Export market entry not found'
      });
    }
    
    // Restore product stock
    const product = await Product.findById(exportMarket.product);
    product.stock.quantity += exportMarket.quantity;
    await product.save();
    
    await exportMarket.remove();
    
    res.status(200).json({
      success: true,
      message: 'Export market entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting export market:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete export market'
    });
  }
};