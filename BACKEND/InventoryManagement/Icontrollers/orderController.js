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

    // Calculate estimated delivery (3 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
   
    // Prepare order items with totals
    const orderItems = items.map(item => ({
      productId: item._id || item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
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
   
    // Update product stock quantities
    await Promise.all(
      items.map(async (item) => {
        if (item._id || item.productId) {
          await Product.findByIdAndUpdate(
            item._id || item.productId,
            { $inc: { 'stock.quantity': -item.quantity } }
          );
        }
      })
    );
   
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

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        paymentStatus: 'refunded'
      },
      { new: true }
    );
   
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
   
    // Restore product stock quantities
    await Promise.all(
      order.items.map(async (item) => {
        if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { 'stock.quantity': item.quantity } }
          );
        }
      })
    );
   
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

// Delete order (soft delete)
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Restore stock if the order is not delivered or cancelled
    if (order.status !== 'delivered' && order.status !== 'cancelled') {
      await Promise.all(
        order.items.map(async (item) => {
          if (item.productId) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { 'stock.quantity': item.quantity } }
            );
          }
        })
      );
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
    
    console.log('Received payment request:', { orderData, paymentDetails });
    
    // Validate required fields
    if (!orderData || !orderData.customer || !orderData.items || !orderData.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required order data"
      });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random payment failure (10% chance) - Reduced for testing
    if (Math.random() < 0.05) { // 5% failure rate for testing
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
      productId: item._id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    
    // Update product stock quantities (simplified for demo)
    try {
      // In a real application, you would update the actual product stock here
      console.log('Stock would be updated for items:', orderItems.map(item => ({
        product: item.name,
        quantity: item.quantity
      })));
    } catch (stockError) {
      console.warn('Stock update failed:', stockError.message);
      // Continue with order creation even if stock update fails for demo
    }
    
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