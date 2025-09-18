import React, { useState, useEffect } from "react";
import { useTheme } from "../UHContext/UHThemeContext";
import { CreditCard, User, Mail, MapPin, Phone, ArrowLeft, CheckCircle, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Payment = () => {
const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "card"
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('farmCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      // If no cart items, redirect back to catalog
      navigate('/catalog');
    }
  }, [navigate]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Prepare order data
      const orderData = {
        customer: customerInfo,
        items: cartItems.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod: customerInfo.paymentMethod
      };
      
      // Send order to backend API
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to place order. Please try again.');
      }
      
      // Store order details for confirmation message
      const orderNumber = data.order.orderNumber;
      const estimatedDelivery = new Date(data.order.estimatedDelivery).toLocaleDateString();
      
      setOrderDetails({
        orderNumber,
        estimatedDelivery,
        items: cartItems,
        total: data.order.totalAmount,
        customer: customerInfo
      });
      
      // Set order success
      setOrderSuccess(true);
      
      // Clear cart after successful order
      localStorage.removeItem('farmCart');
      
    } catch (error) {
      console.error('Order submission error:', error);
      setError(error.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueShopping = () => {
    navigate('/catalog');
  };

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <p className="text-lg">No items in cart.</p>
          <button
            onClick={() => navigate('/catalog')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess && orderDetails) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className={`max-w-2xl w-full rounded-xl p-8 ${darkMode ? "bg-gray-800" : "bg-white shadow-lg"}`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <CheckCircle size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className={`mb-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Thank you for your order, {orderDetails.customer.name}!
            </p>
            <p className={`text-lg font-semibold text-green-600 mb-6`}>
              Order #: {orderDetails.orderNumber}
            </p>
          </div>
          
          <div className={`rounded-lg p-6 mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ShoppingBag size={20} className="mr-2" />
              Order Summary
            </h2>
            
            <div className="space-y-3 mb-4">
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.name}</span>
                  </div>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${getTotalPrice()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-green-600">${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg p-6 mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            <p className="mb-2"><span className="font-semibold">Estimated Delivery:</span> {orderDetails.estimatedDelivery}</p>
            <p className="mb-2"><span className="font-semibold">Address:</span> {orderDetails.customer.address}, {orderDetails.customer.city}</p>
            <p><span className="font-semibold">Contact:</span> {orderDetails.customer.phone}</p>
          </div>
          
          <div className="text-center">
            <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              A confirmation email has been sent to {orderDetails.customer.email}
            </p>
            
            <button
              onClick={continueShopping}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/catalog')}
            className={`flex items-center gap-2 mb-4 ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
          >
            <ArrowLeft size={20} />
            Back to Catalog
          </button>
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Complete your order by providing your information
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className={`rounded-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.quantity} × ${item.price}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Subtotal</span>
                <span>${getTotalPrice()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Shipping</span>
                <span>$5.00</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg mt-4 pt-4 border-t">
                <span>Total</span>
                <span className="text-green-600">${(parseFloat(getTotalPrice()) + 5).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information Form */}
          <div className={`rounded-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <h2 className="text-xl font-bold mb-4">Customer Information</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Full Name *
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPin size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="address"
                      required
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={customerInfo.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={customerInfo.paymentMethod}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="cash">Cash on Delivery</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 text-white rounded-lg font-semibold flex items-center justify-center gap-2 mt-6 ${
                    isSubmitting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Complete Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;