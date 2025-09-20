// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Inventory from './Inventory'; // We will move inventory logic here
import POS from './POS'; // Our new POS component
import Reports from './Reports'; // <-- Import the new Report component
import Dashboard from './Dashboard'; // <-- Import the Dashboard component
import Receipts from './Receipts';
import ReceiptDetail from './ReceiptDetail';
import './App.css';

// function App() {
//   return (
//     <Router>
//       <div>
//         <nav className="main-nav">
//           <div className="logo-placeholder">Kavs Glamstone</div>
//           <Link to="/">Inventory</Link>
//           <Link to="/pos">POS</Link>
//           <Link to="/dashboard">Dashboard</Link> {/* <-- Add the new link */}
//           <Link to="/reports">Reports</Link>
//         </nav>
//         <div className="content">
//           <Routes>
//             <Route path="/pos" element={<POS />} />
//             <Route path="/dashboard" element={<Dashboard />} /> {/* <-- Add the new route */}
//             <Route path="/reports" element={<Reports />} />
//             <Route path="/" element={<Inventory />} />
//           </Routes>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;

function App() {
  return (
    <Router>
      <div>
        <nav className="main-nav">
          <div className="logo-placeholder">
            <span className="logo-full">Kavs Glamstone</span>
            <span className="logo-short">KG</span>
          </div>
          <NavLink to="/" className={({ isActive }) => isActive ? "active-link" : ""}>Inventory</NavLink>
          <NavLink to="/pos" className={({ isActive }) => isActive ? "active-link" : ""}>POS</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active-link" : ""}>Dashboard</NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? "active-link" : ""}>Reports</NavLink>
        </nav>
        <div className="content">
          <Routes>
            <Route path="/pos" element={<POS />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/receipt/:id" element={<ReceiptDetail />} />
            <Route path="/" element={<Inventory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;