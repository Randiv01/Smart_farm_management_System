// src/Components/Orders/MyOrders.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../UserHome/UHContext/UHAuthContext';
import { Package, Calendar, DollarSign, Truck, Clock, CheckCircle, XCircle, RefreshCw, X, User, MapPin, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) {
        setError('User email not found');
        setLoading(false);
        return;
      }

      try {
        // Call InventoryManagement backend route
        const res = await axios.get(`http://localhost:5000/api/orders/customer/${user.email}`);
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing': return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'shipped': return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };

  if (!user) return <div className="p-8 text-center">Please log in to view your orders</div>;
  if (loading) return <div className="p-8 text-center">Loading your orders...</div>;
  if (error) return (
    <div className="p-8 text-center text-red-600">
      Error Loading Orders: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Orders Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't placed any orders yet.
            </p>
            <a href="/InventoryManagement/catalog" className="inline-flex px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Order #{order.orderNumber}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {order.items.length} item(s)
                    </div>
                    <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      <DollarSign className="h-5 w-5 mr-1" />
                      {formatPrice(order.totalAmount)}
                    </div>
                  </div>
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal - Same as in Orders.jsx */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={closeOrderModal}
              />
             
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative z-50 w-full max-w-4xl p-6 rounded-lg shadow-xl ${"bg-white text-gray-900 dark:bg-gray-800 dark:text-white"}`}
              >
                <button
                  onClick={closeOrderModal}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X size={24} />
                </button>
               
                <h2 className="text-2xl font-bold mb-6">Order Details - #{selectedOrder.orderNumber}</h2>
               
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Information */}
                  <div className={`p-4 rounded-lg ${"bg-gray-50 dark:bg-gray-700"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User size={20} className="mr-2" />
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedOrder.customer.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedOrder.customer.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone || "Not provided"}</p>
                    </div>
                  </div>
                 
                  {/* Shipping Information */}
                  <div className={`p-4 rounded-lg ${"bg-gray-50 dark:bg-gray-700"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <MapPin size={20} className="mr-2" />
                      Shipping Address
                    </h3>
                    <div className="space-y-2">
                      <p>{selectedOrder.customer.address || "Not provided"}</p>
                      <p>{selectedOrder.customer.city}</p>
                    </div>
                  </div>
                </div>
               
                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className={`rounded-lg overflow-hidden ${"bg-gray-50 dark:bg-gray-700"}`}>
                    <table className="w-full">
                      <thead className={"bg-gray-200 dark:bg-gray-600"}>
                        <tr>
                          <th className="px-4 py-2 text-left">Product</th>
                          <th className="px-4 py-2 text-left">Quantity</th>
                          <th className="px-4 py-2 text-left">Price</th>
                          <th className="px-4 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className={"border-b border-gray-200 dark:border-gray-600"}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="ml-3">
                                  <p className="font-medium">{item.name}</p>
                                  {item.sku && <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">${item.price?.toFixed(2)}</td>
                            <td className="px-4 py-3">${(item.quantity * item.price)?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
               
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-4 rounded-lg ${"bg-gray-50 dark:bg-gray-700"}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CreditCard size={20} className="mr-2" />
                      Payment Information
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Payment Method:</span> {selectedOrder.paymentMethod || "Not specified"}</p>
                      <p><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus || "Not specified"}</p>
                      <p><span className="font-medium">Transaction ID:</span> {selectedOrder.transactionId || "Not available"}</p>
                    </div>
                  </div>
                 
                  <div className={`p-4 rounded-lg ${"bg-gray-50 dark:bg-gray-700"}`}>
                    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${selectedOrder.shipping?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-gray-600 border-gray-200">
                        <span>Total:</span>
                        <span>${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
               
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeOrderModal}
                    className={`px-4 py-2 rounded-lg ${"bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyOrders;