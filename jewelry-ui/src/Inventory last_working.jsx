// // src/App.jsx
// import React, { useState, useEffect } from 'react';
// import appConfig from './config.json'; 
// import './App.css';

// function Inventory() {
//   const [formData, setFormData] = useState({
//     name: '',
//     // Set default values for dropdowns from our config file
//     category: appConfig.categories[0],
//     style: appConfig.styles[0],
//     material: appConfig.materials[0],
//     cost_price: '',
//     selling_price: '',
//   });

// // function App() {
// //   // State for the form, matching your fields
// //   const [formData, setFormData] = useState({
// //     item_id: '',
// //     name: '',
// //     category: '',
// //     style: '',
// //     material: '',   
// //     cost_price: '',
// //     selling_price: '',
// //   });

//   const [message, setMessage] = useState('');
//   const [inventory, setInventory] = useState([]);

//   useEffect(() => {
//     fetchItems();
//   }, []);

//   const fetchItems = async () => {
//     try {
//       // CORRECTED URL HERE
//       const response = await fetch('http://127.0.0.1:8000/api/items/');
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
//       const data = await response.json();
//       setInventory(data);
//     } catch (error) {
//       console.error("Error fetching inventory:", error);
//       setMessage("Could not load inventory.");
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     try {
//       // URL IS CORRECT HERE, NO CHANGE NEEDED, BUT GOOD TO CONFIRM
//       const response = await fetch('http://127.0.0.1:8000/api/items/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (!response.ok) {
//         // If the server returns an error, let's get the details
//         const errorData = await response.json();
//         throw new Error(JSON.stringify(errorData));
//       }
      
//       const result = await response.json();
//       setMessage(`Success! Item "${result.name}" was added.`);
      
//       setFormData({
//         item_id: '', name: '', category: '', style: '', material: '',
//         cost_price: '', selling_price: '',
//       });
//       fetchItems();
//     } catch (error) {
//       // Display a more specific error if available
//       setMessage(`Error: Could not add item. Server says: ${error.message}`);
//     }
//   };

// //   return (
// //     <div className="container">
// //       <h1>Add New Jewelry Item 💎</h1>
// //       <form onSubmit={handleSubmit} className="item-form">
// //         <input name="item_id" value={formData.item_id} onChange={handleChange} placeholder="Item ID / SKU" required />
// //         <input name="name" value={formData.name} onChange={handleChange} placeholder="Item Name" required />
// //         <input name="category" value={formData.category} onChange={handleChange} placeholder="Category (e.g., Ring)" required />
// //         <input name="style" value={formData.style} onChange={handleChange} placeholder="Style (e.g., Antique)" required />
// //         <input name="material" value={formData.material} onChange={handleChange} placeholder="Material (e.g., 22K Gold)" required />
// //         <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} placeholder="Cost Price" required />
// //         <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="Selling Price" required />
// //         <button type="submit">Add Item</button>
// //       </form>
//  return (
//     <div className="container">
//       <h1>Add New Jewelry Item 💎</h1>
//       <form onSubmit={handleSubmit} className="item-form">
//         {/* Item ID is now removed from the form */}

//         <label htmlFor="name">Item Name</label>
//         <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Pearl Studs" required />
        
//         <label htmlFor="category">Category</label>
//         <select id="category" name="category" value={formData.category} onChange={handleChange}>
//           {appConfig.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
//         </select>

//         <label htmlFor="style">Style</label>
//         <select id="style" name="style" value={formData.style} onChange={handleChange}>
//           {appConfig.styles.map(sty => <option key={sty} value={sty}>{sty}</option>)}
//         </select>

//         <label htmlFor="material">Material</label>
//         <select id="material" name="material" value={formData.material} onChange={handleChange}>
//           {appConfig.materials.map(mat => <option key={mat} value={mat}>{mat}</option>)}
//         </select>

//         <label htmlFor="cost_price">Cost Price</label>
//         <input id="cost_price" type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} placeholder="e.g., 500.00" required />

//         <label htmlFor="selling_price">Selling Price</label>
//         <input id="selling_price" type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="e.g., 800.00" required />
        

//         {/* <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} placeholder="Cost Price" required />
//         <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="Selling Price" required />
//         <button type="submit">Add Item</button> */}

//         {/* The button does not need a label */}
//         <div></div> {/* Empty div as a placeholder for the label column */}
//         <button type="submit">Add Item</button>

//       </form>

//       {message && <p className="message">{message}</p>}

//       <hr className="divider" />
//       <h2>Current Inventory ✨</h2>
//       <div className="inventory-list">
//         {inventory.length > 0 ? (
//           inventory.map(item => (
//             <div key={item.id} className="inventory-item">
//               <h3>{item.name}</h3>
//               <p><strong>ID:</strong> {item.item_id}</p>
//               <p><strong>Category:</strong> {item.category}</p>
//               <p><strong>Style:</strong> {item.style}</p>
//               <p><strong>Material:</strong> {item.material}</p>
//               <p className="price"><strong>Price:</strong> ₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</p>
//               <span className={`status status-${item.stock_status.toLowerCase()}`}>
//                 {item.stock_status.replace('_', ' ')}
//               </span>
//             </div>
//           ))
//         ) : (
//           <p>No items in inventory. Add one using the form above!</p>
//         )}
//       </div>
//     </div>
//   );
// }

// // export default App;
// export default Inventory;



// src/Inventory.jsx
import React, { useState, useEffect, useRef } from 'react';
import appConfig from './config.json';
// We can reuse App.css for styles

function Inventory() {
  // --- FEATURE: Add quantity, profit_margin, and image to state ---
  const [formData, setFormData] = useState({
    name: '',
    category: appConfig.categories[0],
    style: appConfig.styles[0],
    material: appConfig.materials[0],
    cost_price: '',
    selling_price: '',
    quantity: 1, // Default to 1
    profit_margin: '', // New field for profit %
  });
  const [imageFile, setImageFile] = useState(null); // New state for the image file

  // --- FEATURE: Profit Margin Calculation ---
  // This effect automatically calculates selling_price when cost_price or profit_margin changes
  useEffect(() => {
    const cost = parseFloat(formData.cost_price);
    const margin = parseFloat(formData.profit_margin);

    if (!isNaN(cost) && !isNaN(margin) && cost > 0 && margin > 0) {
      const calculatedPrice = cost * (1 + margin / 100);
      setFormData(prevData => ({
        ...prevData,
        selling_price: calculatedPrice.toFixed(2)
      }));
    }
  }, [formData.cost_price, formData.profit_margin]);

  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState([]);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      // CORRECTED URL HERE
      const response = await fetch('http://127.0.0.1:8000/api/items/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setMessage("Could not load inventory.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If user types in selling_price manually, clear the profit margin
    if (name === 'selling_price') {
      setFormData({ ...formData, selling_price: value, profit_margin: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const fileInputRef = useRef(null);

  // --- FEATURE: Camera/Image Input ---
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  // --- NEW: Function for the "Choose File" button ---
  const handleFileButtonClick = () => {
    // Make sure the 'capture' attribute is removed for the file manager
    fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
  };

  // --- NEW: Function for the Camera Icon button ---
  const handleCameraButtonClick = () => {
    // Add the 'capture' attribute to trigger the camera on mobile
    fileInputRef.current.setAttribute('capture', 'environment');
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Use FormData to handle file uploads
    const submissionData = new FormData();
    for (const key in formData) {
      submissionData.append(key, formData[key]);
    }
    if (imageFile) {
      submissionData.append('image', imageFile);
    }

    try {
      // --- FEATURE: Update API endpoint for creation ---
      const response = await fetch('http://127.0.0.1:8000/api/items/create/', {
        method: 'POST',
        // Do NOT set Content-Type header; the browser will do it for FormData
        body: submissionData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const result = await response.json();
      setMessage(`Success! ${result.length} item(s) were added.`);

      // Reset form and image file
      setFormData({
        name: '', category: appConfig.categories[0], style: appConfig.styles[0],
        material: appConfig.materials[0], cost_price: '', selling_price: '',
        quantity: 1, profit_margin: '',
      });
      setImageFile(null);
      document.getElementById('image-input').value = null; // Clear file input
      fetchItems();
    } catch (error) {
      setMessage(`Error: Could not add item. Server says: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <h1>Add New Jewelry Item 💎</h1>
      <form onSubmit={handleSubmit} className="item-form">

        <label htmlFor="name">Item Name</label>
        <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Pearl Studs" required />

        <label htmlFor="quantity">Quantity</label>
        <input id="quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />

        <label>Image</label>
        <div className="image-input-container">
          {/* This file input is now hidden from the user */}
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ display: 'none' }} 
          />
          {/* Custom buttons that trigger the hidden input */}
          <button type="button" className="file-btn" onClick={handleFileButtonClick}>Choose File</button>
          <button type="button" className="camera-btn" onClick={handleCameraButtonClick}>📷</button>
          {imageFile && <span className="filename">{imageFile.name}</span>}
        </div>

        {/* --- FEATURE: Camera/Image Input --- */}
        {/* <label htmlFor="image-input">Image</label>
        <div className="image-input-wrapper">
        <input id="image-input" type="file" accept="image/*" onChange={handleImageChange} /> */}
        {/* This line below is new. It shows the selected filename. */}
        {/* {imageFile && <span className="filename">{imageFile.name}</span>}
        </div> */}
        {/* The 'capture' attribute prompts mobile devices to open the camera */}
        {/* <input id="image-input" type="file" accept="image/*" capture="environment" onChange={handleImageChange} /> */}

        <label htmlFor="category">Category</label>
        <select id="category" name="category" value={formData.category} onChange={handleChange}>
          {appConfig.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <label htmlFor="style">Style</label>
        <select id="style" name="style" value={formData.style} onChange={handleChange}>
          {appConfig.styles.map(sty => <option key={sty} value={sty}>{sty}</option>)}
        </select>

        <label htmlFor="material">Material</label>
        <select id="material" name="material" value={formData.material} onChange={handleChange}>
          {appConfig.materials.map(mat => <option key={mat} value={mat}>{mat}</option>)}
        </select>

        <label htmlFor="cost_price">Cost Price</label>
        <input id="cost_price" type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleChange} placeholder="e.g., 500.00" required />

        {/* --- FEATURE: Profit Margin Field --- */}
        <label htmlFor="profit_margin">Profit Margin (%)</label>
        <input id="profit_margin" type="number" step="0.01" name="profit_margin" value={formData.profit_margin} onChange={handleChange} placeholder="e.g., 60" />

        <label htmlFor="selling_price">Selling Price</label>
        <input id="selling_price" type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="Auto-calculated or manual" required />

        <div></div> {/* Empty div as a placeholder for the label column */}
        <button type="submit">Add Item(s)</button>
      </form>
      {message && <p className="message">{message}</p>}

      <hr className="divider" />
      <h2>Current Inventory ✨</h2>
      <div className="inventory-list">
         {inventory.length > 0 ? (
          inventory.map(item => (
            <div key={item.id} className="inventory-item">
                <div className="item-image-container">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="item-image" />
                ) : (
                    <div className="item-image-placeholder">No Image</div>
                )}
                </div>
              <h3>{item.name}</h3>
              <p><strong>ID:</strong> {item.item_id}</p>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Style:</strong> {item.style}</p>
              <p><strong>Material:</strong> {item.material}</p>
              <p className="price"><strong>Price:</strong> ₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</p>
              <span className={`status status-${item.stock_status.toLowerCase()}`}>
                {item.stock_status.replace('_', ' ')}
              </span>
            </div>
          ))
        ) : (
          <p>No items in inventory. Add one using the form above!</p>
        )}

      </div>
    </div>
  );
}

export default Inventory;