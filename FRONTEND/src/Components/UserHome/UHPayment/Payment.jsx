import React, { useState, useEffect } from "react";
import { useTheme } from "../UHContext/UHThemeContext";
import { 
  CreditCard, 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  CheckCircle, 
  ShoppingBag,
  Lock,
  Shield,
  Truck,
  Calendar,
  Clock,
  AlertCircle,
  Loader,
  Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
    zipCode: "",
    paymentMethod: "card"
  });
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: ""
  });
  
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCardValid, setIsCardValid] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('farmCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        setCartItems(Array.isArray(cartData) ? cartData : []);
        
        // Pre-fill customer info if available
        const savedCustomerInfo = localStorage.getItem('customerInfo');
        if (savedCustomerInfo) {
          setCustomerInfo(JSON.parse(savedCustomerInfo));
        }
      } catch (e) {
        console.error('Error loading cart:', e);
        setCartItems([]);
      }
    } else {
      navigate('/catalog');
    }
  }, [navigate]);

  // Validate card details
  useEffect(() => {
    const validateCard = () => {
      const { cardNumber, expiryDate, cvv, cardName } = cardDetails;
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      const isNumberValid = /^\d{16}$/.test(cleanedCardNumber);
      const isExpiryValid = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate);
      const isCvvValid = /^[0-9]{3,4}$/.test(cvv);
      const isNameValid = cardName.trim().length > 2;
      
      setIsCardValid(isNumberValid && isExpiryValid && isCvvValid && isNameValid);
    };
    
    validateCard();
  }, [cardDetails]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const shippingCost = 5.00;
  const taxRate = 0.08;
  const subtotal = getTotalPrice();
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === "cardNumber") {
      // Remove all non-digits, add spaces every 4 digits
      value = value.replace(/\D/g, '');
      if (value.length > 16) value = value.slice(0, 16);
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    
    if (name === "expiryDate") {
      value = value.replace(/\D/g, '');
      if (value.length > 4) value = value.slice(0, 4);
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
    }
    
    if (name === "cvv") {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCustomerInfo = () => {
    const { name, email, phone, address, city, zipCode } = customerInfo;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    
    if (!name.trim() || name.trim().length < 2) return "Please enter your full name (min 2 characters)";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) return "Please enter a valid phone number";
    if (!address.trim() || address.trim().length < 5) return "Please enter your complete delivery address";
    if (!city.trim()) return "Please enter your city";
    if (!zipCode.trim() || !/^\d{5,10}$/.test(zipCode)) return "Please enter a valid ZIP code";
    
    return null;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const error = validateCustomerInfo();
      if (error) {
        setError(error);
        return;
      }
      setError("");
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    
    try {
      // Validate final details
      const customerError = validateCustomerInfo();
      if (customerError) {
        throw new Error(customerError);
      }

      if (!isCardValid) {
        throw new Error("Please check your card details");
      }

      // Prepare order data for backend
      const orderData = {
        customer: customerInfo,
        items: cartItems.map(item => ({
          _id: item._id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || ''
        })),
        paymentMethod: customerInfo.paymentMethod,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: shippingCost,
        tax: parseFloat(tax.toFixed(2)),
        totalAmount: parseFloat(total.toFixed(2))
      };

      const paymentDetails = {
        cardLastFour: cardDetails.cardNumber.replace(/\s/g, '').slice(-4),
        expiryDate: cardDetails.expiryDate
      };

      console.log('Sending payment request...', { orderData, paymentDetails });

      // Send payment and order data to backend
      const response = await axios.post('http://localhost:5000/api/orders/payment', {
        orderData,
        paymentDetails
      }, {
        withCredentials: true,
        timeout: 10000 // 10 second timeout
      });

      console.log('Payment response:', response.data);

      if (response.data.success) {
        // Save customer info for future use
        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
        
        // Set order details from backend response
        setOrderDetails(response.data.order);
        setOrderSuccess(true);
        localStorage.removeItem('farmCart');
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || error.response.statusText;
      } else if (error.request) {
        // Request made but no response received
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else {
        // Something else happened
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueShopping = () => {
    navigate('/catalog');
  };

  const viewOrderHistory = () => {
    navigate('/orders');
  };

  const goHome = () => {
    navigate('/');
  };

  const renderProgressSteps = () => (
    <div className="mb-8">
      <div className="flex justify-center mb-4">
        <div className="flex items-center">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex flex-col items-center ${step <= currentStep ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step <= currentStep 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step}
                </div>
                <span className="text-xs mt-1">
                  {step === 1 ? 'Info' : step === 2 ? 'Payment' : 'Review'}
                </span>
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          <p className="text-lg mb-4">Your cart is empty!</p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
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
                <span>${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${orderDetails.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${orderDetails.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-green-600">${orderDetails.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className={`rounded-lg p-6 mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Truck size={20} className="mr-2" />
              Delivery Information
            </h2>
            <p className="mb-2 flex items-center">
              <Calendar size={16} className="mr-2" />
              <span className="font-semibold">Estimated Delivery:</span> 
              <span className="ml-2">
                {new Date(orderDetails.estimatedDelivery).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </p>
            <p className="mb-2">
              <span className="font-semibold">Address:</span> {orderDetails.customer.address}, {orderDetails.customer.city}, {orderDetails.customer.zipCode}
            </p>
            <p>
              <span className="font-semibold">Contact:</span> {orderDetails.customer.phone}
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <p className={`mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              A confirmation email has been sent to {orderDetails.customer.email}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={goHome}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
              >
                <Home size={16} className="mr-2" />
                Go Home
              </button>
              <button
                onClick={continueShopping}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
              >
                Continue Shopping
              </button>
              <button
                onClick={viewOrderHistory}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                View Order History
              </button>
            </div>
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
          <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Complete your order in {3 - currentStep} simple steps
          </p>
        </div>

        {renderProgressSteps()}

        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-800"
          }`}>
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className={`rounded-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Shipping</span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg mt-4 pt-4 border-t">
                <span>Total</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center">
              <Shield size={20} className="text-blue-600 mr-2" />
              <span className="text-sm text-blue-600">Your payment information is secure and encrypted</span>
            </div>
          </div>

          {/* Form Section */}
          <div className={`rounded-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow-md"}`}>
            {currentStep === 1 && (
              <>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Customer Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={customerInfo.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Delivery Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      value={customerInfo.address}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="Enter your complete address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        required
                        value={customerInfo.zipCode}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mt-4 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CreditCard size={20} className="mr-2" />
                  Payment Details
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Card Number *
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      required
                      value={cardDetails.cardNumber}
                      onChange={handleCardInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        required
                        value={cardDetails.expiryDate}
                        onChange={handleCardInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        CVV *
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        required
                        value={cardDetails.cvv}
                        onChange={handleCardInputChange}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                        } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                        placeholder="123"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      required
                      value={cardDetails.cardName}
                      onChange={handleCardInputChange}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"
                      } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={prevStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!isCardValid}
                      className={`flex-1 py-3 text-white rounded-lg font-semibold transition-colors ${
                        isCardValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Review Order
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center">
                    <Lock size={20} className="text-green-600 mr-2" />
                    <span className="text-sm text-green-600">Your card details are secure and encrypted</span>
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <CheckCircle size={20} className="mr-2" />
                  Review Your Order
                </h2>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="font-semibold mb-2">Delivery Information</h3>
                    <p className="break-words">{customerInfo.name}</p>
                    <p className="break-words">{customerInfo.email}</p>
                    <p className="break-words">{customerInfo.phone}</p>
                    <p className="break-words">{customerInfo.address}, {customerInfo.city}, {customerInfo.zipCode}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p>Credit Card ending in {cardDetails.cardNumber.slice(-4)}</p>
                    <p>Expires: {cardDetails.expiryDate}</p>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={prevStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 py-3 text-white rounded-lg font-semibold flex items-center justify-center transition-colors ${
                        isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader size={20} className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Complete Payment'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;