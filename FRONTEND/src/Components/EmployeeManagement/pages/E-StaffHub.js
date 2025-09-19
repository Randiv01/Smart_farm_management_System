import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, QrCode, FileText, X, Users, Stethoscope, Leaf } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

export const StaffHub = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState("employees");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pathologists, setPathologists] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contact: "",
    title: "",
    type: "Full-time",
    joined: "",
    photoFile: null,
    cvFile: null,
    // Doctor/Pathologist specific fields
    email: "",
    licenseNumber: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "Male",
    address: "",
    password: ""
  });

  // Load data from backend
  useEffect(() => {
    fetchEmployees();
    fetchDoctors();
    fetchPathologists();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/employees");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json"))
        throw new Error("Server returned non-JSON response");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchPathologists = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/plant-pathologists");
      setPathologists(res.data);
    } catch (err) {
      console.error("Error fetching pathologists:", err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      contact: "",
      title: "",
      type: "Full-time",
      joined: "",
      photoFile: null,
      cvFile: null,
      email: "",
      licenseNumber: "",
      specializations: "",
      qualifications: "",
      yearsOfExperience: "",
      dateOfBirth: "",
      gender: "Male",
      address: "",
      password: ""
    });
    setEditingItem(null);
  };

  // Employee functions
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      for (let key in formData) {
        if (key !== "photoFile" && key !== "cvFile") form.append(key, formData[key]);
      }
      if (formData.photoFile) form.append("photo", formData.photoFile);
      if (formData.cvFile) form.append("cv", formData.cvFile);

      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (response.ok) {
        setEmployees([...employees, data]);
        setShowForm(false);
        resetForm();
        alert("Employee added successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to add employee"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add employee.");
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      for (let key in formData) {
        if (key !== "photoFile" && key !== "cvFile") form.append(key, formData[key]);
      }
      if (formData.photoFile) form.append("photo", formData.photoFile);
      if (formData.cvFile) form.append("cv", formData.cvFile);

      const response = await fetch(
        `http://localhost:5000/api/employees/${editingItem.id}`,
        { method: "PUT", body: form }
      );

      const data = await response.json();
      if (response.ok) {
        setEmployees(employees.map((emp) => (emp.id === data.id ? data : emp)));
        setShowForm(false);
        resetForm();
        alert("Employee updated successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to update employee"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update employee.");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${id}`, { method: "DELETE" });
      if (response.ok) {
        setEmployees(employees.filter((emp) => emp.id !== id));
        alert("Employee deleted successfully!");
      } else {
        alert("Failed to delete employee.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee.");
    }
  };

  // Doctor functions
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(key, JSON.stringify(formData.specializations.split(",").map(s => s.trim())));
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) {
        data.append("profilePhoto", formData.photoFile);
      }

      await axios.post("http://localhost:5000/api/doctors", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Doctor added successfully!");
      fetchDoctors();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert("Failed to add doctor");
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(key, JSON.stringify(formData.specializations.split(",").map(s => s.trim())));
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) {
        data.append("profilePhoto", formData.photoFile);
      }

      await axios.put(`http://localhost:5000/api/doctors/${editingItem._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Doctor updated successfully!");
      fetchDoctors();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert("Failed to update doctor");
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      await axios.delete(`http://localhost:5000/api/doctors/${id}`);
      fetchDoctors();
    }
  };

  // Pathologist functions
  const handleAddPathologist = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(key, JSON.stringify(formData.specializations.split(",").map(s => s.trim())));
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) {
        data.append("profilePhoto", formData.photoFile);
      }

      await axios.post("http://localhost:5000/api/plant-pathologists", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Plant Pathologist added successfully!");
      fetchPathologists();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding plant pathologist:", err);
      alert("Failed to add plant pathologist");
    }
  };

  const handleUpdatePathologist = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(key, JSON.stringify(formData.specializations.split(",").map(s => s.trim())));
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) {
        data.append("profilePhoto", formData.photoFile);
      }

      await axios.put(`http://localhost:5000/api/plant-pathologists/${editingItem._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      alert("Plant Pathologist updated successfully!");
      fetchPathologists();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error updating plant pathologist:", err);
      alert("Failed to update plant pathologist");
    }
  };

  const handleDeletePathologist = async (id) => {
    if (window.confirm("Are you sure you want to delete this plant pathologist?")) {
      await axios.delete(`http://localhost:5000/api/plant-pathologists/${id}`);
      fetchPathologists();
    }
  };

  const handleEdit = (item, type) => {
    if (type === "employee") {
      setFormData({
        id: item.id,
        name: item.name,
        contact: item.contact,
        title: item.title,
        type: item.type,
        joined: item.joined,
        photoFile: null,
        cvFile: null,
        email: "",
        licenseNumber: "",
        specializations: "",
        qualifications: "",
        yearsOfExperience: "",
        dateOfBirth: "",
        gender: "Male",
        address: "",
        password: ""
      });
    } else if (type === "doctor") {
      setFormData({
        id: "",
        name: item.fullName,
        contact: item.phoneNo,
        title: "",
        type: "",
        joined: "",
        photoFile: null,
        cvFile: null,
        email: item.email,
        licenseNumber: item.licenseNumber,
        specializations: Array.isArray(item.specializations) ? item.specializations.join(", ") : item.specializations,
        qualifications: item.qualifications,
        yearsOfExperience: item.yearsOfExperience,
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
        gender: item.gender,
        address: item.address || "",
        password: ""
      });
    } else if (type === "pathologist") {
      setFormData({
        id: "",
        name: item.fullName,
        contact: item.phoneNo,
        title: "",
        type: "",
        joined: "",
        photoFile: null,
        cvFile: null,
        email: item.email,
        licenseNumber: item.licenseNumber,
        specializations: Array.isArray(item.specializations) ? item.specializations.join(", ") : item.specializations,
        qualifications: item.qualifications,
        yearsOfExperience: item.yearsOfExperience,
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
        gender: item.gender,
        address: "",
        password: ""
      });
    }
    
    setEditingItem({...item, type});
    setShowForm(true);
  };

  const handleDownloadPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    
    let data = [];
    let headers = [];
    let body = [];
    
    if (type === "doctors") {
      doc.text("Doctor Details", 14, 20);
      headers = [
        "Full Name",
        "Email",
        "Phone",
        "License",
        "Specializations",
        "Qualifications",
        "Experience",
        "DOB",
        "Gender",
      ];
      body = doctors.map((d) => [
        d.fullName,
        d.email,
        d.phoneNo,
        d.licenseNumber,
        Array.isArray(d.specializations) ? d.specializations.join(", ") : d.specializations,
        d.qualifications,
        d.yearsOfExperience,
        d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
        d.gender,
      ]);
    } else if (type === "pathologists") {
      doc.text("Plant Pathologist Details", 14, 20);
      headers = [
        "Full Name",
        "Email",
        "Phone",
        "License",
        "Specializations",
        "Qualifications",
        "Experience",
        "DOB",
        "Gender",
      ];
      body = pathologists.map((p) => [
        p.fullName,
        p.email,
        p.phoneNo,
        p.licenseNumber,
        Array.isArray(p.specializations) ? p.specializations.join(", ") : p.specializations,
        p.qualifications,
        p.yearsOfExperience,
        p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
        p.gender,
      ]);
    } else {
      doc.text("Employee Details", 14, 20);
      headers = ["Emp ID", "Name", "Contact No", "Job Title", "Type", "Joined"];
      body = employees.map((e) => [
        e.id,
        e.name,
        e.contact,
        e.title,
        e.type,
        e.joined,
      ]);
    }
    
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 30,
    });
    
    doc.save(`${type.charAt(0).toUpperCase() + type.slice(1)}.pdf`);
  };

  // Fixed filtering functions to handle undefined values
  const filteredEmployees = employees.filter(
    (employee) =>
      (employee.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.licenseNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(doctor.specializations) ? 
        doctor.specializations.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) : 
        (doctor.specializations || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPathologists = pathologists.filter(
    (pathologist) =>
      (pathologist.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pathologist.licenseNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(pathologist.specializations) ? 
        pathologist.specializations.join(" ").toLowerCase().includes(searchQuery.toLowerCase()) : 
        (pathologist.specializations || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderEmployeeTable = () => (
    <div className={`rounded-lg overflow-hidden shadow ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <table className="w-full text-sm">
        <thead className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"}`}>
          <tr>
            <th className="px-6 py-3 text-left">Emp ID</th>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Contact No</th>
            <th className="px-6 py-3 text-left">Job Title</th>
            <th className="px-6 py-3 text-left">Type</th>
            <th className="px-6 py-3 text-left">Joined</th>
            <th className="px-6 py-3 text-left">Photo</th>
            <th className="px-6 py-3 text-left">CV</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.length === 0 ? (
            <tr>
              <td colSpan="9" className={`px-6 py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {searchQuery ? "No employees found matching your search." : "No employees found. Add your first employee!"}
              </td>
            </tr>
          ) : (
            filteredEmployees.map((employee) => (
              <tr key={employee.id} className={`transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100"}`}>
                <td className="px-6 py-3">{employee.id}</td>
                <td className="px-6 py-3">{employee.name}</td>
                <td className="px-6 py-3">{employee.contact}</td>
                <td className="px-6 py-3">{employee.title}</td>
                <td className="px-6 py-3">{employee.type}</td>
                <td className="px-6 py-3">{employee.joined}</td>
                <td className="px-6 py-3">
                  {employee.photo ? <img src={`http://localhost:5000${employee.photo}`} alt="Employee" className="h-12 w-12 rounded-full" /> : "—"}
                </td>
                <td className="px-6 py-3">
                  {employee.cv ? <a href={`http://localhost:5000${employee.cv}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View CV</a> : "—"}
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setQrItem({...employee, type: "employee"})} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Generate QR Code">
                      <QrCode size={16} className="text-purple-500" />
                    </button>
                    <a
                      href={`http://localhost:5000/api/employees/${employee.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
                      title="Generate PDF Report"
                    >
                      <FileText size={16} className="text-green-500" />
                    </a>
                    <button onClick={() => handleEdit(employee, "employee")} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Edit Employee">
                      <Edit size={16} className="text-blue-500" />
                    </button>
                    <button onClick={() => handleDeleteEmployee(employee.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Delete Employee">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderDoctorTable = () => (
    <div className={`rounded-lg overflow-hidden shadow ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <table className="w-full text-sm">
        <thead className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"}`}>
          <tr>
            <th className="px-6 py-3 text-left">Photo</th>
            <th className="px-6 py-3 text-left">Full Name</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">License</th>
            <th className="px-6 py-3 text-left">Specializations</th>
            <th className="px-6 py-3 text-left">Qualifications</th>
            <th className="px-6 py-3 text-left">Experience</th>
            <th className="px-6 py-3 text-left">DOB</th>
            <th className="px-6 py-3 text-left">Gender</th>
            <th className="px-6 py-3 text-left">Actions</th>
            <th className="px-6 py-3 text-left">Direct Contact</th>
          </tr>
        </thead>
        <tbody>
          {filteredDoctors.length === 0 ? (
            <tr>
              <td colSpan="12" className={`px-6 py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {searchQuery ? "No doctors found matching your search." : "No doctors found. Add your first doctor!"}
              </td>
            </tr>
          ) : (
            filteredDoctors.map((doctor) => (
              <tr key={doctor._id} className={`transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100"}`}>
                <td className="px-6 py-3">
                  {doctor.profilePhoto && (
                    <img
                      src={`http://localhost:5000/Health_Uploads/${doctor.profilePhoto}`}
                      alt={doctor.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                </td>
                <td className="px-6 py-3">{doctor.fullName}</td>
                <td className="px-6 py-3">{doctor.email}</td>
                <td className="px-6 py-3">{doctor.phoneNo}</td>
                <td className="px-6 py-3">{doctor.licenseNumber}</td>
                <td className="px-6 py-3">{Array.isArray(doctor.specializations) ? doctor.specializations.join(", ") : doctor.specializations}</td>
                <td className="px-6 py-3">{doctor.qualifications}</td>
                <td className="px-6 py-3">{doctor.yearsOfExperience}</td>
                <td className="px-6 py-3">{doctor.dateOfBirth ? doctor.dateOfBirth.split("T")[0] : ""}</td>
                <td className="px-6 py-3">{doctor.gender}</td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setQrItem({...doctor, type: "doctor"})} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Generate QR Code">
                      <QrCode size={16} className="text-purple-500" />
                    </button>
                    <button onClick={() => handleEdit(doctor, "doctor")} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Edit Doctor">
                      <Edit size={16} className="text-blue-500" />
                    </button>
                    <button onClick={() => handleDeleteDoctor(doctor._id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Delete Doctor">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${doctor.phoneNo}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="WhatsApp">
                      <span className="text-green-500 text-sm">WhatsApp</span>
                    </a>
                    <a href={`mailto:${doctor.email}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Email">
                      <span className="text-blue-500 text-sm">Email</span>
                    </a>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPathologistTable = () => (
    <div className={`rounded-lg overflow-hidden shadow ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
      <table className="w-full text-sm">
        <thead className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"}`}>
          <tr>
            <th className="px-6 py-3 text-left">Photo</th>
            <th className="px-6 py-3 text-left">Full Name</th>
            <th className="px-6 py-3 text-left">Email</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">License</th>
            <th className="px-6 py-3 text-left">Specializations</th>
            <th className="px-6 py-3 text-left">Qualifications</th>
            <th className="px-6 py-3 text-left">Experience</th>
            <th className="px-6 py-3 text-left">DOB</th>
            <th className="px-6 py-3 text-left">Gender</th>
            <th className="px-6 py-3 text-left">Actions</th>
            <th className="px-6 py-3 text-left">Direct Contact</th>
          </tr>
        </thead>
        <tbody>
          {filteredPathologists.length === 0 ? (
            <tr>
              <td colSpan="12" className={`px-6 py-8 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {searchQuery ? "No plant pathologists found matching your search." : "No plant pathologists found. Add your first plant pathologist!"}
              </td>
            </tr>
          ) : (
            filteredPathologists.map((pathologist) => (
              <tr key={pathologist._id} className={`transition ${darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100"}`}>
                <td className="px-6 py-3">
                  {pathologist.profilePhoto && (
                    <img
                      src={`http://localhost:5000/Health_Uploads/${pathologist.profilePhoto}`}
                      alt={pathologist.fullName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  )}
                </td>
                <td className="px-6 py-3">{pathologist.fullName}</td>
                <td className="px-6 py-3">{pathologist.email}</td>
                <td className="px-6 py-3">{pathologist.phoneNo}</td>
                <td className="px-6 py-3">{pathologist.licenseNumber}</td>
                <td className="px-6 py-3">{Array.isArray(pathologist.specializations) ? pathologist.specializations.join(", ") : pathologist.specializations}</td>
                <td className="px-6 py-3">{pathologist.qualifications}</td>
                <td className="px-6 py-3">{pathologist.yearsOfExperience}</td>
                <td className="px-6 py-3">{pathologist.dateOfBirth ? pathologist.dateOfBirth.split("T")[0] : ""}</td>
                <td className="px-6 py-3">{pathologist.gender}</td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setQrItem({...pathologist, type: "pathologist"})} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Generate QR Code">
                      <QrCode size={16} className="text-purple-500" />
                    </button>
                    <button onClick={() => handleEdit(pathologist, "pathologist")} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Edit Plant Pathologist">
                      <Edit size={16} className="text-blue-500" />
                    </button>
                    <button onClick={() => handleDeletePathologist(pathologist._id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Delete Plant Pathologist">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${pathologist.phoneNo}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="WhatsApp">
                      <span className="text-green-500 text-sm">WhatsApp</span>
                    </a>
                    <a href={`mailto:${pathologist.email}`} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Email">
                      <span className="text-blue-500 text-sm">Email</span>
                    </a>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "employees"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Users size={18} />
          <span>Employees</span>
        </button>
        <button
          onClick={() => setActiveTab("doctors")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "doctors"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Stethoscope size={18} />
          <span>Doctors</span>
        </button>
        <button
          onClick={() => setActiveTab("pathologists")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
            activeTab === "pathologists"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Leaf size={18} />
          <span>Plant Pathologists</span>
        </button>
      </div>

      {/* Search & Add */}
      <div className="flex justify-between items-center mb-6">
        <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`ml-2 bg-transparent outline-none text-sm ${
              darkMode ? "placeholder-gray-400 text-white" : "placeholder-gray-500 text-black"
            }`}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleDownloadPDF(activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              darkMode 
                ? "bg-gray-600 hover:bg-gray-700 text-white" 
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            <FileText size={18} />
            <span>Download PDF</span>
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium transition ${
              darkMode ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            <Plus size={18} />
            <span>Add {activeTab === "employees" ? "Employee" : activeTab === "doctors" ? "Doctor" : "Pathologist"}</span>
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "employees" && renderEmployeeTable()}
      {activeTab === "doctors" && renderDoctorTable()}
      {activeTab === "pathologists" && renderPathologistTable()}

      {/* QR Modal */}
      {qrItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-sm ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button onClick={() => setQrItem(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <QRCodeCanvas value={qrItem.id || qrItem._id} size={180} />
              <p className="text-sm text-center">
                <strong>{qrItem.name || qrItem.fullName}</strong><br />
                <span className="text-gray-500">ID: {qrItem.id || qrItem._id}</span><br />
                <span className="text-gray-500">Type: {qrItem.type}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className={`rounded-lg p-6 w-full max-w-2xl my-8 ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingItem ? `Edit ${editingItem.type === "employee" ? "Employee" : editingItem.type === "doctor" ? "Doctor" : "Plant Pathologist"}` : 
                `Add New ${activeTab === "employees" ? "Employee" : activeTab === "doctors" ? "Doctor" : "Plant Pathologist"}`}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }}>
                <X size={20} />
              </button>
            </div>

            <form 
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-2" 
              onSubmit={
                editingItem ? 
                  (editingItem.type === "employee" ? handleUpdateEmployee : 
                   editingItem.type === "doctor" ? handleUpdateDoctor : handleUpdatePathologist)
                  : (activeTab === "employees" ? handleAddEmployee : 
                     activeTab === "doctors" ? handleAddDoctor : handleAddPathologist)
              }
            >
              {/* Common fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g., John Doe" 
                    className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                  />
                </div>

                {(activeTab === "employees" || editingItem?.type === "employee") ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      required
                      disabled={editingItem}
                      placeholder="e.g., EMP001"
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"} ${editingItem ? "opacity-70 cursor-not-allowed" : ""}`}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      required
                      placeholder="e.g., MED12345"
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number *</label>
                  <input 
                    type="text" 
                    name="contact" 
                    value={formData.contact} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g., +1-234-567-8900" 
                    className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                  />
                </div>

                {(activeTab === "doctors" || activeTab === "pathologists" || editingItem?.type === "doctor" || editingItem?.type === "pathologist") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g., john@example.com" 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                    />
                  </div>
                )}
              </div>

              {(activeTab === "employees" || editingItem?.type === "employee") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title *</label>
                    <input 
                      type="text" 
                      name="title" 
                      value={formData.title} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g., Farm Manager" 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Type</label>
                    <select 
                      name="type" 
                      value={formData.type} 
                      onChange={handleChange} 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
              )}

              {(activeTab === "doctors" || activeTab === "pathologists" || editingItem?.type === "doctor" || editingItem?.type === "pathologist") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Specializations *</label>
                    <input 
                      type="text" 
                      name="specializations" 
                      value={formData.specializations} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g., Cardiology, Neurology (comma separated)" 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Qualifications *</label>
                    <input 
                      type="text" 
                      name="qualifications" 
                      value={formData.qualifications} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g., MBBS, MD" 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(activeTab === "doctors" || activeTab === "pathologists" || editingItem?.type === "doctor" || editingItem?.type === "pathologist") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Years of Experience *</label>
                    <input 
                      type="number" 
                      name="yearsOfExperience" 
                      value={formData.yearsOfExperience} 
                      onChange={handleChange} 
                      required 
                      min="0" 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {(activeTab === "employees" || editingItem?.type === "employee") ? "Joined Date" : "Date of Birth"} *
                  </label>
                  <input 
                    type="date" 
                    name={(activeTab === "employees" || editingItem?.type === "employee") ? "joined" : "dateOfBirth"} 
                    value={(activeTab === "employees" || editingItem?.type === "employee") ? formData.joined : formData.dateOfBirth} 
                    onChange={handleChange} 
                    required 
                    className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`} 
                  />
                </div>
              </div>

              {(activeTab === "doctors" || activeTab === "pathologists" || editingItem?.type === "doctor" || editingItem?.type === "pathologist") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select 
                      name="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {activeTab === "doctors" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <input 
                        type="text" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        placeholder="e.g., 123 Main St, City" 
                        className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                      />
                    </div>
                  )}
                </div>
              )}

              {!editingItem && (activeTab === "doctors" || activeTab === "pathologists") && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} 
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Photo</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setFormData({ ...formData, photoFile: e.target.files[0] })} 
                    className="w-full text-sm" 
                  />
                </div>

                {(activeTab === "employees" || editingItem?.type === "employee") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">CV (PDF)</label>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      onChange={(e) => setFormData({ ...formData, cvFile: e.target.files[0] })} 
                      className="w-full text-sm" 
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); resetForm(); }} 
                  className="px-4 py-2 rounded-md bg-gray-300 text-black hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                >
                  {editingItem ? "Update" : "Add"} {activeTab === "employees" ? "Employee" : activeTab === "doctors" ? "Doctor" : "Pathologist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};