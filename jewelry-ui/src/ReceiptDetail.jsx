// src/ReceiptDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Receipt.css'; // We will create this new CSS file

const API_URL = import.meta.env.VITE_API_URL;

function ReceiptDetail() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (id) {
      fetch(`${API_URL}/api/transactions/${id}/`)
        .then(res => res.json())
        .then(data => setReceipt(data))
        .catch(error => console.error("Failed to fetch receipt:", error));
    }
  }, [id]);

  if (!receipt) return <div className="loading">Loading receipt...</div>;

  return (
    <div className="receipt-page-container">
      <div className="receipt-paper">
        <div className="receipt-header">
          <div className="logo-placeholder-receipt">KV</div>
          <h2>Kavs Glamstone</h2>
          <p>123 Jewel Street, Chennai, TN | +91 99999 88888</p>
        </div>
        <div className="receipt-info">
          <div><strong>Bill No:</strong> {receipt.bill_number}</div>
          <div><strong>Date:</strong> {new Date(receipt.transaction_date).toLocaleString()}</div>
        </div>
        <div className="customer-info">
          <h4>Billed To:</h4>
          <p>{receipt.customer.name}</p>
          <p>{receipt.customer.phone_number}</p>
        </div>
        <table className="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {receipt.sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.jewelry_item_name}</td>
                <td style={{ textAlign: 'center' }}>{sale.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{parseFloat(sale.price_at_sale).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div className="totals-row"><strong>Sub-total:</strong> <span>₹{parseFloat(receipt.sub_total).toLocaleString('en-IN')}</span></div>
          <div className="totals-row"><strong>CGST:</strong> <span>₹{parseFloat(receipt.cgst_amount).toLocaleString('en-IN')}</span></div>
          <div className="totals-row"><strong>SGST:</strong> <span>₹{parseFloat(receipt.sgst_amount).toLocaleString('en-IN')}</span></div>
          <div className="totals-row grand-total"><strong>Grand Total:</strong> <span>₹{parseFloat(receipt.grand_total).toLocaleString('en-IN')}</span></div>
        </div>
        <div className="receipt-footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
      <button onClick={() => window.print()} className="print-btn-receipt">Print Receipt</button>
    </div>
  );
}
export default ReceiptDetail;