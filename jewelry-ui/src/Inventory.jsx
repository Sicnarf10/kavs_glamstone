// src/Inventory.jsx
import React, { useState, useEffect, useRef } from 'react';
import appConfig from './config.json';

function Inventory() {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: appConfig.categories[0],
    style: appConfig.styles[0],
    material: appConfig.materials[0],
    cost_price: '',
    profit_margin: '',
    selling_price: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState([]);
  const [groupBy, setGroupBy] = useState('category');
  const [groupedInventory, setGroupedInventory] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef(null);

  // State to track which groups are open for the accordion
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/items/');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setMessage("Could not load inventory.");
    }
  };

  useEffect(() => {
    const groupData = () => {
      if (inventory.length === 0) {
        setGroupedInventory({});
        return;
      }
      const grouped = inventory.reduce((acc, item) => {
        const key = item[groupBy] || 'Uncategorized';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
      setGroupedInventory(grouped);
    };
    groupData();
  }, [inventory, groupBy]);

  useEffect(() => {
    const cost = parseFloat(formData.cost_price);
    const margin = parseFloat(formData.profit_margin);
    if (!isNaN(cost) && !isNaN(margin) && cost > 0 && margin >= 0) {
      const calculatedPrice = cost * (1 + margin / 100);
      setFormData(prevData => ({ ...prevData, selling_price: calculatedPrice.toFixed(2) }));
    }
  }, [formData.cost_price, formData.profit_margin]);

  const handleItemClick = async (itemId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/items/${itemId}/`);
      const data = await response.json();
      setSelectedItem(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch item details:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(itemId)) newSelected.delete(itemId);
      else newSelected.add(itemId);
      return newSelected;
    });
  };

  const handleSelectGroup = (itemsInGroup) => {
    const groupItemIds = itemsInGroup.map(item => item.id);
    const areAllSelected = groupItemIds.every(id => selectedItems.has(id));
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (areAllSelected) groupItemIds.forEach(id => newSelected.delete(id));
      else groupItemIds.forEach(id => newSelected.add(id));
      return newSelected;
    });
  };

  const handleBarcodeExport = async () => {
    if (selectedItems.size === 0) return alert("Please select items to export.");
    setIsExporting(true);
    try {
      const itemIdsToExport = Array.from(selectedItems)
        .map(id => inventory.find(item => item.id === id)?.item_id)
        .filter(Boolean);

      const response = await fetch('http://127.0.0.1:8000/api/barcodes/bulk-export/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: itemIdsToExport }),
      });
      if (!response.ok) throw new Error("Failed to generate barcodes.");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "barcodes.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handlePrint = () => {
    if (!selectedItem) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`...`); // Your print logic here
    printWindow.document.close();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'selling_price') setFormData({ ...formData, selling_price: value, profit_margin: '' });
    else setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => setImageFile(e.target.files[0]);

  const handleFileButtonClick = () => {
    fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
  };

  const handleCameraButtonClick = () => {
    fileInputRef.current.setAttribute('capture', 'environment');
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    if (imageFile) submissionData.append('image', imageFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/items/create/', { method: 'POST', body: submissionData });
      if (!response.ok) throw new Error(JSON.stringify(await response.json()));
      const result = await response.json();
      setMessage(`Success! ${result.length} item(s) were added.`);
      setFormData({
        name: '', quantity: 1, category: appConfig.categories[0],
        style: appConfig.styles[0], material: appConfig.materials[0],
        cost_price: '', profit_margin: '', selling_price: '',
      });
      setImageFile(null);
      fetchItems();
    } catch (error) {
      setMessage(`Error: Could not add item. Server says: ${error.message}`);
    }
  };

  // Function to toggle a group's collapsed/expanded state
  const toggleGroup = (groupKey) => {
    setOpenGroups(prevOpenGroups => ({
      ...prevOpenGroups,
      [groupKey]: !prevOpenGroups[groupKey]
    }));
  };

  return (
    <>
      <div className="container">
        <h1>Add New Jewelry Item 💎</h1>
        <form onSubmit={handleSubmit} className="item-form">
          <label htmlFor="name">Item Name</label>
          <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Pearl Studs" required />
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />
          <label>Image</label>
          <div className="image-input-container">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            <button type="button" className="file-btn" onClick={handleFileButtonClick}>Choose File</button>
            <button type="button" className="camera-btn" onClick={handleCameraButtonClick}>📷</button>
            {imageFile && <span className="filename">{imageFile.name}</span>}
          </div>
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
          <label htmlFor="profit_margin">Profit Margin (%)</label>
          <input id="profit_margin" type="number" step="0.01" name="profit_margin" value={formData.profit_margin} onChange={handleChange} placeholder="e.g., 60" />
          <label htmlFor="selling_price">Selling Price</label>
          <input id="selling_price" type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} placeholder="Auto-calculated or manual" required />
          <div></div>
          <button type="submit">Add Item(s)</button>
        </form>
        {message && <p className="message">{message}</p>}
        <hr className="divider" />

        <h2>Current Inventory ✨</h2>
        <div className="inventory-controls">
          <div className="group-by-buttons">
            <span>Group By:</span>
            <button onClick={() => setGroupBy('category')} className={groupBy === 'category' ? 'active' : ''}>Category</button>
            <button onClick={() => setGroupBy('style')} className={groupBy === 'style' ? 'active' : ''}>Style</button>
            <button onClick={() => setGroupBy('material')} className={groupBy === 'material' ? 'active' : ''}>Material</button>
          </div>
          <button className="export-btn" onClick={handleBarcodeExport} disabled={selectedItems.size === 0 || isExporting}>
            {isExporting ? 'Exporting...' : `Export ${selectedItems.size} Barcode(s)`}
          </button>
        </div>

        <div className="grouped-inventory-view">
          {Object.keys(groupedInventory).sort().map(groupKey => {
            const itemsInGroup = groupedInventory[groupKey];
            const areAllInGroupSelected = itemsInGroup.length > 0 && itemsInGroup.every(item => selectedItems.has(item.id));
            const isGroupOpen = !!openGroups[groupKey];
            return (
              <div key={groupKey} className="inventory-group">
                <button className="group-header" onClick={() => toggleGroup(groupKey)}>
                  <input
                    type="checkbox"
                    checked={areAllInGroupSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => handleSelectGroup(itemsInGroup)}
                  />
                  {groupKey} <span>({itemsInGroup.length} Items)</span>
                  <span className={`collapse-icon ${isGroupOpen ? 'open' : ''}`}>›</span>
                </button>
                
                {isGroupOpen && (
                  <div className="item-table">
                    <div className="item-table-header">
                      <div>Select</div>
                      <div>Image</div>
                      <div>Item ID</div>
                      <div>Name</div>
                      <div>Status</div>
                      <div>Price</div>
                    </div>
                    {itemsInGroup.map(item => (
                      <div key={item.id} className="item-table-row">
                        <div className="item-cell" data-label="Select">
                          <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => handleSelectItem(item.id)} />
                        </div>
                        <div className="item-cell item-image-cell" data-label="Image">
                          {item.image ? <img src={item.image} alt={item.name} /> : <div className="placeholder-box"></div>}
                        </div>
                        <div className="item-cell" data-label="Item ID">
                          <a href="#" onClick={(e) => { e.preventDefault(); handleItemClick(item.id); }}>
                            {item.item_id}
                          </a>
                        </div>
                        <div className="item-cell" data-label="Name">{item.name}</div>
                        <div className="item-cell" data-label="Status">
                          <span className={`status-badge status-${item.stock_status.toLowerCase()}`}>{item.stock_status.replace('_', ' ')}</span>
                        </div>
                        <div className="item-cell" data-label="Price">₹{parseFloat(item.selling_price).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>&times;</button>
            <div className="modal-image-container">
              <img src={selectedItem.image} alt={selectedItem.name} />
            </div>
            <div className="modal-details">
              <h2>{selectedItem.name} ({selectedItem.item_id})</h2>
              <p><strong>Category:</strong> {selectedItem.category}</p>
              <p><strong>Style:</strong> {selectedItem.style}</p>
              <p><strong>Material:</strong> {selectedItem.material}</p>
              <p className="modal-price"><strong>Price:</strong> ₹{parseFloat(selectedItem.selling_price).toLocaleString('en-IN')}</p>
              <p><strong>Status:</strong> {selectedItem.stock_status.replace('_', ' ')}</p>
              <p><strong>Date Added:</strong> {new Date(selectedItem.added_date).toLocaleDateString()}</p>
              <div className="modal-barcode-section">
                <h4>Barcode</h4>
                <img className="barcode-image" src={`http://127.0.0.1:8000/api/barcode/${selectedItem.item_id}/`} alt={`Barcode for ${selectedItem.item_id}`} />
                <button className="print-btn" onClick={handlePrint}>Print Barcode</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Inventory;