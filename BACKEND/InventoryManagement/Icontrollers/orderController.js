import Order from "../Imodels/Order.js";
import Product from "../Imodels/Product.js";

// Create new order
export const createOrder = async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;
    
    // Calculate estimated delivery (3 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
    
    // Prepare order items with totals
    const orderItems = items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }));
    
    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = 5.00; // Fixed shipping cost
    const totalAmount = subtotal + shipping;
    
    // Generate order number first
    const orderNumber = Order.generateOrderNumber();
    
    // Create order with all required fields
    const order = new Order({
      orderNumber, // This is now set explicitly
      customer,
      items: orderItems,
      subtotal,
      shipping,
      totalAmount,
      paymentMethod,
      estimatedDelivery,
      status: 'pending'
    });
    
    const savedOrder = await order.save();
    
    // Update product stock quantities
    await Promise.all(
      items.map(async (item) => {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { 'stock.quantity': -item.quantity } }
        );
      })
    );
    
    res.status(201).json({
      message: 'Order created successfully',
      order: savedOrder
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error (retry with new order number)
      return res.status(400).json({ 
        message: 'Order number conflict. Please try again.' 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get all orders (for admin)
export const getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
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
    
    const orders = await Order.find(query)
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Restore product stock quantities
    await Promise.all(
      order.items.map(async (item) => {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { 'stock.quantity': item.quantity } }
        );
      })
    );
    
    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const completedOrders = await Order.countDocuments({ 
      status: 'delivered', 
      isActive: true 
    });
    const totalRevenue = await Order.aggregate([
      { $match: { isActive: true, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.status(200).json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};
// Send order status notification
export const sendOrderNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, status } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Here you would integrate with your email service
    // For now, we'll just log the email details
    console.log(`Would send email to ${email} about order ${order.orderNumber} status: ${status}`);
    
    res.status(200).json({
      message: 'Notification sent successfully',
      order: order.orderNumber,
      status: status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};