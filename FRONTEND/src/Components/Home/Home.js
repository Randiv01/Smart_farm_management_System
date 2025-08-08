import React, { useState, useEffect } from 'react';
import Nav from '../Nav/Nav';
import './Home.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const URL = 'http://localhost:5000/users';
const ESP32_IP = 'http://192.168.1.10'; // Replace with your actual ESP32 IP

const feedAnimal = async () => {
  try {
    const response = await axios.get(`${ESP32_IP}/feed`);
    alert("Feeding triggered: " + response.data);
  } catch (err) {
    console.error("ESP32 feed error:", err);
    alert("Failed to feed animal. ESP32 not reachable.");
  }
};

const fetchHandler = async () => {
  try {
    const res = await axios.get(URL);
    return res.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return { users: [] };
  }
};

function Home() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchHandler().then((data) => {
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers(data.users || []);
      }
    });
  }, []);

  const deleteUser = async (id) => {
    try {
      await axios.delete(`${URL}/${id}`);
      setUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="home-container">
      <Nav />

      <header className="home-header">
        <h1>Welcome to Sunshine Farm</h1>
        <p>Fresh organic produce & sustainable farming since 1995.</p>
      </header>

      <section className="section user-section">
        <h2>Users List</h2>

        <button className="btn-new-user" onClick={() => navigate('/add-user')}>
          + New User
        </button>

        <button className="btn-feed" onClick={feedAnimal}>
          🐾 Feed Animal
        </button>

        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.mobile || '-'}</td>
                  <td>{user.address || '-'}</td>
                  <td>{user.gender || '-'}</td>
                  <td>{user.dob ? new Date(user.dob).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => navigate(`/update-user/${user._id}`)}>Edit</button>
                    <button className="btn-delete" onClick={() => deleteUser(user._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Home;
