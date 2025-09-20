// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMetrics = async (start = '', end = '') => {
    setLoading(true);
    let url = `${API_URL}/api/metrics/`;
    if (start && end) {
      url += `?start_date=${start}&end_date=${end}`;
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(); // Fetch all-time data on initial load
  }, []);

  const handleFilter = () => {
    if (startDate && endDate) {
      fetchMetrics(startDate, endDate);
    }
  };
  
  const chartData = {
    labels: metrics?.top_selling_categories.map(cat => cat.jewelry_item__category) || [],
    datasets: [{
      label: 'Sales Count by Category',
      data: metrics?.top_selling_categories.map(cat => cat.count) || [],
      backgroundColor: '#c19a6b',
      borderColor: '#a98458',
      borderWidth: 1,
    }],
  };

  // --- Chart options to set text color ---
  const chartOptions = {
    plugins: {
      legend: { labels: { color: '#333' } }
    },
    scales: {
      y: { ticks: { color: '#333' } },
      x: { ticks: { color: '#333' } }
    }
  };
  
  const downloadUrl = `${API_URL}/api/metrics/?start_date=${startDate}&end_date=${endDate}&format=csv`;

  return (
    <div className="dashboard-container">
      <h1>Sales Dashboard</h1>
      <div className="filter-container">
        <span>Start Date</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <span>End Date</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <button className="filter-btn" onClick={handleFilter}>Filter</button>
        {/* {startDate && endDate && <a href={downloadUrl} className="download-btn" download>Download Report</a>} */}
        {startDate && endDate && <a href={downloadUrl} className="download-btn" download>Download CSV</a>}
      </div>

      {loading ? <div className="loading">Loading Dashboard...</div> : metrics && (
        <>
            <div className="metrics-grid">
                <div className="metric-card">
                <h2>Total Revenue</h2>
                <p>₹{metrics.total_revenue}</p>
                </div>
                <div className="metric-card">
                <h2>Total Sales</h2>
                <p>{metrics.total_sales}</p>
                </div>
            </div>
            <div className="lists-container">
                <div className="list-card">
                    <h3>Top 5 Selling Items</h3>
                    <ul>
                        {metrics.top_selling_items.map((item, index) => (
                        <li key={index}><span>{item.jewelry_item__name}</span><span>{item.count} sold</span></li>
                        ))}
                    </ul>
                </div>
            <div className="chart-card">
              <h3>Sales by Category</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;