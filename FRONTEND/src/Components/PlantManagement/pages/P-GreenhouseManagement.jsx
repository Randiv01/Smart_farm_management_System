import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash, X, Check, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import "../styles/theme.css";


const API_URL = 'http://localhost:5000/api/plants';
const IMG_BASE = 'http://localhost:5000';

const GreenhouseManagement = () => {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlant, setExpandedPlant] = useState(null);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlant, setCurrentPlant] = useState(null);
  const [formData, setFormData] = useState({
    plantName: '', category: '', greenhouseId: '', length: '', width: '', location: '', plantedDate: '', expectedHarvest: '', estimatedYield: '', status: 'Active',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(API_URL);
      setPlants(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlants(); }, []);

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };
  const handleImageChange = (e) => { const file = e.target.files?.[0]; if (!file) return; setSelectedImage(file); const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file); };
  const handleImageRemove = () => { setSelectedImage(null); setImagePreview(null); };
  const resetForm = () => { setFormData({ plantName:'', category:'', greenhouseId:'', length:'', width:'', location:'', plantedDate:'', expectedHarvest:'', estimatedYield:'', status:'Active' }); setSelectedImage(null); setImagePreview(null); setSubmitStatus(null); };
  const handleAddClick = () => { setIsEditing(false); setCurrentPlant(null); resetForm(); setShowModal(true); };
  const handleEditClick = (plant) => { 
    setIsEditing(true); setCurrentPlant(plant); 
    setFormData({ 
      plantName: plant.plantName||'', category:plant.category||'', greenhouseId:plant.greenhouseId||'', length:plant.length||'', width:plant.width||'', location:plant.location||'', plantedDate:plant.plantedDate?plant.plantedDate.split('T')[0]:'', expectedHarvest:plant.expectedHarvest?plant.expectedHarvest.split('T')[0]:'', estimatedYield:plant.estimatedYield||'', status:plant.status||'Active'
    });
    setSelectedImage(null); setImagePreview(plant.imageUrl?`${IMG_BASE}${plant.imageUrl}`:null); setShowModal(true);
  };
  const handleDeleteClick = async (id) => { try { await axios.delete(`${API_URL}/${id}`); fetchPlants(); } catch (error) { console.error(error); } };
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([k,v])=>data.append(k,v));
    if(selectedImage) data.append('plantImage', selectedImage);
    try {
      if(isEditing && currentPlant?._id) await axios.put(`${API_URL}/${currentPlant._id}`, data, { headers:{'Content-Type':'multipart/form-data'} });
      else await axios.post(`${API_URL}/add`, data, { headers:{'Content-Type':'multipart/form-data'} });
      setSubmitStatus('success'); fetchPlants(); setTimeout(()=>{setShowModal(false); resetForm();},1200);
    } catch(err) { console.error(err); setSubmitStatus('error'); }
  };

  const togglePlantDetails = (id) => setExpandedPlant(p => p===id?null:id);
  const filteredPlants = plants.filter(p => (category==='all'||p.category?.toLowerCase()===category.toLowerCase()) && (p.plantName||'').toLowerCase().includes(searchQuery.toLowerCase()));
  const vegetables = filteredPlants.filter(p => (p.category||'').toLowerCase()==='vegetable');
  const fruits = filteredPlants.filter(p => (p.category||'').toLowerCase()==='fruit');

  const bgCard = theme==='dark'?'bg-[#2d2d2d]':'bg-white';
  const textColor = theme==='dark'?'text-gray-200':'text-gray-800';
  const borderColor = theme==='dark' ? 'border-[#3a3a3b]' : 'border-gray-300';
  const buttonBorderColor = theme==='dark' ? 'border-[#3a3a3b]' : 'border-gray-300';

  if(loading) return <div className={textColor}>Loading...</div>;

  const renderPlantCard = (plant) => (
    <div key={plant._id} className={`flex flex-col p-3 rounded-xl border ${borderColor} ${bgCard} transition-shadow shadow-sm hover:shadow-md`}>
      <div className="flex gap-3 mb-3">
        <div className="w-16 h-16 overflow-hidden rounded-lg flex-shrink-0">
          <img src={plant.imageUrl?`${IMG_BASE}${plant.imageUrl}`:'https://via.placeholder.com/60'} alt={plant.plantName} className="w-full h-full object-cover"/>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{plant.plantName}</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${plant.status==='Active'?'bg-green-100 text-green-700':plant.status==='Inactive'?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-700'}`}>{plant.status}</span>
        </div>
      </div>
      <div className="flex justify-between mb-3 text-sm">
        <span><span className="font-semibold">Greenhouse ID:</span> {plant.greenhouseId}</span>
        <span><span className="font-semibold">Expected Harvest:</span> {plant.expectedHarvest?new Date(plant.expectedHarvest).toLocaleDateString():'-'}</span>
      </div>
      <button
        className={`w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md border ${buttonBorderColor} ${
          theme==='dark' ? 'hover:bg-green-700/20' : 'hover:bg-green-100'
        }`}
        onClick={()=>togglePlantDetails(plant._id)}
      >
        {expandedPlant===plant._id ? <><ChevronUp size={16}/>Hide Details</> : <><ChevronDown size={16}/>Show Details</>}
      </button>
      {expandedPlant===plant._id && (
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
            <div><span className="text-gray-400">Category:</span> {plant.category}</div>
            <div><span className="text-gray-400">Planted Date:</span> {plant.plantedDate?new Date(plant.plantedDate).toLocaleDateString():'-'}</div>
            <div><span className="text-gray-400">Expected Harvest:</span> {plant.expectedHarvest?new Date(plant.expectedHarvest).toLocaleDateString():'-'}</div>
            <div><span className="text-gray-400">Estimated Yield:</span> {plant.estimatedYield} kg</div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-md text-sm" onClick={()=>handleEditClick(plant)}><Edit size={14}/> Edit</button>
            <button className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-md text-sm" onClick={()=>handleDeleteClick(plant._id)}><Trash size={14}/> Delete</button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col gap-6 p-4 ${textColor}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Greenhouse Management</h1>
        <button className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600" onClick={handleAddClick}><Plus size={16}/> Add Plant</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select value={category} onChange={e=>setCategory(e.target.value)} className={`px-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor}`}>
          <option value="all">All</option>
          <option value="vegetable">Vegetables</option>
          <option value="fruit">Fruits</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className={`w-full pl-9 pr-3 py-2 rounded-md border ${borderColor} ${bgCard} ${textColor}`} />
        </div>
      </div>

      {/* Plants Grid */}
      {category==='all' ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div><h2 className="text-xl font-semibold mb-2">Vegetables</h2><div className="grid sm:grid-cols-2 gap-4">{vegetables.map(renderPlantCard)}</div></div>
          <div><h2 className="text-xl font-semibold mb-2">Fruits</h2><div className="grid sm:grid-cols-2 gap-4">{fruits.map(renderPlantCard)}</div></div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">{category==='vegetable'?'Vegetables':'Fruits'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">{filteredPlants.map(renderPlantCard)}</div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-2xl p-4 rounded-xl ${bgCard} ${textColor} overflow-y-auto max-h-[80vh]`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{isEditing?'Edit Plant':'Add New Plant'}</h2>
              <button onClick={()=>{setShowModal(false); resetForm();}}><X size={20}/></button>
            </div>
            <form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-1">
                  <label>Plant Name</label>
                  <input type="text" name="plantName" value={formData.plantName} onChange={handleInputChange} required className={`px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`} />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required className={`px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}>
                    <option value="">Select Category</option>
                    <option value="Vegetable">Vegetable</option>
                    <option value="Fruit">Fruit</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="Greenhouse ID" name="greenhouseId" value={formData.greenhouseId} onChange={handleInputChange} className={`flex-1 px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`} required/>
                <input type="number" placeholder="Length" name="length" value={formData.length} onChange={handleInputChange} className={`flex-1 px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
                <input type="number" placeholder="Width" name="width" value={formData.width} onChange={handleInputChange} className={`flex-1 px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
              </div>
              <input type="text" placeholder="Location" name="location" value={formData.location} onChange={handleInputChange} className={`px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="date" name="plantedDate" value={formData.plantedDate} onChange={handleInputChange} className={`flex-1 px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
                <input type="date" name="expectedHarvest" value={formData.expectedHarvest} onChange={handleInputChange} className={`flex-1 px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
              </div>
              <input type="number" placeholder="Estimated Yield (kg)" name="estimatedYield" value={formData.estimatedYield} onChange={handleInputChange} className={`px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}/>
              <select name="status" value={formData.status} onChange={handleInputChange} className={`px-2 py-1 rounded-md border ${borderColor} ${bgCard} ${textColor}`}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              {/* Image upload */}
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-2 px-3 py-2 border-dashed border-2 rounded-md cursor-pointer ${borderColor} hover:border-green-500}`}>
                  <Upload size={16}/> Upload Image
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </label>
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-md overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                    <button type="button" className="absolute top-1 right-1 w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white" onClick={handleImageRemove}><X size={12}/></button>
                  </div>
                )}
              </div>

              {submitStatus==='success' && <div className="text-green-600 font-medium">✅ Plant saved successfully!</div>}
              {submitStatus==='error' && <div className="text-red-600 font-medium">❌ Error saving plant.</div>}

              <div className="flex justify-end gap-2">
                <button type="submit" className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"><Check size={14}/> Submit</button>
                <button type="button" onClick={()=>{setShowModal(false); resetForm();}} className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreenhouseManagement;
