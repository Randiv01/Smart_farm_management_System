// src/Components/Orders/MyOrders.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../UserHome/UHContext/UHAuthContext';
import { Package, Calendar, DollarSign, Truck, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                  <button className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
