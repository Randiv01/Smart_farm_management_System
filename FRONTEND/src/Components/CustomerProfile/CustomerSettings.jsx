// CustomerProfile/CustomerSettings.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../UHContext/UHAuthContext";

const CustomerSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    await axios.put("http://localhost:5000/api/users/profile", profile, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Profile updated!");
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <div className="grid gap-4">
        <input value={profile.firstName || ""} onChange={e=>setProfile({...profile,firstName:e.target.value})} placeholder="First Name" className="border p-2 rounded" />
        <input value={profile.lastName || ""} onChange={e=>setProfile({...profile,lastName:e.target.value})} placeholder="Last Name" className="border p-2 rounded" />
        <input value={profile.email || ""} disabled className="border p-2 rounded bg-gray-100" />
        <input value={profile.phone || ""} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="Phone" className="border p-2 rounded" />
        <textarea value={profile.bio || ""} onChange={e=>setProfile({...profile,bio:e.target.value})} placeholder="Bio" className="border p-2 rounded" />
      </div>
      <button onClick={handleSave} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Save</button>
    </div>
  );
};

export default CustomerSettings;
