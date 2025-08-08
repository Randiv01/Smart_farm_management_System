import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddUser.css'; // Your custom CSS file

const URL = 'http://localhost:5000/users'; // Your backend endpoint

function AddUser() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    address: '',
    gender: '',
    dob: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    const { name, email, password, mobile, address, gender, dob } = formData;

    if (!name || !email || !password || !mobile || !address || !gender || !dob) {
      return 'All fields are required';
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return 'Mobile number must be a 10-digit number';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(URL, formData);
      console.log('User added:', response.data);
      setLoading(false);
      navigate('/'); // Redirect to Home page
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user');
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      <h2>Add New User</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password *</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label>Mobile *</label>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          required
          pattern="[0-9]{10}"
          title="Enter a valid 10-digit mobile number"
        />

        <label>Address *</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <label>Gender *</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        <label>Date of Birth *</label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
}

export default AddUser;
