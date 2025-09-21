import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [giftItems, setGiftItems] = useState([]); // New state for gift items
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState('cart'); // Track whether checkout is for cart or gift

  // Load cart and gift items from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('farmCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    const savedGiftBucket = localStorage.getItem('farmGiftBucket');
    if (savedGiftBucket) {
      setGiftItems(JSON.parse(savedGiftBucket));
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('farmCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save gift items to localStorage whenever gift items change
  useEffect(() => {
    localStorage.setItem('farmGiftBucket', JSON.stringify(giftItems));
  }, [giftItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);
      if (existingItem) {
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const addToGiftBucket = (product) => {
    setGiftItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);
      if (existingItem) {
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== id));
  };

  const removeFromGiftBucket = (id) => {
    setGiftItems((prevItems) => prevItems.filter((item) => item._id !== id));
  };

  const updateQuantity = (id, quantity, type = 'cart') => {
    if (quantity <= 0) {
      if (type === 'cart') {
        removeFromCart(id);
      } else {
        removeFromGiftBucket(id);
      }
      return;
    }
    if (type === 'cart') {
      setCartItems((prevItems) =>
        prevItems.map((item) => (item._id === id ? { ...item, quantity } : item))
      );
    } else {
      setGiftItems((prevItems) =>
        prevItems.map((item) => (item._id === id ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const clearGiftBucket = () => {
    setGiftItems([]);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const getTotalItems = (type = 'cart') => {
    const items = type === 'cart' ? cartItems : giftItems;
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (type = 'cart') => {
    const items = type === 'cart' ? cartItems : giftItems;
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const setCheckoutSource = (type) => {
    setCheckoutType(type);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        giftItems,
        addToCart,
        addToGiftBucket,
        removeFromCart,
        removeFromGiftBucket,
        updateQuantity,
        clearCart,
        clearGiftBucket,
        isCartOpen,
        toggleCart,
        getTotalItems,
        getTotalPrice,
        checkoutType,
        setCheckoutSource,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};