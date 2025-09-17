// server.js (NEW FILE - create in root directory)
import app from './app.js';
import mongoose from 'mongoose';
import cron from 'node-cron';
import Product from "./InventoryManagement/Imodels/Product.js";

// MongoDB Connection
mongoose.connect("mongodb+srv://EasyFarming:sliit123@easyFarming.owlbj1f.mongodb.net/EasyFarming?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log("✅ Connected to MongoDB (Database: 'EasyFarming')");
    
    // Start the cron job after successful database connection
    startCronJob();
    
    // Start the server
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch(err => console.error("❌ MongoDB connection failed:", err));

// Daily product status update cron job
const startCronJob = () => {
  // Run every day at midnight to update product statuses
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('⏰ Running daily product status update...');
      
      const products = await Product.find({ isActive: true });
      let updatedCount = 0;
      
      for (const product of products) {
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
          updatedCount++;
        }
      }
      
      console.log(`✅ Product status update completed. Updated ${updatedCount} of ${products.length} products.`);
    } catch (error) {
      console.error('❌ Error updating product statuses:', error);
    }
  });
  
  console.log('✅ Daily product status update cron job scheduled (runs at midnight every day)');
};