import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useTheme } from '../context/ThemeContext';
import Button from '../P-Button.jsx';
import Modal from '../P-Modal.jsx';
import { Plus, FileDown, Edit, Trash, Check, Download, UserPlus, Eye, X, Send } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = 'http://localhost:5000/api';

const PestDiseaseManagement = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
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

  // Theme.css සමග match කරන ලද Theme-based colors - CSS variables භාවිතා කරමු
  const bgBase = theme === 'dark' ? 'var(--background)' : 'var(--background)';
  const bgCard = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const textColor = theme === 'dark' ? 'var(--text)' : 'var(--text)';
  const borderColor = theme === 'dark' ? 'var(--border)' : 'var(--border)';
  const inputBg = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const inputText = theme === 'dark' ? 'var(--text)' : 'var(--text)';

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

  const handleSendToHealthManagement = async (record) => {
    try {
      setLoading(true);
      const notificationData = {
        title: 'Pest & Disease Report',
        message: `${record.issueType} issue in ${record.greenhouseNo} - ${record.description}`,
        type: 'warning',
        source: 'Plant Management',
        targetModule: 'Health Management',
        data: {
          pestId: record._id,
          greenhouseNo: record.greenhouseNo,
          issueType: record.issueType,
          description: record.description,
          severity: record.severity,
          date: record.date,
          image: record.image,
          pdfUrl: `${API_BASE_URL}/pests/${record._id}/pdf`
        }
      };

      // Create notification for Plant Management as well
      const plantNotificationData = {
        title: 'Pest Report Sent',
        message: `Pest & Disease report sent to Health Management: ${record.issueType} in ${record.greenhouseNo}`,
        type: 'warning',
        source: 'Plant Management',
        targetModule: 'Plant Management',
        data: {
          pestId: record._id,
          greenhouseNo: record.greenhouseNo,
          issueType: record.issueType,
          description: record.description,
          severity: record.severity,
          date: record.date,
          image: record.image,
          pdfUrl: `${API_BASE_URL}/pests/${record._id}/pdf`
        }
      };

      await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      await fetch('http://localhost:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(plantNotificationData)
      });

      alert('Report sent to Health Management successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imagePath) => {
    setSelectedImage(`http://localhost:5000${imagePath}`);
    setShowImageModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className={`ml-3 text-lg ${textColor}`}>Loading pest and disease data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg dark:bg-red-900 dark:border-red-700 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{backgroundColor: 'var(--background)'}} className={`p-6 min-h-screen`}>
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 pb-4 border-b-2`} style={{borderColor: 'var(--border)'}}>
        <h1 style={{color: 'var(--text)'}} className={`text-3xl font-bold mb-4 lg:mb-0`}>Pest & Disease Management</h1>
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
        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className={`p-6 rounded-lg shadow-md border`}>
          <h3 style={{color: 'var(--text)'}} className={`text-xl font-semibold mb-4`}>Issues by Type</h3>
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
              <Tooltip contentStyle={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }} />
              <Legend wrapperStyle={{ color: 'var(--text)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className={`p-6 rounded-lg shadow-md border`}>
          <h3 style={{color: 'var(--text)'}} className={`text-xl font-semibold mb-4`}>Issues by Greenhouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={issuesByGreenhouseData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ccc'} />
              <XAxis dataKey="greenhouseNo" stroke={'var(--text)'} />
              <YAxis stroke={'var(--text)'} />
              <Tooltip contentStyle={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)'
              }} />
              <Bar dataKey="count" fill="#EF5350" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Issues Table */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className={`rounded-lg shadow-md mb-8 border`}>
        <div className={`px-6 py-4 border-b`} style={{borderColor: 'var(--border)'}}>
          <h2 style={{color: 'var(--text)'}} className={`text-2xl font-semibold`}>Pest & Disease Issues</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead style={{backgroundColor: 'var(--card-bg)'}}>
              <tr>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Greenhouse No
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Date
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Image
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Issue Type
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Description
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y`} style={{borderColor: 'var(--border)'}}>
              {issueRecords.map(record => (
                <tr key={record._id} style={theme === 'dark' ? {backgroundColor: 'var(--card-bg)'} : {backgroundColor: 'var(--card-bg)'}} className="hover:bg-opacity-80">
                  <td style={{color: 'var(--text)'}} className={`px-6 py-4 whitespace-nowrap text-sm font-medium`}>
                    {record.greenhouseNo}
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 whitespace-nowrap text-sm`}>
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 whitespace-nowrap text-sm`}>
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
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {record.issueType}
                    </span>
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 text-sm max-w-xs truncate`}>
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
                        className="p-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                        onClick={() => handleDownloadPestPDF(record._id)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                        onClick={() => handleSendToHealthManagement(record)}
                        title="Send to Health Management"
                      >
                        <Send size={14} />
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialist Consultation Section */}
      <div style={{backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)'}} className={`rounded-lg shadow-md border`}>
        <div className={`px-6 py-4 border-b`} style={{borderColor: 'var(--border)'}}>
          <h2 style={{color: 'var(--text)'}} className={`text-2xl font-semibold`}>Specialist Consultation Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead style={{backgroundColor: 'var(--card-bg)'}}>
              <tr>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Specialist Name
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Date Assigned
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Greenhouse No
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Treated Issue
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Status
                </th>
                <th style={{color: 'var(--text)'}} className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y`} style={{borderColor: 'var(--border)'}}>
              {specialistRecords.map(record => (
                <tr key={record._id} style={theme === 'dark' ? {backgroundColor: 'var(--card-bg)'} : {backgroundColor: 'var(--card-bg)'}} className="hover:bg-opacity-80">
                  <td style={{color: 'var(--text)'}} className={`px-6 py-4 whitespace-nowrap text-sm font-medium`}>
                    {record.specialistName}
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 whitespace-nowrap text-sm`}>
                    {new Date(record.dateAssigned).toLocaleDateString()}
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 whitespace-nowrap text-sm`}>
                    {record.greenhouseNo}
                  </td>
                  <td style={{color: 'var(--text-light)'}} className={`px-6 py-4 text-sm max-w-xs truncate`}>
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
          theme={theme}
          inputBg={inputBg}
          inputText={inputText}
          borderColor={borderColor}
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
          theme={theme}
          inputBg={inputBg}
          inputText={inputText}
          borderColor={borderColor}
        />
      )}

      {showImageModal && (
        <ImageModal
          imageSrc={selectedImage}
          onClose={() => setShowImageModal(false)}
          theme={theme}
          bgCard={bgCard}
          borderColor={borderColor}
          textColor={textColor}
        />
      )}
    </div>
  );
};

