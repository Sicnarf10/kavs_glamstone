// src/POS.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './POS.css';

function POS() {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // --- State to control the INVENTORY collapse on mobile ---
  const [isInventoryCollapsed, setIsInventoryCollapsed] = useState(false);

  const addToCart = useCallback((item) => {
    setCart(prevCart => {
      if (!prevCart.find(cartItem => cartItem.id === item.id)) {
        return [...prevCart, item];
      }
      return prevCart;
    });
  }, []);

  const handleScanResult = useCallback((scannedId) => {
    const itemToAdd = inventory.find(item => item.item_id === scannedId);
    if (itemToAdd) {
      addToCart(itemToAdd);
      setMessage(`Success: Added ${itemToAdd.name} to cart.`);
    } else {
      setMessage(`Error: Item with ID ${scannedId} not found in stock.`);
    }
    setIsScannerOpen(false);
  }, [inventory, addToCart]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        'reader',
        { 
          qrbox: { width: 250, height: 250 },
          fps: 5,
        },
        false
      );

      const onScanSuccess = (decodedText) => {
        scanner.clear();
        handleScanResult(decodedText);
      };

      const onScanFailure = () => { /* Ignored */ };
      
      scanner.render(onScanSuccess, onScanFailure);

      return () => {
        if (scanner && scanner.getState() === 2) {
           scanner.clear().catch(err => console.error("Failed to clear scanner:", err));
        }
      };
    }
  }, [isScannerOpen, handleScanResult]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items/');
      const data = await response.json();
      setInventory(data.filter(item => item.stock_status === 'IN_STOCK'));
    } catch (error) { console.error("Error fetching inventory:", error); }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };
  
  const handleCheckout = async () => {
    if (cart.length === 0) return setMessage('Error: Cart is empty.');
    if (!customerName || !customerPhone) return setMessage('Error: Customer name and phone are required.');
    setMessage('');

    try {
      const transactionData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        sales: cart.map(item => ({
          jewelry_item: item.id,
          quantity: 1,
          price_at_sale: item.selling_price,
        })),
      };
      const transactionResponse = await fetch('/api/transactions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      if (!transactionResponse.ok) {
        throw new Error(JSON.stringify(await transactionResponse.json()) || 'Failed to create transaction.');
      }
      setMessage('Transaction completed successfully!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      fetchItems();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.selling_price), 0);
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.item_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="pos-container">
        <div className={`inventory-panel ${isInventoryCollapsed ? 'collapsed' : ''}`}>
          <h2 className="collapsible-header" onClick={() => setIsInventoryCollapsed(!isInventoryCollapsed)}>
            Inventory
            <span className="collapse-icon">{isInventoryCollapsed ? '▼' : '▲'}</span>
          </h2>
          <div className="inventory-content">
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              className="search-bar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="inventory-grid">
              {filteredInventory.map(item => (
                <div key={item.id} className="inventory-card" onClick={() => addToCart(item)}>
                  <div className="pos-card-image-container">
                    {item.image ? (<img src={item.image} alt={item.name} className="pos-card-image" />) : (<div className="pos-card-image-placeholder"></div>)}
                  </div>
                  <h4>{item.name}</h4>
                  <p>{item.item_id}</p>
                  <p className="price">₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="cart-panel">
          <h2>Sales Cart</h2>
          <button className="scan-btn" onClick={() => setIsScannerOpen(true)}>
            📷 Scan Barcode
          </button>
          <div className="customer-details">
            <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <input type="text" placeholder="Customer Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div className="cart-items">
            {cart.length === 0 ? <p>Cart is empty</p> : cart.map(item => (
              <div key={item.id} className="cart-item">
                <span>{item.name} ({item.item_id})</span>
                <span>₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</span>
                <button onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: ₹{cartTotal.toLocaleString('en-IN')}</h3>
            <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
          </div>
          {message && <p className="message-bar">{message}</p>}
        </div>
      </div>

      {isScannerOpen && (
        <div className="scanner-overlay">
          <div className="scanner-container">
            <h3>Scan Item Barcode</h3>
            <div id="reader"></div>
            <button className="cancel-scan-btn" onClick={() => setIsScannerOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export default POS;