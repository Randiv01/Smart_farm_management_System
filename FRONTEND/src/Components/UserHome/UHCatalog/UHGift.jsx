import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, MapPin, Calendar, User, X } from 'lucide-react';

const UHGift = ({ isOpen, onClose, giftItems = [], onUpdateGiftItems }) => {
  const [giftProducts, setGiftProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState('bag');
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    zipcode: '',
    date: '',
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  // Design options with images
  const designOptions = [
    {
      id: 'bag',
      name: 'Bag',
      image: 'https://t4.ftcdn.net/jpg/16/18/04/13/240_F_1618041307_8VQ1C6g5C6587Ibiour3VpwOsFv9J9JH.jpg',
      price: 0
    },
    {
      id: 'box',
      name: 'Box',
      image: 'https://t3.ftcdn.net/jpg/06/06/30/94/240_F_606309473_Hm1AlIKf3MDku8QrSRzqna0XJvp14CzW.jpg',
      price: 2
    },
    {
      id: 'basket',
      name: 'Basket',
      image: 'https://media.istockphoto.com/id/2163598081/photo/wicker-basket-against-white-background.jpg?s=612x612&w=0&k=20&c=IUL6NxfQBI4jt6PffOahwaa_5Bg9-XRGPssGpCEXjA4=',
      price: 2
    },
    {
      id: 'premium',
      name: 'Premium Box',
      image: 'https://t4.ftcdn.net/jpg/15/52/75/23/240_F_1552752302_h47u9MAYM3qch7Du0mhFgYxrAK4GT8s.jpg',
      price: 5
    }
  ];

  // Load gift box data from localStorage on component mount
  useEffect(() => {
    const savedGiftBox = localStorage.getItem('uhGiftBox');
    const savedDesign = localStorage.getItem('uhGiftBoxDesign');
    
    if (savedGiftBox) {
      const parsedGiftBox = JSON.parse(savedGiftBox);
      setGiftProducts(parsedGiftBox);
      
      if (onUpdateGiftItems) {
        onUpdateGiftItems(parsedGiftBox);
      }
    }
    
    if (savedDesign) {
      setSelectedDesign(savedDesign);
    }
  }, []);

  useEffect(() => {
    // Update state with props if provided
    if (giftItems.length > 0) {
      setGiftProducts(giftItems);
      localStorage.setItem('uhGiftBox', JSON.stringify(giftItems));
    }
    
    calculateTotalPrice(giftItems, selectedDesign);
  }, [giftItems, selectedDesign]);

  // Save to localStorage whenever giftProducts changes
  useEffect(() => {
    if (giftProducts.length > 0) {
      localStorage.setItem('uhGiftBox', JSON.stringify(giftProducts));
    } else {
      localStorage.removeItem('uhGiftBox');
    }
  }, [giftProducts]);

  // Save selected design to localStorage
  useEffect(() => {
    localStorage.setItem('uhGiftBoxDesign', selectedDesign);
  }, [selectedDesign]);

  const calculateTotalPrice = (products, designId) => {
    const productsTotal = products.reduce((sum, product) =>
      sum + (product.price * (product.quantity || 1)), 0);
  
    const designPrice = designOptions.find(d => d.id === designId)?.price || 0;
    setTotalPrice(productsTotal + designPrice);
  };

  const handleDragStart = (e, product) => {
    setIsDragging(true);
    setDragItem(product);
    e.dataTransfer.setData('text/plain', product._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
  
    if (dragItem) {
      removeFromGift(dragItem._id);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
  
    const updatedProducts = giftProducts.map(product =>
      product._id === productId
        ? { ...product, quantity: newQuantity }
        : product
    );
  
    setGiftProducts(updatedProducts);
    calculateTotalPrice(updatedProducts, selectedDesign);
  
    if (onUpdateGiftItems) {
      onUpdateGiftItems(updatedProducts);
    }
  };

  const removeFromGift = (productId) => {
    const updatedProducts = giftProducts.filter(product => product._id !== productId);
    setGiftProducts(updatedProducts);
    calculateTotalPrice(updatedProducts, selectedDesign);
  
    if (onUpdateGiftItems) {
      onUpdateGiftItems(updatedProducts);
    }
  };

  const handleDesignChange = (designId) => {
    setSelectedDesign(designId);
    calculateTotalPrice(giftProducts, designId);
  };

  const handleCheckout = () => {
    if (giftProducts.length === 0) {
      alert("Your gift box is empty!");
      return;
    }
    setShowCheckout(true);
  };

  const handleBackToGiftBox = () => {
    setShowCheckout(false);
  };

  const handleDeliveryInfoChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = () => {
    if (!deliveryInfo.name || !deliveryInfo.email || !deliveryInfo.address || !deliveryInfo.zipcode) {
      alert('Please fill in all required delivery information.');
      return;
    }
    
    // Clear gift box after successful order
    setGiftProducts([]);
    localStorage.removeItem('uhGiftBox');
    localStorage.removeItem('uhGiftBoxDesign');
    
    alert(`Order placed successfully! Total: $${totalPrice.toFixed(2)}`);
    setShowCheckout(false);
    
    if (onUpdateGiftItems) {
      onUpdateGiftItems([]);
    }
    
    onClose();
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setQuantityInput(product.quantity || 1);
  };

  const saveEdit = () => {
    if (editingProduct) {
      updateQuantity(editingProduct._id, quantityInput);
      setEditingProduct(null);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

  const selectedDesignOption = designOptions.find(d => d.id === selectedDesign) || designOptions[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[1000]">
      <div className="bg-white rounded-2xl p-7 w-[85%] max-w-[900px] max-h-[90vh] overflow-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-800 z-10"
        >
          ×
        </button>
        {showCheckout ? (
          <>
            <h2 className="text-center mb-7 text-2xl font-bold text-blue-700">
              🎁 Gift Box Checkout
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Delivery Information */}
              <div className="p-6 rounded-2xl bg-white shadow-md">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin size={24} /> Delivery Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={deliveryInfo.name}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={deliveryInfo.email}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={deliveryInfo.address}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                      placeholder="123 Farm Road"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Zip Code *</label>
                    <input
                      type="text"
                      name="zipcode"
                      value={deliveryInfo.zipcode}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                      placeholder="12345"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={deliveryInfo.phone}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                      placeholder="123-456-7890"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Delivery Date</label>
                    <input
                      type="date"
                      name="date"
                      value={deliveryInfo.date}
                      onChange={handleDeliveryInfoChange}
                      className="w-full p-3 rounded-lg border bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              {/* Order Summary */}
              <div className="p-6 rounded-2xl bg-white shadow-md">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={24} /> Order Summary
                </h3>
                <div className="space-y-4">
                  {giftProducts.length === 0 ? (
                    <p className="text-center text-gray-500">Your gift box is empty.</p>
                  ) : (
                    <>
                      {giftProducts.map(item => (
                        <div key={item._id} className="flex justify-between items-center border-b py-2">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity || 1}</p>
                            </div>
                          </div>
                          <p className="font-semibold">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center border-b py-2">
                        <p className="font-medium">Gift Design: {selectedDesignOption.name}</p>
                        <p className="font-semibold">
                          {selectedDesignOption.price > 0 ? `$${selectedDesignOption.price}` : 'Free'}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <p className="text-lg font-bold">Total</p>
                        <p className="text-lg font-bold text-green-600">${totalPrice.toFixed(2)}</p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={20} /> Place Order
                </button>
                <button
                  onClick={handleBackToGiftBox}
                  className="w-full mt-3 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back to Gift Box
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-center mb-7 text-2xl font-bold text-blue-700">
              🎁 Your Gift Box
            </h2>
      
            {giftProducts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-5">🎁</div>
                <p className="text-gray-600 text-lg mb-7">
                  Your gift box is empty. Add products from the catalog.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-green-500 text-white border-none rounded-lg cursor-pointer text-base font-bold hover:bg-green-600 transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6 p-4 bg-gray-100 rounded-xl">
                  <div>
                    <h3 className="m-0 mb-2 text-gray-800">Items: {giftProducts.length}</h3>
                    <h3 className="m-0 text-2xl text-blue-700 font-bold">Total: ${totalPrice.toFixed(2)}</h3>
                  </div>
            
                  <div className="flex items-center">
                    <span className="mr-3 font-bold text-gray-800">Gift Design:</span>
                    <select
                      value={selectedDesign}
                      onChange={(e) => handleDesignChange(e.target.value)}
                      className="p-2 rounded-lg border-2 border-gray-300 text-base cursor-pointer focus:ring-2 focus:ring-blue-500"
                    >
                      {designOptions.map(design => (
                        <option key={design.id} value={design.id}>
                          {design.name} {design.price > 0 ? `(+$${design.price})` : '(Free)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
          
                <div className="flex justify-center mb-6 p-4 bg-blue-50 rounded-xl">
                  {designOptions.filter(d => d.id === selectedDesign).map(design => (
                    <div key={design.id} className="text-center">
                      <img
                        src={design.image}
                        alt={design.name}
                        className="w-32 h-32 object-cover rounded-lg border-2 border-blue-700 mb-2"
                      />
                      <p className="m-1 font-bold">{design.name}</p>
                      <p className={`m-0 ${design.price > 0 ? 'text-pink-600' : 'text-green-500'}`}>
                        {design.price > 0 ? `+$${design.price}` : 'FREE'}
                      </p>
                    </div>
                  ))}
                </div>
          
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`min-h-[220px] border-2 border-dashed border-gray-300 rounded-xl p-5 mb-6 ${isDragging ? 'bg-blue-100' : 'bg-gray-50'} flex flex-wrap gap-4 justify-center transition-colors`}
                >
                  {giftProducts.length === 0 ? (
                    <p className="text-gray-500 text-base">Drag items here to remove them</p>
                  ) : (
                    giftProducts.map(product => (
                      <div
                        key={product._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, product)}
                        className="border border-gray-300 rounded-xl p-4 w-36 text-center bg-white cursor-grab shadow-md hover:shadow-lg relative"
                      >
                        <button
                          onClick={() => removeFromGift(product._id)}
                          className="absolute top-2 right-2 bg-red-500 text-white border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-sm"
                        >
                          ×
                        </button>
                  
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="m-0 mb-2 text-sm font-bold text-gray-800">
                          {product.name}
                        </h4>
                        <p className="m-0 mb-2 text-base font-bold text-blue-700">
                          ${product.price}
                        </p>
                  
                        {editingProduct && editingProduct._id === product._id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="number"
                              min="1"
                              value={quantityInput}
                              onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                              className="w-full p-1 text-center border border-gray-300 rounded"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={saveEdit}
                                className="flex-1 p-1 bg-green-500 text-white border-none rounded cursor-pointer text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 p-1 bg-red-500 text-white border-none rounded cursor-pointer text-xs"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="m-1 mb-2 text-sm">
                              Qty: {product.quantity || 1}
                            </p>
                            <button
                              onClick={() => startEditing(product)}
                              className="px-3 py-1 bg-blue-700 text-white border-none rounded cursor-pointer text-xs font-bold"
                            >
                              Edit Qty
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
          
                <div className="flex justify-between items-center p-5 bg-green-100 rounded-xl mb-5">
                  <div>
                    <p className="m-0 text-base font-bold text-green-800">
                      🎁 Special Advantage: {designOptions.find(d => d.id === selectedDesign)?.price === 0 ?
                        `Free ${designOptions.find(d => d.id === selectedDesign)?.name} design included!` :
                        selectedDesign === 'premium' ?
                        `Premium Box design for only $${designOptions.find(d => d.id === selectedDesign)?.price}!` :
                        `Standard ${designOptions.find(d => d.id === selectedDesign)?.name} design for $${designOptions.find(d => d.id === selectedDesign)?.price}!`
                      }
                    </p>
                    <p className="mt-2 text-sm text-green-700">
                      Drag items out of the box to remove them
                    </p>
                  </div>
                </div>
          
                <div className="text-center">
                  <button
                    onClick={handleCheckout}
                    className="px-10 py-4 bg-red-500 text-white border-none rounded-lg cursor-pointer text-lg font-bold shadow-md hover:shadow-lg hover:bg-red-600 transform hover:scale-105 transition"
                  >
                    🛒 Proceed to Payment - ${totalPrice.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UHGift;