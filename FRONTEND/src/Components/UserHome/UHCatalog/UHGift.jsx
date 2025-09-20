import React, { useState, useEffect } from 'react';

const UHGift = ({ isOpen, onClose, giftItems = [], onUpdateGiftItems }) => {
  const [giftProducts, setGiftProducts] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState('bag');
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);

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

  useEffect(() => {
    setGiftProducts(giftItems);
    calculateTotalPrice(giftItems, selectedDesign);
  }, [giftItems, selectedDesign]);

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
    alert(`Proceeding to checkout with ${giftProducts.length} items. Total: $${totalPrice.toFixed(2)}`);
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

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '28px',
        width: '85%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#666',
            zIndex: 10
          }}
        >
          ×
        </button>
        
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '28px', 
          color: '#2c5aa0',
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          🎁 Your Gift Box
        </h2>
        
        {giftProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎁</div>
            <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px' }}>
              Your gift box is empty. Add products from the catalog.
            </p>
            <button 
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Items: {giftProducts.length}</h3>
                <h3 style={{ margin: 0, color: '#2c5aa0', fontSize: '24px' }}>Total: ${totalPrice.toFixed(2)}</h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '12px', fontWeight: 'bold', color: '#333' }}>Gift Design:</span>
                <select 
                  value={selectedDesign} 
                  onChange={(e) => handleDesignChange(e.target.value)}
                  style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '2px solid #ddd',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  {designOptions.map(design => (
                    <option key={design.id} value={design.id}>
                      {design.name} {design.price > 0 ? `(+$${design.price})` : '(Free)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Design Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f0f8ff',
              borderRadius: '12px'
            }}>
              {designOptions.filter(d => d.id === selectedDesign).map(design => (
                <div key={design.id} style={{ textAlign: 'center' }}>
                  <img 
                    src={design.image} 
                    alt={design.name}
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      border: '3px solid #2c5aa0',
                      marginBottom: '8px'
                    }}
                  />
                  <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{design.name}</p>
                  <p style={{ margin: 0, color: design.price > 0 ? '#e91e63' : '#4CAF50' }}>
                    {design.price > 0 ? `+$${design.price}` : 'FREE'}
                  </p>
                </div>
              ))}
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                minHeight: '220px',
                border: '2px dashed #ccc',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                backgroundColor: isDragging ? '#e3f2fd' : '#f9f9f9',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                justifyContent: giftProducts.length === 0 ? 'center' : 'flex-start',
                alignItems: giftProducts.length === 0 ? 'center' : 'flex-start',
                transition: 'background-color 0.3s'
              }}
            >
              {giftProducts.length === 0 ? (
                <p style={{ color: '#999', fontSize: '16px' }}>Drag items here to remove them</p>
              ) : (
                giftProducts.map(product => (
                  <div
                    key={product._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, product)}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '12px',
                      padding: '16px',
                      width: '140px',
                      textAlign: 'center',
                      backgroundColor: 'white',
                      cursor: 'grab',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      position: 'relative'
                    }}
                  >
                    <button 
                      onClick={() => removeFromGift(product._id)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#ff4757',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                    
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover', 
                          borderRadius: '8px', 
                          marginBottom: '12px' 
                        }}
                      />
                    )}
                    <h4 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {product.name}
                    </h4>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#2c5aa0'
                    }}>
                      ${product.price}
                    </p>
                    
                    {editingProduct && editingProduct._id === product._id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '4px',
                            textAlign: 'center',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={saveEdit}
                            style={{
                              flex: 1,
                              padding: '4px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            style={{
                              flex: 1,
                              padding: '4px',
                              backgroundColor: '#ff4757',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p style={{ margin: '4px 0 8px 0', fontSize: '14px' }}>
                          Qty: {product.quantity || 1}
                        </p>
                        <button
                          onClick={() => startEditing(product)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2c5aa0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Edit Qty
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '20px',
              backgroundColor: '#e8f5e9',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>
                  🎁 Special Advantage: {designOptions.find(d => d.id === selectedDesign)?.price === 0 ? 
                    `Free ${designOptions.find(d => d.id === selectedDesign)?.name} design included!` : 
                    selectedDesign === 'premium' ? 
                    `Premium Box design for only $${designOptions.find(d => d.id === selectedDesign)?.price}!` : 
                    `Standard ${designOptions.find(d => d.id === selectedDesign)?.name} design for $${designOptions.find(d => d.id === selectedDesign)?.price}!`
                  }
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#388e3c' }}>
                  Drag items out of the box to remove them
                </p>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleCheckout}
                style={{
                  padding: '16px 40px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.backgroundColor = '#ff5252';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backgroundColor = '#ff6b6b';
                }}
              >
                🛒 Proceed to Payment - ${totalPrice.toFixed(2)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UHGift;