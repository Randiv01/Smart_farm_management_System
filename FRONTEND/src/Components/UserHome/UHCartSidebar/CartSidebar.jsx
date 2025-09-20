// Components/UserHome/UHCartSidebar/UHCartSidebar.jsx
import React from 'react';
import { ShoppingCart, X, Minus, Plus, CreditCard } from 'lucide-react';
import { useCart } from '../UHContext/UHCartContext';
import { useTheme } from '../UHContext/UHThemeContext';
import { useAuth } from '../UHContext/UHAuthContext'; // Add this import
import { useNavigate } from 'react-router-dom';

const CartSidebar = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getTotalItems, 
    getTotalPrice, 
    isCartOpen, 
    toggleCart 
  } = useCart();
  
  const { darkMode } = useTheme();
  const { isAuthenticated } = useAuth(); // Get authentication status
  const navigate = useNavigate();

  const formatPriceCalculation = (price, quantity, unit) => {
    return `$${price} × ${quantity}${unit} = $${(price * quantity).toFixed(2)}`;
  };

  const handleContinueShopping = () => {
    toggleCart(); // Close cart sidebar
    navigate('/catalog'); // Navigate to catalog page
  };
  const proceedToPayment = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    if (!isAuthenticated) {
      // Close cart and redirect to login page
      toggleCart();
      navigate('/login', { 
        state: { 
          from: 'cart',
          message: 'Please login to proceed with your purchase' 
        } 
      });
      return;
    }
    
    // User is authenticated, proceed to payment
    toggleCart(); // Close cart sidebar
    navigate('/payment');
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
        onClick={toggleCart}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ease-in-out animate-slideInRight">
        <div className={`h-full overflow-y-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} shadow-xl`}>
          <div className={`p-4 border-b sticky top-0 z-10 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button
                onClick={toggleCart}
                className={`p-1 rounded-full ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-200 text-gray-700"}`}
              >
                <X size={24} />
              </button>
            </div>
            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in cart
            </p>
          </div>
          <div className="p-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No products in the cart.</p>
                  <button
                  onClick={handleContinueShopping} // Use the new function
                  className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item._id} className={`flex gap-4 p-3 rounded-lg ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"} border`}>
                    <div className="w-16 h-16 flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                          <ShoppingCart size={20} className={darkMode ? "text-gray-500" : "text-gray-400"} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatPriceCalculation(item.price, item.quantity, item.stock.unit)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className={`p-1 rounded ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-200 text-gray-700"}`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className={`px-2 py-1 border rounded min-w-[2rem] text-center ${
                          darkMode 
                            ? "bg-gray-700 border-gray-600 text-white" 
                            : "bg-white border-gray-300 text-gray-900"
                        }`}>
                          {item.quantity}{item.stock.unit}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className={`p-1 rounded ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-200 text-gray-700"}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className={`p-1 self-start ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-500 hover:bg-gray-200"} rounded`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className={`p-4 border-t sticky bottom-0 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">${getTotalPrice().toFixed(2)}</span>
              </div>
              {!isAuthenticated && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${darkMode ? "bg-yellow-900/30 text-yellow-200" : "bg-yellow-100 text-yellow-800"}`}>
                  Please login to complete your purchase
                </div>
              )}
              <button
                onClick={proceedToPayment}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
              >
                <CreditCard size={20} />
                {isAuthenticated ? 'Proceed to Payment' : 'Login to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;