// src/Reports.jsx
import React, { useState, useEffect } from 'react';
import './Reports.css'; // We'll create this file next

function Reports() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('${import.meta.env.VITE_API_URL}/api/inventory-report/');
        const data = await response.json();
        setReportData(data);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <div className="report-container">
      <h1>Inventory Stock Report</h1>
      <a href="${import.meta.env.VITE_API_URL}/api/inventory-report/?format=csv" className="download-btn" download>
        Download as CSV
      </a>
      {loading ? <p>Loading report...</p> : (
        <table className="report-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item Name</th>
              <th>Style</th>
              <th>Material</th>
              <th>Stock Count</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, index) => (
                <tr key={index}>
                    <td data-label="Category">{row.category}</td>
                    <td data-label="Item Name">{row.name}</td>
                    <td data-label="Style">{row.style}</td>
                    <td data-label="Material">{row.material}</td>
                    <td data-label="Stock Count">{row.count}</td>
                </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export default Reports;