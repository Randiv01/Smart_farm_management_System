import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './AddAnimalForm.css';

export default function AddAnimalForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    healthStatus: 'Healthy'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.breed || !formData.age) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/animals/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to add animal');
      }

      // Redirect to animal list with success state
      navigate(`/animal-list/${type}`, { 
        state: { 
          success: true,
          message: `${type} added successfully!` 
        } 
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Breed *</label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Age *</label>
          <input
            type="number"
            name="age"
            min="0"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Health Status</label>
          <select
            name="healthStatus"
            value={formData.healthStatus}
            onChange={handleChange}
          >
            <option value="Healthy">Healthy</option>
            <option value="Sick">Sick</option>
            <option value="Recovering">Recovering</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Animal'}
        </button>
      </form>
    </div>
  );
}