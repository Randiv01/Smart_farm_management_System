import Product from "../Imodels/Product.js";

// Get all products (for inventory management)
export const getProducts = async (req, res) => {
  try {
    const { category, search, market, page = 1, limit = 100 } = req.query;
    let query = { isActive: true };
    if (category && category !== 'All') {
      query.category = category;
    }
    if (market && market !== 'All') {
      query.market = market;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { market: { $regex: search, $options: 'i' } }
      ];
    }
    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    // Update status for each product based on current conditions
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        const oldStatus = product.status;
    
        // Update status based on current conditions
        product.status = 'In Stock';
    
        // Check stock levels
        if (product.stock.quantity <= 0) {
          product.status = 'Out of Stock';
        } else if (product.stock.quantity < product.minStockLevel) {
          product.status = 'Low Stock';
        }
    
        // Check expiry (only if not already out of stock or low stock)
        if (product.status === 'In Stock') {
          if (product.expiryDate <= twoDaysFromNow && product.expiryDate >= now) {
            product.status = 'Expiring Soon';
          } else if (product.expiryDate < now) {
            product.status = 'Out of Stock';
          }
        }
    
        // Only update if status changed
        if (oldStatus !== product.status) {
          await product.save();
        }
    
        return product;
      })
    );
    const total = await Product.countDocuments(query);
    res.status(200).json({
      products: updatedProducts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products for catalog (with filtering for customer view)
export const getCatalogProducts = async (req, res) => {
  try {
    const { category, search, market, page = 1, limit = 12 } = req.query;
    let query = { isActive: true };
    // Filter by category or group of categories
    if (category && category !== 'All') {
      if (category === 'Animal Product') {
        query.category = { $in: ['Milk Product', 'Meat', 'Eggs', 'Honey', 'Material'] };
      } else if (category === 'Plant Product') {
        query.category = { $in: ['Vegetables', 'Fruits'] };
      } else {
        query.category = category;
      }
    }
    // Filter by market
    if (market && market !== 'All') {
      query.market = market;
    }
    // Search by name, category, or market
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { market: { $regex: search, $options: 'i' } }
      ];
    }
    // Get products with pagination - only include fields needed for catalog
    const products = await Product.find(query)
      .select('name category price image description stock status expiryDate market')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await Product.countDocuments(query);
    res.status(200).json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { category, creationDate, stock, name, price, market, image, description } = req.body;
    // Validate category
    if (!['Milk Product', 'Meat', 'Eggs', 'Honey', 'Material', 'Vegetables', 'Fruits'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    // Calculate expiry date based on category
    const expiryDate = Product.calculateExpiryDate(category, creationDate);
    const productData = {
      name,
      category,
      stock: {
        quantity: stock.quantity,
        unit: stock.unit
      },
      price,
      creationDate,
      expiryDate,
      market,
      image: image || '',
      description: description || ''
    };
    const product = new Product(productData);
    // Generate QR code
    await product.generateQRCode();
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { category, creationDate, stock, name, price, market, image, description } = req.body;
    // Validate category
    if (!['Milk Product', 'Meat', 'Eggs', 'Honey', 'Material', 'Vegetables', 'Fruits'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    // Find existing product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Calculate expiry date if category or creation date changed
    let expiryDate = existingProduct.expiryDate;
    if (category !== existingProduct.category || creationDate !== existingProduct.creationDate.toISOString().split('T')[0]) {
      expiryDate = Product.calculateExpiryDate(category, creationDate);
    }
    const updateData = {
      name,
      category,
      stock: {
        quantity: stock.quantity,
        unit: stock.unit
      },
      price,
      creationDate,
      expiryDate,
      market,
      image: image || '',
      description: description || ''
    };
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    // Regenerate QR code if any important data changed
    if (name !== existingProduct.name || category !== existingProduct.category ||
        price !== existingProduct.price || market !== existingProduct.market) {
      await product.generateQRCode();
      await product.save();
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refill product stock
export const refillProduct = async (req, res) => {
  try {
    const { refillQuantity } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    // Update creation date to current date
    product.creationDate = new Date();
    // Recalculate expiry date based on new creation date
    product.expiryDate = Product.calculateExpiryDate(product.category, product.creationDate);
    // Add the refill quantity to current stock
    product.stock.quantity += parseInt(refillQuantity);
    // Update status based on new stock level
    product.updateStatus();
    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get low stock products
export const getLowStockProducts = async (req, res) => {
  try {
    const { market } = req.query;
    let query = {
      isActive: true,
      $expr: { $lt: ['$stock.quantity', '$minStockLevel'] }
    };
    if (market && market !== 'All') {
      query.market = market;
    }
    const lowStockProducts = await Product.find(query);
    res.status(200).json(lowStockProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expiring soon products (within 2 days)
export const getExpiringProducts = async (req, res) => {
  try {
    const { market } = req.query;
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    let query = {
      isActive: true,
      expiryDate: { $lte: twoDaysFromNow, $gte: now }
    };
    if (market && market !== 'All') {
      query.market = market;
    }
    const expiringProducts = await Product.find(query);
    res.status(200).json(expiringProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update all product statuses
export const updateAllStatuses = async (req, res) => {
  try {
    const { market } = req.query;
    let query = { isActive: true };
    if (market && market !== 'All') {
      query.market = market;
    }
    const products = await Product.find(query);
    const results = await Promise.all(
      products.map(async (product) => {
        const oldStatus = product.status;
    
        // Update status based on current conditions
        product.status = 'In Stock';
    
        // Check stock levels
        if (product.stock.quantity <= 0) {
          product.status = 'Out of Stock';
        } else if (product.stock.quantity < product.minStockLevel) {
          product.status = 'Low Stock';
        }
    
        // Check expiry (only if not already out of stock or low stock)
        if (product.status === 'In Stock') {
          const now = new Date();
          const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      
          if (product.expiryDate <= twoDaysFromNow && product.expiryDate >= now) {
            product.status = 'Expiring Soon';
          } else if (product.expiryDate < now) {
            product.status = 'Out of Stock';
          }
        }
    
        // Only save if status changed
        if (oldStatus !== product.status) {
          await product.save();
          return { id: product._id, updated: true, oldStatus, newStatus: product.status };
        }
    
        return { id: product._id, updated: false };
      })
    );
    res.status(200).json({
      message: 'Status update completed',
      results,
      updated: results.filter(r => r.updated).length,
      total: results.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};