import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Button from '../P-Button.jsx';
import Modal from '../P-Modal.jsx';
import { Plus, FileDown, Edit, Trash, Check, Download, UserPlus, Eye, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://localhost:5000/api';

const PestDiseaseManagement = () => {
  const { t } = useLanguage();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [editingIssue, setEditingIssue] = useState(null);
  const [editingConsultation, setEditingConsultation] = useState(null);
  const [selectedPestId, setSelectedPestId] = useState('');
  
  // State for data
  const [issueRecords, setIssueRecords] = useState([]);
  const [specialistRecords, setSpecialistRecords] = useState([]);
  const [issueTypeData, setIssueTypeData] = useState([]);
  const [issuesByGreenhouseData, setIssuesByGreenhouseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#EF5350', '#FFA726', '#29B6F6', '#66BB6A'];

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPests(),
        fetchConsultations(),
        fetchPestStats()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pests`);
      const data = await response.json();
      if (data.success) {
        setIssueRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching pests:', error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations`);
      const data = await response.json();
      if (data.success) {
        setSpecialistRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const fetchPestStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pests/stats`);
      const data = await response.json();
      if (data.success) {
        setIssueTypeData(data.data.issueTypeData);
        setIssuesByGreenhouseData(data.data.issuesByGreenhouseData);
      }
    } catch (error) {
      console.error('Error fetching pest stats:', error);
    }
  };

  const handleAddIssue = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pests`, {
        method: 'POST',
        body: formData // FormData with image
      });
      
      const data = await response.json();
      if (data.success) {
        setShowIssueModal(false);
        fetchAllData(); // Refresh all data
        alert('Issue added successfully!');
      } else {
        alert('Error adding issue: ' + data.message);
      }
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Error adding issue');
    }
  };

  const handleUpdateIssue = async (id, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pests/${id}`, {
        method: 'PUT',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setShowIssueModal(false);
        setEditingIssue(null);
        fetchAllData();
        alert('Issue updated successfully!');
      } else {
        alert('Error updating issue: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Error updating issue');
    }
  };

  const handleDeleteIssue = async (id) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/pests/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
          fetchAllData();
          alert('Issue deleted successfully!');
        } else {
          alert('Error deleting issue: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting issue:', error);
        alert('Error deleting issue');
      }
    }
  };

  const handleAssignSpecialist = async (consultationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSpecialistModal(false);
        setSelectedPestId('');
        fetchAllData();
        alert('Specialist assigned successfully!');
      } else {
        alert('Error assigning specialist: ' + data.message);
      }
    } catch (error) {
      console.error('Error assigning specialist:', error);
      alert('Error assigning specialist');
    }
  };

  const handleUpdateConsultation = async (id, consultationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/consultations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowSpecialistModal(false);
        setEditingConsultation(null);
        fetchAllData();
        alert('Consultation updated successfully!');
      } else {
        alert('Error updating consultation: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating consultation:', error);
      alert('Error updating consultation');
    }
  };

  const handleDeleteConsultation = async (id) => {
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/consultations/${id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
          fetchAllData();
          alert('Consultation deleted successfully!');
        } else {
          alert('Error deleting consultation: ' + data.message);
        }
      } catch (error) {
        console.error('Error deleting consultation:', error);
        alert('Error deleting consultation');
      }
    }
  };

  const handleDownloadPestPDF = (id) => {
    window.open(`${API_BASE_URL}/pests/${id}/pdf`, '_blank');
  };

  const handleDownloadConsultationPDF = (id) => {
    window.open(`${API_BASE_URL}/consultations/${id}/pdf`, '_blank');
  };

  const openImageModal = (imagePath) => {
    setSelectedImage(`http://localhost:5000${imagePath}`);
    setShowImageModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-orange-100 text-orange-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Loading pest and disease data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 pb-4 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-black mb-4 lg:mb-0">Pest & Disease Management</h1>
        <div className="flex flex-wrap gap-3">
          <Button 
            icon={<Plus size={16} />} 
            onClick={() => setShowIssueModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Add Issue
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-black">Issues by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={issueTypeData} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                outerRadius={80} 
                fill="#8884d8" 
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {issueTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-black">Issues by Greenhouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={issuesByGreenhouseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="greenhouseNo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#EF5350" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-black">Pest & Disease Issues</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Greenhouse No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Issue Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issueRecords.map(record => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.greenhouseNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.image ? (
                      <button 
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => openImageModal(record.image)}
                      >
                        <Eye size={14} /> View
                      </button>
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {record.issueType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => {
                          setEditingIssue(record);
                          setShowIssueModal(true);
                        }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        onClick={() => handleDeleteIssue(record._id)}
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                      <button 
                        className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                        onClick={() => {
                          setSelectedPestId(record._id);
                          setShowSpecialistModal(true);
                        }}
                        title="Assign Specialist"
                      >
                        <UserPlus size={14} />
                      </button>
                      <button 
                        className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        onClick={() => handleDownloadPestPDF(record._id)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialist Consultation Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-black">Specialist Consultation Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Specialist Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Date Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Greenhouse No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Treated Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specialistRecords.map(record => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.specialistName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(record.dateAssigned).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.greenhouseNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.treatedIssue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        onClick={() => {
                          setEditingConsultation(record);
                          setShowSpecialistModal(true);
                        }}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        onClick={() => handleDeleteConsultation(record._id)}
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                      <button 
                        className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        onClick={() => handleDownloadConsultationPDF(record._id)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showIssueModal && (
        <IssueModal
          isEditing={!!editingIssue}
          editData={editingIssue}
          onClose={() => {
            setShowIssueModal(false);
            setEditingIssue(null);
          }}
          onSubmit={editingIssue ? handleUpdateIssue : handleAddIssue}
        />
      )}

      {showSpecialistModal && (
        <SpecialistModal
          isEditing={!!editingConsultation}
          editData={editingConsultation}
          pestId={selectedPestId}
          issueRecords={issueRecords}
          onClose={() => {
            setShowSpecialistModal(false);
            setEditingConsultation(null);
            setSelectedPestId('');
          }}
          onSubmit={editingConsultation ? handleUpdateConsultation : handleAssignSpecialist}
        />
      )}

      {showImageModal && (
        <ImageModal
          imageSrc={selectedImage}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </div>
  );
};

// Issue Modal Component
const IssueModal = ({ isEditing, editData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    greenhouseNo: editData?.greenhouseNo || '',
    date: editData?.date ? editData.date.split('T')[0] : '',
    issueType: editData?.issueType || '',
    description: editData?.description || '',
    severity: editData?.severity || 'Medium'
  });
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = new FormData();
    
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    if (isEditing) {
      onSubmit(editData._id, submitData);
    } else {
      onSubmit(submitData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Pest & Disease Issue" : "Add Pest & Disease Issue"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greenhouse No
              </label>
              <input 
                type="text" 
                value={formData.greenhouseNo}
                onChange={(e) => setFormData({...formData, greenhouseNo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select 
                value={formData.issueType}
                onChange={(e) => setFormData({...formData, issueType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Type</option>
                <option value="Fungus">Fungus</option>
                <option value="Insect">Insect</option>
                <option value="Virus">Virus</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select 
                value={formData.severity}
                onChange={(e) => setFormData({...formData, severity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea 
              rows="4" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {isEditing ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Specialist Modal Component
const SpecialistModal = ({ isEditing, editData, pestId, issueRecords, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    pestId: editData?.pestId || pestId,
    specialistName: editData?.specialistName || '',
    dateAssigned: editData?.dateAssigned ? editData.dateAssigned.split('T')[0] : '',
    greenhouseNo: editData?.greenhouseNo || '',
    treatedIssue: editData?.treatedIssue || '',
    specialistNotes: editData?.specialistNotes || '',
    status: editData?.status || 'Assigned',
    treatmentStartDate: editData?.treatmentStartDate ? editData.treatmentStartDate.split('T')[0] : '',
    followUpRequired: editData?.followUpRequired || false,
    followUpDate: editData?.followUpDate ? editData.followUpDate.split('T')[0] : '',
    cost: editData?.cost || 0
  });

  // Auto-fill greenhouse number when pest is selected
  useEffect(() => {
    if (pestId && issueRecords.length > 0) {
      const selectedPest = issueRecords.find(pest => pest._id === pestId);
      if (selectedPest) {
        setFormData(prev => ({
          ...prev,
          greenhouseNo: selectedPest.greenhouseNo,
          treatedIssue: `${selectedPest.issueType} - ${selectedPest.description}`
        }));
      }
    }
  }, [pestId, issueRecords]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      onSubmit(editData._id, formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Specialist Assignment" : "Assign Specialist"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialist Name
              </label>
              <input 
                type="text" 
                value={formData.specialistName}
                onChange={(e) => setFormData({...formData, specialistName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Assigned
              </label>
              <input 
                type="date" 
                value={formData.dateAssigned}
                onChange={(e) => setFormData({...formData, dateAssigned: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greenhouse No
              </label>
              <input 
                type="text" 
                value={formData.greenhouseNo}
                onChange={(e) => setFormData({...formData, greenhouseNo: e.target.value})}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!!pestId ? 'bg-gray-100' : ''}`}
                required 
                readOnly={!!pestId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue to Treat
            </label>
            <textarea 
              value={formData.treatedIssue}
              onChange={(e) => setFormData({...formData, treatedIssue: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialist Notes
            </label>
            <textarea 
              value={formData.specialistNotes}
              onChange={(e) => setFormData({...formData, specialistNotes: e.target.value})}
              rows="4"
              placeholder="Enter specialist's observations, treatment plan, or recommendations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Start Date
              </label>
              <input 
                type="date" 
                value={formData.treatmentStartDate}
                onChange={(e) => setFormData({...formData, treatmentStartDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment Cost ($)
              </label>
              <input 
                type="number" 
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <input 
                type="checkbox" 
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({...formData, followUpRequired: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="followUpRequired" className="ml-2 block text-sm text-gray-900">
                Follow-up Required
              </label>
            </div>
            {formData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Date
                </label>
                <input 
                  type="date" 
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check size={16} />
              {isEditing ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



// Image Modal Component
const ImageModal = ({ imageSrc, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Issue Image</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <img 
            src={imageSrc} 
            alt="Issue" 
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default PestDiseaseManagement;