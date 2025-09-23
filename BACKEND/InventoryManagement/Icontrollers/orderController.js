import Order from "../Imodels/Order.js";
import Product from "../Imodels/Product.js";

// Create new order from payment
export const createOrderFromPayment = async (req, res) => {
  try {
    const { 
      customer, 
      items, 
      paymentMethod, 
      subtotal, 
      shipping, 
      tax, 
      totalAmount,
      transactionId 
    } = req.body;
   
    // Validate required fields
    if (!customer || !items || !paymentMethod || !totalAmount) {
      return res.status(400).json({
        message: "Missing required order fields"
      });
    }

    // Validate items and check stock availability
    const stockValidation = await validateStockAvailability(items);
    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message
      });
    }

    // Calculate estimated delivery (3 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
   
    // Prepare order items with totals
    const orderItems = items.map(item => ({
      productId: item._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
      total: item.price * item.quantity
    }));
   
    // Generate order number
    const orderNumber = Order.generateOrderNumber();
   
    // Create order
    const order = new Order({
      orderNumber,
      customer,
      items: orderItems,
      subtotal: subtotal || orderItems.reduce((sum, item) => sum + item.total, 0),
      shipping: shipping || 5.00,
      tax: tax || 0,
      totalAmount,
      paymentMethod,
      paymentStatus: 'completed',
      status: 'confirmed',
      estimatedDelivery,
      transactionId
    });
   
    const savedOrder = await order.save();
   
    // Update product stock quantities - DECREMENT STOCK
    await updateProductStock(items, 'decrement');
   
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number conflict. Please try again.'
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Validate stock availability before creating order
const validateStockAvailability = async (items) => {
  try {
    for (const item of items) {
      const productId = item._id || item.productId;
      
      if (!productId) {
        return {
          valid: false,
          message: `Product ID missing for item: ${item.name}`
        };
      }

      // Find the product in database
      const product = await Product.findById(productId);
      
      if (!product) {
        return {
          valid: false,
          message: `Product not found: ${item.name}`
        };
      }

      if (!product.isActive) {
        return {
          valid: false,
          message: `Product is no longer available: ${item.name}`
        };
      }

      if (product.stock.quantity < item.quantity) {
        return {
          valid: false,
          message: `Insufficient stock for ${item.name}. Available: ${product.stock.quantity}, Requested: ${item.quantity}`
        };
      }

      // Check if product is expired
      if (new Date(product.expiryDate) < new Date()) {
        return {
          valid: false,
          message: `Product expired: ${item.name}`
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('Stock validation error:', error);
    return {
      valid: false,
      message: 'Error validating stock availability'
    };
  }
};

// Update product stock (increment or decrement)
const updateProductStock = async (items, operation) => {
  try {
    for (const item of items) {
      const productId = item._id || item.productId;
      
      if (!productId) {
        console.warn(`Skipping stock update for item without ID: ${item.name}`);
        continue;
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        console.warn(`Product not found for stock update: ${productId}`);
        continue;
      }

      const quantityChange = operation === 'decrement' ? -item.quantity : item.quantity;
      
      // Update stock quantity
      product.stock.quantity += quantityChange;
      
      // Ensure stock doesn't go negative
      if (product.stock.quantity < 0) {
        product.stock.quantity = 0;
      }

      // Update product status based on new stock level
      product.updateStatus();
      
      await product.save();
      
      console.log(`Stock updated for ${product.name}: ${operation === 'decrement' ? 'Decreased' : 'Increased'} by ${item.quantity}. New stock: ${product.stock.quantity}`);
    }
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw new Error('Failed to update product stock');
  }
};

// Get all orders (for admin)
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search, email } = req.query;
   
    let query = { isActive: true };
   
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
   
    // Search by order number or customer email/name
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (email) {
      query['customer.email'] = { $regex: email, $options: 'i' };
    }
   
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
   
    const total = await Order.countDocuments(query);
   
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get orders by customer email
export const getCustomerOrders = async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 10 } = req.query;
   
    const orders = await Order.find({
      'customer.email': email,
      isActive: true
    })
    .sort({ orderDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
   
    const total = await Order.countDocuments({
      'customer.email': email,
      isActive: true
    });
   
    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
   
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
   
    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
   
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
   
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
   
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
   
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, transactionId } = req.body;
   
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status value'
      });
    }
   
    const updateData = { paymentStatus };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }
   
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
   
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
   
    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Cancel order - RESTORE STOCK
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
   
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = 'refunded';
    await order.save();
   
    // Restore product stock quantities - INCREMENT STOCK
    await updateProductStock(order.items, 'increment');
   
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete order (soft delete) - RESTORE STOCK if not delivered/cancelled
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Soft delete
    order.isActive = false;
    await order.save();
    
    // Restore stock if the order is not delivered or cancelled
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      await updateProductStock(order.items, 'increment');
    }
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({ isActive: true });
    const pendingOrders = await Order.countDocuments({
      status: 'pending',
      isActive: true
    });
    const confirmedOrders = await Order.countDocuments({
      status: 'confirmed',
      isActive: true
    });
    const processingOrders = await Order.countDocuments({
      status: 'processing',
      isActive: true
    });
    const shippedOrders = await Order.countDocuments({
      status: 'shipped',
      isActive: true
    });
    const deliveredOrders = await Order.countDocuments({
      status: 'delivered',
      isActive: true
    });
    const cancelledOrders = await Order.countDocuments({
      status: 'cancelled',
      isActive: true
    });
    
    const totalRevenue = await Order.aggregate([
      { 
        $match: { 
          isActive: true, 
          status: 'delivered',
          paymentStatus: 'completed'
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          isActive: true,
          status: 'delivered',
          paymentStatus: 'completed',
          orderDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Send order status notification
export const sendOrderNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, status } = req.body;
   
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
   
    // Simulate email sending (in production, integrate with email service)
    console.log(`Order notification sent to ${email}`);
    console.log(`Order: ${order.orderNumber}, Status: ${status}`);
   
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      order: order.orderNumber,
      status: status
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Process payment simulation
export const processPayment = async (req, res) => {
  try {
    const { orderData, paymentDetails } = req.body;
    
    console.log('Received payment request:', { 
      customer: orderData.customer?.email,
      itemsCount: orderData.items?.length,
      totalAmount: orderData.totalAmount 
    });
    
    // Validate required fields
    if (!orderData || !orderData.customer || !orderData.items || !orderData.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required order data"
      });
    }

    // Validate stock availability before processing payment
    const stockValidation = await validateStockAvailability(orderData.items);
    if (!stockValidation.valid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message
      });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random payment failure (5% chance for testing)
    if (Math.random() < 0.05) {
      return res.status(400).json({
        success: false,
        message: "Payment declined. Please check your card details or try a different payment method."
      });
    }
    
    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Calculate estimated delivery (3 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
    
    // Prepare order items with totals
    const orderItems = orderData.items.map(item => ({
      productId: item._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
      total: item.price * item.quantity
    }));
    
    // Calculate totals if not provided
    const subtotal = orderData.subtotal || orderItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = orderData.shipping || 5.00;
    const tax = orderData.tax || subtotal * 0.08;
    const totalAmount = orderData.totalAmount || subtotal + shipping + tax;
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create order object
    const order = new Order({
      orderNumber,
      customer: orderData.customer,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      totalAmount,
      paymentMethod: orderData.paymentMethod || 'card',
      paymentStatus: 'completed',
      status: 'confirmed',
      estimatedDelivery,
      transactionId
    });
    
    // Save order to database
    const savedOrder = await order.save();
    console.log('Order saved successfully:', savedOrder.orderNumber);
    
    // Update product stock quantities - DECREMENT STOCK
    await updateProductStock(orderData.items, 'decrement');
    
    res.status(201).json({
      success: true,
      message: 'Payment processed and order created successfully',
      order: savedOrder
    });
    
  } catch (error) {
    console.error('Payment processing error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number conflict. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Payment processing failed: ' + error.message
    });
  }
};