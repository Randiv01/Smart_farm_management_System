const express = require('express');
const router = express.Router();
const exportMarketController = require('./IexportmarketController');

// Routes for export market operations
router.get('/', exportMarketController.getAllExportMarkets);
router.get('/:id', exportMarketController.getExportMarket);
router.post('/', exportMarketController.createExportMarket);
router.put('/:id', exportMarketController.updateExportMarket);
router.delete('/:id', exportMarketController.deleteExportMarket);

module.exports = router;