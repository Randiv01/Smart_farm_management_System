import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './UpdateUser.css';

const URL = 'http://localhost:5000/users';

function UpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    gender: '',
    dob: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${URL}/${id}`);
        setUser({
          ...res.data,
          dob: res.data.dob ? res.data.dob.slice(0, 10) : '' // Format for input[type="date"]
        });
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${URL}/${id}`, user);
      navigate('/');
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="update-user-container">
      <h2>Update User</h2>
      <form onSubmit={handleSubmit} className="update-user-form">
        <label>Name:</label>
        <input type="text" name="name" value={user.name} onChange={handleChange} required />

        <label>Email:</label>
        <input type="email" name="email" value={user.email} onChange={handleChange} required />

        <label>Mobile:</label>
        <input type="text" name="mobile" value={user.mobile} onChange={handleChange} />

        <label>Address:</label>
        <input type="text" name="address" value={user.address} onChange={handleChange} />

        <label>Gender:</label>
        <select name="gender" value={user.gender} onChange={handleChange}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <label>Date of Birth:</label>
        <input type="date" name="dob" value={user.dob} onChange={handleChange} />

        <button type="submit">Update</button>
      </form>
    </div>
  );
}

export default UpdateUser;
