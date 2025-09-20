// src/Receipts.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Reports.css'; // We can reuse the report table styles
const API_URL = import.meta.env.VITE_API_URL;

function Receipts() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Construct the URL with a search query if a search term exists
    const url = `${API_URL}/api/transactions/list/?search=${searchTerm}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setTransactions(data))
      .catch(error => console.error("Failed to fetch transactions:", error));
  }, [searchTerm]); // Re-fetch whenever the search term changes

  return (
    <div className="report-container">
      <h1>Past Receipts</h1>
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by Bill #, Customer Name or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <table className="report-table">
        <thead>
          <tr>
            <th>Bill Number</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>View</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td data-label="Bill #">{tx.bill_number}</td>
              <td data-label="Customer">{tx.customer_name}</td>
              <td data-label="Date">{new Date(tx.transaction_date).toLocaleString()}</td>
              <td data-label="Amount">₹{parseFloat(tx.grand_total).toLocaleString('en-IN')}</td>
              <td data-label="View">
                <Link to={`/receipt/${tx.id}`} className="view-link">View Receipt</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default Receipts;