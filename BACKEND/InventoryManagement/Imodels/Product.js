// Product.js
import mongoose from "mongoose";
import QRCode from 'qrcode';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Milk Product', 'Meat', 'Eggs', 'Honey', 'Material', 'Vegetables', 'Fruits']
  },
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'liter', 'dozen', 'jar', 'unit', 'pack']
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: true
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  market: {
    type: String,
    required: true,
    enum: ['Local', 'Export'],
    default: 'Local'
  },
  image: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon'],
    default: 'In Stock'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  minStockLevel: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reviews: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for better query performance
productSchema.index({ name: 1, category: 1 });
productSchema.index({ expiryDate: 1 });

// Middleware to update status before saving
productSchema.pre('save', function(next) {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  // Reset status to In Stock first
  this.status = 'In Stock';
  // Check if stock is low or out of stock
  if (this.stock.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stock.quantity < this.minStockLevel) {
    this.status = 'Low Stock';
  }
  // Check if product is expiring soon (within 2 days) but not expired yet
  if (this.expiryDate <= twoDaysFromNow && this.expiryDate >= now && this.status === 'In Stock') {
    this.status = 'Expiring Soon';
  }
  // Check if product is already expired
  if (this.expiryDate < now) {
    this.status = 'Out of Stock';
  }
  next();
});

// Static method to calculate expiry date based on category
productSchema.statics.calculateExpiryDate = function(category, creationDate) {
  const creation = creationDate ? new Date(creationDate) : new Date();
  const expiryDate = new Date(creation);
  let daysToAdd = 0;
  switch(category) {
    case 'Milk Product':
    case 'Meat':
      daysToAdd = 7;
      break;
    case 'Eggs':
      daysToAdd = 30;
      break;
    case 'Honey':
    case 'Material':
      daysToAdd = 365;
      break;
    case 'Vegetables':
    case 'Fruits':
      daysToAdd = 10;
      break;
    default:
      daysToAdd = 7;
  }
  expiryDate.setDate(expiryDate.getDate() + daysToAdd);
  return expiryDate;
};

// Method to update status based on current conditions
productSchema.methods.updateStatus = function() {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  // Reset status
  this.status = 'In Stock';
  // Check stock levels
  if (this.stock.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.stock.quantity < this.minStockLevel) {
    this.status = 'Low Stock';
  }
  // Check expiry (only if not already out of stock or low stock)
  if (this.status === 'In Stock') {
    if (this.expiryDate <= twoDaysFromNow && this.expiryDate >= now) {
      this.status = 'Expiring Soon';
    } else if (this.expiryDate < now) {
      this.status = 'Out of Stock';
    }
  }
  return this.status;
};

// Generate QR code for product
productSchema.methods.generateQRCode = async function() {
  try {
    const productInfo = {
      id: this._id,
      name: this.name,
      category: this.category,
      stock: this.stock,
      price: this.price,
      creationDate: this.creationDate,
      expiryDate: this.expiryDate,
      market: this.market
    };
    this.qrCode = await QRCode.toDataURL(JSON.stringify(productInfo));
    return this.qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

const Product = mongoose.model('Product', productSchema);
export default Product;