// Issue Modal Component
const IssueModal = ({ isEditing, editData, onClose, onSubmit, theme, inputBg, inputText, borderColor }) => {
  const [formData, setFormData] = useState({
    greenhouseNo: editData?.greenhouseNo || '',
    date: editData?.date ? editData.date.split('T')[0] : '',
    issueType: editData?.issueType || '',
    description: editData?.description || '',
    severity: editData?.severity || 'Medium'
  });
  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);

  // Theme.css සමග match කරන ලද Theme-based colors - CSS variables භාවිතා කරමු
  const bgCard = 'var(--card-bg)';
  const textColor = 'var(--text)';

  const validateForm = () => {
    const errors = {};
    
    // Greenhouse No validation
    if (!formData.greenhouseNo) {
      errors.greenhouseNo = "Greenhouse No is required";
    } else if (!formData.greenhouseNo.toUpperCase().startsWith("GH")) {
      errors.greenhouseNo = "Greenhouse No must start with 'GH'";
    }
    
    // Date validation
    if (!formData.date) {
      errors.date = "Date is required";
    }
    
    // Issue Type validation
    if (!formData.issueType) {
      errors.issueType = "Issue type is required";
    }
    
    // Description validation
    if (!formData.description) {
      errors.description = "Description is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
      <div style={{backgroundColor: 'var(--card-bg)', color: 'var(--text)'}} className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`flex items-center justify-between p-6 border-b`} style={{borderColor: 'var(--border)'}}>
          <h3 className={`text-xl font-semibold`}>
            {isEditing ? "Edit Pest & Disease Issue" : "Add Pest & Disease Issue"}
          </h3>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 transition-colors`}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2`}>
                Greenhouse No *
              </label>
              <input 
                type="text" 
                name="greenhouseNo"
                value={formData.greenhouseNo}
                onChange={handleInputChange}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                  borderColor: formErrors.greenhouseNo ? '#e53e3e' : 'var(--border)'
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
              {formErrors.greenhouseNo && (
                <p className="text-red-500 text-sm mt-1">{formErrors.greenhouseNo}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2`}>
                Date *
              </label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                  borderColor: formErrors.date ? '#e53e3e' : 'var(--border)'
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
              {formErrors.date && (
                <p className="text-red-500 text-sm mt-1">{formErrors.date}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Issue Type *
              </label>
              <select 
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: formErrors.issueType ? '#e53e3e' : borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Type</option>
                <option value="Fungus">Fungus</option>
                <option value="Insect">Insect</option>
                <option value="Virus">Virus</option>
                <option value="Other">Other</option>
              </select>
              {formErrors.issueType && (
                <p className="text-red-500 text-sm mt-1">{formErrors.issueType}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Severity
              </label>
              <select 
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className={`block text-sm font-medium mb-2 ${textColor}`}>
              Description *
            </label>
            <textarea 
              rows="4" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              style={{
                backgroundColor: inputBg,
                color: inputText,
                borderColor: formErrors.description ? '#e53e3e' : borderColor
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${textColor}`}>
              Upload Image (Optional)
            </label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{
                backgroundColor: inputBg,
                color: inputText,
                borderColor: borderColor
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className={`flex justify-end gap-3 pt-4 border-t ${borderColor}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${theme === 'dark' ? 'bg-[#1E1E1E] text-white hover:bg-[#2a2a2a]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
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
const SpecialistModal = ({ isEditing, editData, pestId, issueRecords, onClose, onSubmit, theme, inputBg, inputText, borderColor }) => {
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
  const [formErrors, setFormErrors] = useState({});

  // Theme.css සමග match කරන ලද Theme-based colors
  const bgBase = theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-100';
  const bgCard = theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-[#E0E0E0]' : 'text-gray-800';

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

  const validateForm = () => {
    const errors = {};
    
    // Specialist Name validation
    if (!formData.specialistName) {
      errors.specialistName = "Specialist name is required";
    }
    
    // Date Assigned validation
    if (!formData.dateAssigned) {
      errors.dateAssigned = "Date assigned is required";
    }
    
    // Greenhouse No validation
    if (!formData.greenhouseNo) {
      errors.greenhouseNo = "Greenhouse No is required";
    } else if (!formData.greenhouseNo.toUpperCase().startsWith("GH")) {
      errors.greenhouseNo = "Greenhouse No must start with 'GH'";
    }
    
    // Treated Issue validation
    if (!formData.treatedIssue) {
      errors.treatedIssue = "Treated issue is required";
    }
    
    // Treatment Start Date validation
    if (formData.treatmentStartDate && formData.dateAssigned) {
      const treatmentStartDate = new Date(formData.treatmentStartDate);
      const dateAssigned = new Date(formData.dateAssigned);
      
      if (treatmentStartDate < dateAssigned) {
        errors.treatmentStartDate = "Treatment start date must be on or after date assigned";
      }
    }
    
    // Follow-up Date validation
    if (formData.followUpRequired && formData.followUpDate && formData.dateAssigned) {
      const followUpDate = new Date(formData.followUpDate);
      const dateAssigned = new Date(formData.dateAssigned);
      
      if (followUpDate < dateAssigned) {
        errors.followUpDate = "Follow-up date must be on or after date assigned";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData({...formData, [name]: fieldValue});
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (isEditing) {
      onSubmit(editData._id, formData);
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${bgCard} ${textColor}`}>
        <div className={`flex items-center justify-between p-6 border-b ${borderColor}`}>
          <h3 className={`text-xl font-semibold`}>
            {isEditing ? "Edit Specialist Assignment" : "Assign Specialist"}
          </h3>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Specialist Name *
              </label>
              <input 
                type="text" 
                name="specialistName"
                value={formData.specialistName}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: formErrors.specialistName ? '#e53e3e' : borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
              {formErrors.specialistName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.specialistName}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Date Assigned *
              </label>
              <input 
                type="date" 
                name="dateAssigned"
                value={formData.dateAssigned}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: formErrors.dateAssigned ? '#e53e3e' : borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required 
              />
              {formErrors.dateAssigned && (
                <p className="text-red-500 text-sm mt-1">{formErrors.dateAssigned}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Greenhouse No *
              </label>
              <input 
                type="text" 
                name="greenhouseNo"
                value={formData.greenhouseNo}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: formErrors.greenhouseNo ? '#e53e3e' : borderColor
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!!pestId ? 'bg-gray-100 dark:bg-[#2a2a2a]' : ''}`}
                required 
                readOnly={!!pestId}
              />
              {formErrors.greenhouseNo && (
                <p className="text-red-500 text-sm mt-1">{formErrors.greenhouseNo}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Status
              </label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${textColor}`}>
              Issue to Treat *
              </label>
            <textarea 
              name="treatedIssue"
              value={formData.treatedIssue}
              onChange={handleInputChange}
              rows="3"
              style={{
                backgroundColor: inputBg,
                color: inputText,
                borderColor: formErrors.treatedIssue ? '#e53e3e' : borderColor
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              required 
            />
            {formErrors.treatedIssue && (
              <p className="text-red-500 text-sm mt-1">{formErrors.treatedIssue}</p>
            )}
          </div>
          
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-2 ${textColor}`}>
              Specialist Notes
            </label>
            <textarea 
              name="specialistNotes"
              value={formData.specialistNotes}
              onChange={handleInputChange}
              rows="4"
              placeholder="Enter specialist's observations, treatment plan, or recommendations..."
              style={{
                backgroundColor: inputBg,
                color: inputText,
                borderColor: borderColor
              }}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Treatment Start Date
              </label>
              <input 
                type="date" 
                name="treatmentStartDate"
                value={formData.treatmentStartDate}
                onChange={handleInputChange}
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: formErrors.treatmentStartDate ? '#e53e3e' : borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formErrors.treatmentStartDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.treatmentStartDate}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                Treatment Cost ($)
              </label>
              <input 
                type="number" 
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                style={{
                  backgroundColor: inputBg,
                  color: inputText,
                  borderColor: borderColor
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <input 
                type="checkbox" 
                id="followUpRequired"
                name="followUpRequired"
                checked={formData.followUpRequired}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="followUpRequired" className={`ml-2 block text-sm ${textColor}`}>
                Follow-up Required
              </label>
            </div>
            {formData.followUpRequired && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                  Follow-up Date
                </label>
                <input 
                  type="date" 
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                  style={{
                    backgroundColor: inputBg,
                    color: inputText,
                    borderColor: formErrors.followUpDate ? '#e53e3e' : borderColor
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formErrors.followUpDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.followUpDate}</p>
                )}
              </div>
            )}
          </div>
          
          <div className={`flex justify-end gap-3 pt-4 border-t ${borderColor}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${theme === 'dark' ? 'bg-[#1E1E1E] text-white hover:bg-[#2a2a2a]' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
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
const ImageModal = ({ imageSrc, onClose, theme, bgCard, borderColor, textColor }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className={`relative max-w-4xl max-h-[90vh] rounded-lg shadow-xl ${bgCard} border ${borderColor}`}>
        <div className={`flex items-center justify-between p-4 border-b ${borderColor}`}>
          <h3 className={`text-lg font-semibold ${textColor}`}>Issue Image</h3>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
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