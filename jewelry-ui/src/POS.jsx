// src/POS.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import appConfig from './config.json';
import './POS.css';

const API_URL = import.meta.env.VITE_API_URL;

function POS() {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // --- NEW STATE for checkout flow ---
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [amountGiven, setAmountGiven] = useState('');
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);

  // --- CALCULATIONS ---
  const subTotal = cart.reduce((total, item) => total + parseFloat(item.selling_price), 0);
  const cgstAmount = subTotal * (appConfig.settings.cgst_percent / 100);
  const sgstAmount = subTotal * (appConfig.settings.sgst_percent / 100);
  const grandTotal = subTotal + cgstAmount + sgstAmount;

  // -- Receipt variables --
  const [sendReceipt, setSendReceipt] = useState(true);

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
      const scanner = new Html5QrcodeScanner('reader', { qrbox: { width: 250, height: 250 }, fps: 5, }, false);

      const onScanSuccess = (decodedText) => { scanner.clear(); handleScanResult(decodedText); };

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
      const response = await fetch(`${API_URL}/api/items/`);
      const data = await response.json();
      setInventory(data.filter(item => item.stock_status === 'IN_STOCK'));
    } catch (error) { console.error("Error fetching inventory:", error); }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };
  
  // const handleCheckout = async () => {
  //   if (cart.length === 0) return setMessage('Error: Cart is empty.');
  //   if (!customerName || !customerPhone) return setMessage('Error: Customer name and phone are required.');
  //   setMessage('');

  //   try {
  //     const transactionData = {
  //       customer_name: customerName,
  //       customer_phone: customerPhone,
  //       sales: cart.map(item => ({
  //         jewelry_item: item.id,
  //         quantity: 1,
  //         price_at_sale: item.selling_price,
  //       })),
  //     };
  //     const transactionResponse = await fetch(`${API_URL}/api/transactions/`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(transactionData),
  //     });
  //     if (!transactionResponse.ok) {
  //       throw new Error(JSON.stringify(await transactionResponse.json()) || 'Failed to create transaction.');
  //     }
  //     setMessage('Transaction completed successfully!');
  //     setCart([]);
  //     setCustomerName('');
  //     setCustomerPhone('');
  //     fetchItems();
  //   } catch (error) {
  //     setMessage(`Error: ${error.message}`);
  //   }
  // };

  // const cartTotal = cart.reduce((total, item) => total + parseFloat(item.selling_price), 0);


 // --- CHECKOUT LOGIC ---
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return setMessage('Error: Cart is empty.');
    if (!customerName || !customerPhone) return setMessage('Error: Customer name and phone are required.');
    
    // Prepare transaction details to show in modals
    setTransactionDetails({
        subTotal: subTotal.toFixed(2),
        cgstAmount: cgstAmount.toFixed(2),
        sgstAmount: sgstAmount.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
    });

    if (paymentMethod === 'Cash') {
      setIsCashModalOpen(true);
    } else {
      setIsUpiModalOpen(true);
    }
  };
  
  const handleFinalizeTransaction = async () => {
    setLastTransaction(null);
    const transactionData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      payment_method: paymentMethod,
      cgst_percent: appConfig.settings.cgst_percent,
      sgst_percent: appConfig.settings.sgst_percent,
      send_receipt: sendReceipt,
      sales: cart.map(item => ({
        jewelry_item: item.id,
        quantity: 1,
        price_at_sale: item.selling_price,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/api/transactions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error('Transaction failed');
      
      const result = await response.json();
      setMessage(`Success! Transaction ${result.bill_number} completed.`);
      setLastTransaction({ id: result.id, phone: customerPhone });
      resetSale();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSendWhatsApp = () => {
    if (!lastTransaction) return;
    const receiptUrl = `${window.location.origin}/receipt/${lastTransaction.id}`;
    const messageText = `Thank you for your purchase from Kavs Glamstone! You can view your digital receipt here: ${receiptUrl}`;
    const encodedMessage = encodeURIComponent(messageText);
    const whatsAppUrl = `https://wa.me/${lastTransaction.phone}?text=${encodedMessage}`;
    window.open(whatsAppUrl, '_blank');
  };

  const resetSale = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setIsCashModalOpen(false);
    setIsUpiModalOpen(false);
    setAmountGiven('');
    setTransactionDetails(null);
    fetchItems();
  };


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
        {/* --- MODIFIED Cart Panel --- */}
        <div className="cart-panel">
          <h2>Sales Cart</h2>
          {/* --- New --- */}
          <div className="payment-method-selector">
            <button className={paymentMethod === 'Cash' ? 'active' : ''} onClick={() => setPaymentMethod('Cash')}>Cash</button>
            <button className={paymentMethod === 'Cashless' ? 'active' : ''} onClick={() => setPaymentMethod('Cashless')}>Cashless (UPI)</button>
          </div>
          <button className="scan-btn" onClick={() => setIsScannerOpen(true)}>
            📷 Scan Barcode
          </button>
          <div className="customer-details">
            <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <input type="text" placeholder="Customer Phone (e.g. 91987...)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
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
            <div className="summary-row"><span>Sub-total</span><span>₹{subTotal.toFixed(2)}</span></div>
            <div className="summary-row"><span>CGST ({appConfig.settings.cgst_percent}%)</span><span>₹{cgstAmount.toFixed(2)}</span></div>
            <div className="summary-row"><span>SGST ({appConfig.settings.sgst_percent}%)</span><span>₹{sgstAmount.toFixed(2)}</span></div>
            <div className="summary-row total"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
            <div className="send-receipt-toggle">
              <input 
                        type="checkbox" 
                        id="send-receipt" 
                        checked={sendReceipt} 
                        onChange={(e) => setSendReceipt(e.target.checked)} 
                    />
                    <label htmlFor="send-receipt">Send Receipt via WhatsApp/SMS</label>
            </div>
            <button className="checkout-btn" onClick={handleInitiateCheckout}>Checkout</button>
          </div>

          {/* <div className="cart-summary">
            <h3>Total: ₹{cartTotal.toLocaleString('en-IN')}</h3>
            <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
          </div> */}
          {/* {message && <p className="message-bar">{message}</p>} */}

          {message && (
            <div className="message-bar">
              {message}
              {lastTransaction && (
                <button className="whatsapp-btn" onClick={handleSendWhatsApp}>
                  Send via WhatsApp
                </button>
              )}
            </div>
          )}
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

      {/* New code logic */}
      {/* --- NEW: Cash Checkout Modal --- */}
      {isCashModalOpen && transactionDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Cash Checkout</h2>
            <div className="summary-row total"><span>Total to Pay</span><span>₹{transactionDetails.grandTotal}</span></div>
            <div className="cash-input-group">
              <label htmlFor="amount-given">Amount Given by Customer</label>
              <input id="amount-given" type="number" value={amountGiven} onChange={(e) => setAmountGiven(e.target.value)} placeholder="e.g., 2000" />
            </div>
            {amountGiven && (
              <div className="summary-row total return">
                <span>Change to Return</span>
                <span>₹{(parseFloat(amountGiven) - transactionDetails.grandTotal).toFixed(2)}</span>
              </div>
            )}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={resetSale}>Cancel</button>
              {/* <button className="cancel-btn" onClick={() => setIsCashModalOpen(false)}>Cancel</button> */}
              <button className="confirm-btn" onClick={handleFinalizeTransaction}>Confirm & Complete Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW: UPI Checkout Modal --- */}
      {isUpiModalOpen && transactionDetails && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>UPI Checkout</h2>
            <p>Scan the QR code to pay ₹{transactionDetails.grandTotal}</p>
            <div className="qr-code-container">
              <img src={`${API_URL}/api/generate-qr/?upi_id=${appConfig.settings.upi_id}&amount=${transactionDetails.grandTotal}&bill_number=SALE`} alt="UPI QR Code" />
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={resetSale}>Cancel</button>
              {/* <button className="cancel-btn" onClick={() => setIsUpiModalOpen(false)}>Cancel</button> */}
              <button className="confirm-btn" onClick={handleFinalizeTransaction}>Payment Received & Complete Sale</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default POS;