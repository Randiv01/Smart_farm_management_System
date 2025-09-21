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
  AlertCircle
} from "lucide-react";
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
  const [currentStep, setCurrentStep] = useState(1); // 1: Customer info, 2: Payment, 3: Review
  const [isCardValid, setIsCardValid] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('farmCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    } else {
      navigate('/catalog');
    }
  }, [navigate]);

  // Validate card details
  useEffect(() => {
    const validateCard = () => {
      const { cardNumber, expiryDate, cvv, cardName } = cardDetails;
      const isNumberValid = cardNumber.replace(/\s/g, '').length === 16;
      const isExpiryValid = /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiryDate);
      const isCvvValid = /^[0-9]{3,4}$/.test(cvv);
      const isNameValid = cardName.trim().length > 0;
      
      setIsCardValid(isNumberValid && isExpiryValid && isCvvValid && isNameValid);
    };
    
    validateCard();
  }, [cardDetails]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const shippingCost = 5.00;
  const taxRate = 0.08; // 8% tax
  const subtotal = parseFloat(getTotalPrice());
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
    
    // Format card number with spaces
    if (name === "cardNumber") {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
      if (value.length > 19) value = value.slice(0, 19);
    }
    
    // Format expiry date
    if (name === "expiryDate") {
      value = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').trim();
      if (value.length > 5) value = value.slice(0, 5);
    }
    
    // Limit CVV
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
    const phoneRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
    
    if (!name.trim()) return "Please enter your full name";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (!phoneRegex.test(phone)) return "Please enter a valid phone number";
    if (!address.trim()) return "Please enter your delivery address";
    if (!city.trim()) return "Please enter your city";
    if (!zipCode.trim()) return "Please enter your ZIP code";
    
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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate random payment failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Payment declined. Please check your card details or try a different payment method.");
      }
      
      // Generate order details
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      
      setOrderDetails({
        orderNumber,
        deliveryDate: deliveryDate.toLocaleDateString(),
        items: cartItems,
        subtotal: subtotal,
        shipping: shippingCost,
        tax: tax,
        total: total,
        customer: customerInfo,
        paymentMethod: customerInfo.paymentMethod
      });
      
      setOrderSuccess(true);
      localStorage.removeItem('farmCart');
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueShopping = () => {
    navigate('/catalog');
  };

  const formatCardNumber = (number) => {
    return number.replace(/\d{4}(?=.)/g, '$& ');
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
                <span className="text-green-600">${orderDetails.total.toFixed(2)}</span>
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
              <span className="ml-2">{orderDetails.deliveryDate}</span>
            </p>
            <p className="mb-2">
              <span className="font-semibold">Address:</span> {orderDetails.customer.address}, {orderDetails.customer.city}, {orderDetails.customer.zipCode}
            </p>
            <p>
              <span className="font-semibold">Contact:</span> {orderDetails.customer.phone}
            </p>
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
          <h1 className="text-3xl font-bold mb-2">Secure Checkout</h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Complete your order in {3 - currentStep} simple steps
          </p>
        </div>

        {renderProgressSteps()}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="Enter your address"
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
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        placeholder="ZIP Code"
                      />
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mt-4"
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={prevStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!isCardValid}
                      className={`flex-1 py-3 text-white rounded-lg font-semibold ${
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
                    <p>{customerInfo.name}</p>
                    <p>{customerInfo.email}</p>
                    <p>{customerInfo.phone}</p>
                    <p>{customerInfo.address}, {customerInfo.city}, {customerInfo.zipCode}</p>
                  </div>

                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <h3 className="font-semibold mb-2">Payment Method</h3>
                    <p>Credit Card ending in {cardDetails.cardNumber.slice(-4)}</p>
                    <p>Expires: {cardDetails.expiryDate}</p>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={prevStep}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={`flex-1 py-3 text-white rounded-lg font-semibold flex items-center justify-center ${
                        isSubmitting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
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