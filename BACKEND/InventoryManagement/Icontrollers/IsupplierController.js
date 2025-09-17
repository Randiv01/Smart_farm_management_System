import Supplier from "../Imodels/ISupplier.js";

// Get all suppliers
export const getSuppliers = async (req, res) => {
  try {
    const { type, search, page = 1, limit = 100 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by supplier type
    if (type && type !== 'All') {
      query.type = type;
    }
    
    // Search by name, company, or products
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { products: { $regex: search, $options: 'i' } }
      ];
    }
    
    const suppliers = await Supplier.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, name: 1 });
    
    const total = await Supplier.countDocuments(query);
    
    res.status(200).json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single supplier
export const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, company, type, email, phone, website, address, products, notes, image } = req.body;
    
    // Check if supplier with same email already exists
    const existingSupplier = await Supplier.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });
    
    if (existingSupplier) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    
    const supplierData = {
      name,
      company,
      type,
      email: email.toLowerCase(),
      phone,
      website: website || '',
      address: address || '',
      products,
      notes: notes || '',
      image: image || ''
    };
    
    const supplier = new Supplier(supplierData);
    const savedSupplier = await supplier.save();
    
    res.status(201).json(savedSupplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { name, company, type, email, phone, website, address, products, notes, image } = req.body;
    
    // Check if email is being changed to one that already exists
    if (email) {
      const existingSupplier = await Supplier.findOne({ 
        email: email.toLowerCase(), 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      
      if (existingSupplier) {
        return res.status(400).json({ message: 'Another supplier with this email already exists' });
      }
    }
    
    const updateData = {
      name,
      company,
      type,
      email: email ? email.toLowerCase() : undefined,
      phone,
      website,
      address,
      products,
      notes,
      image
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(200).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete supplier (soft delete)
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate supplier
export const rateSupplier = async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 0 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }
    
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    supplier.rating = rating;
    await supplier.save();
    
    res.status(200).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get suppliers by type
export const getSuppliersByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['Fertilizer', 'Animal Food', 'Both'].includes(type)) {
      return res.status(400).json({ message: 'Invalid supplier type' });
    }
    
    const suppliers = await Supplier.getByType(type);
    
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top rated suppliers
export const getTopRatedSuppliers = async (req, res) => {
  try {
    const { limit } = req.query;
    const suppliers = await Supplier.getTopRated(parseInt(limit) || 5);
    
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search suppliers
export const searchSuppliers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const suppliers = await Supplier.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { products: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).sort({ rating: -1, name: 1 });
    
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};