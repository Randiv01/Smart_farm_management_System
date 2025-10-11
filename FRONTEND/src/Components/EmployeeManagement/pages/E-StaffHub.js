// src/pages/StaffHub.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  QrCode,
  FileText,
  X,
  Users,
  Stethoscope,
  Leaf,
  Download,
  Upload,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Award,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import Loader from "../Loader/Loader.js";
import { useETheme } from '../Econtexts/EThemeContext.jsx';

/* ---------- helpers: validation ---------- */

// Sri Lankan mobile: allow 9–10 digits (7XXXXXXXX or 07XXXXXXXX)
// (Matches the requirement "more than 8 or less than 10 characters" ⇒ 9 or 10)
const isValidSLMobile = (val) => {
  if (!val) return false;
  const clean = String(val).replace(/\D/g, "");
  if (clean.length === 10) return /^07\d{8}$/.test(clean);
  if (clean.length === 9) return /^7\d{8}$/.test(clean);
  return false;
};

const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || "");
const isAlphaName = (v) =>
  /^[A-Za-zÀ-ÖØ-öø-ÿ.'\s-]{2,60}$/.test((v || "").trim());
const isEmpId = (v) => /^[A-Za-z0-9_-]{3,20}$/.test((v || "").trim());
const minLen = (v, n) => (v || "").trim().length >= n;
const maxLen = (v, n) => (v || "").trim().length <= n;

const notFutureDate = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return d <= now;
};
const ageFromISO = (iso) => {
  if (!iso) return 0;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
};

export const StaffHub = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';

  // Set browser tab title
  useEffect(() => {
    document.title = "Staff Hub - Employee Manager";
  }, []);

  const [activeTab, setActiveTab] = useState("employees");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pathologists, setPathologists] = useState([]);
  const [loading, setLoading] = useState({
    employees: false,
    doctors: false,
    pathologists: false,
    form: false,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showLoader, setShowLoader] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    fromEmail: "sarah.emp@mountolive.com" // Employee manager's email
  });

  const formDataTemplate = {
    // common
    id: "", // Will be auto-generated
    name: "",
    contact: "",
    title: "",
    type: "Full-time",
    joined: "",
    photoFile: null,
    cvFile: null,
    email: "",
    department: "",
    address: "",
    status: "Active",
    // med
    licenseNumber: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "Male",
    password: "",
  };

  const [formData, setFormData] = useState(formDataTemplate);

  /* ---------- data ---------- */
  useEffect(() => {
    fetchEmployees();
    fetchDoctors();
    fetchPathologists();
  }, []);

  // Fetch next employee ID
  const fetchNextEmployeeId = async () => {
    try {
      // First try to get from backend
      const response = await axios.get("/api/employees/get-next-id");
      return response.data.nextId;
    } catch (error) {
      console.error("Error fetching next employee ID from backend:", error);
      
      // Fallback: generate ID based on existing employees
      try {
        const response = await axios.get("/api/employees");
        const data = response.data;
        // Handle both old format (array) and new format ({ docs: [...] })
        const employees = Array.isArray(data) ? data : (data.docs || []);
        
        if (employees.length === 0) {
          return "EMP001";
        }
        
        // Find the highest employee ID
        const highestId = employees.reduce((max, emp) => {
          const match = emp.id.match(/EMP(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            return Math.max(max, num);
          }
          return max;
        }, 0);
        
        const nextNumber = highestId + 1;
        return `EMP${nextNumber.toString().padStart(3, '0')}`;
      } catch (fallbackError) {
        console.error("Error in fallback ID generation:", fallbackError);
        return "EMP001"; // Final fallback
      }
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const fetchEmployees = async () => {
    setLoading((p) => ({ ...p, employees: true }));
    try {
      const res = await fetch("http://localhost:5000/api/employees");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("Non-JSON response");
      const data = await res.json();
      // Handle both old format (array) and new format ({ docs: [...] })
      const employeesArray = Array.isArray(data) ? data : (data.docs || []);
      setEmployees(employeesArray);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading((p) => ({ ...p, employees: false }));
    }
  };

  const fetchDoctors = async () => {
    setLoading((p) => ({ ...p, doctors: true }));
    try {
      const res = await axios.get("http://localhost:5000/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading((p) => ({ ...p, doctors: false }));
    }
  };

  const fetchPathologists = async () => {
    setLoading((p) => ({ ...p, pathologists: true }));
    try {
      const res = await axios.get(
        "http://localhost:5000/api/plant-pathologists"
      );
      setPathologists(res.data);
    } catch (err) {
      console.error("Error fetching pathologists:", err);
    } finally {
      setLoading((p) => ({ ...p, pathologists: false }));
    }
  };

  /* ---------- form helpers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const resetForm = async () => {
    try {
      const nextId = await fetchNextEmployeeId();
      console.log("Fetched next ID:", nextId);
      setFormData({
        ...formDataTemplate,
        id: nextId
      });
      setEditingItem(null);
      setErrors({});
    } catch (error) {
      console.error("Error in resetForm:", error);
      // Fallback to EMP001 if fetch fails
      setFormData({
        ...formDataTemplate,
        id: "EMP001"
      });
      setEditingItem(null);
      setErrors({});
    }
  };

  /* ---------- validation ---------- */
  const validateForm = () => {
    const e = {};
    const fd = formData;
    const isEmp = activeTab === "employees" || editingItem?.type === "employee";
    const isDoc =
      activeTab === "doctors" || editingItem?.type === "doctor";
    const isPath =
      activeTab === "pathologists" || editingItem?.type === "pathologist";

    // Common fields
    if (!isAlphaName(fd.name)) {
      e.name =
        "Enter a valid full name (letters/spaces only, 2–60 characters).";
    }
    if (!isValidSLMobile(fd.contact)) {
      e.contact =
        "Enter a valid Sri Lankan mobile (7XXXXXXXX or 07XXXXXXXX).";
    }

    // Employees
    if (isEmp) {
      // ID is auto-generated, so no validation needed
      if (!minLen(fd.title, 2) || !maxLen(fd.title, 40)) {
        e.title = "Job title must be 2–40 characters.";
      }
      if (!fd.joined || !notFutureDate(fd.joined)) {
        e.joined = "Join date is required and cannot be in the future.";
      }
      if (!["Full-time", "Part-time", "Contract"].includes(fd.type)) {
        e.type = "Select a valid employee type.";
      }
    }

    // Doctors / Pathologists
    if (isDoc || isPath) {
      if (!isEmail(fd.email)) e.email = "Enter a valid email address.";
      if (!/^[A-Za-z0-9-]{3,30}$/.test((fd.licenseNumber || "").trim())) {
        e.licenseNumber = "License number should be 3–30 letters/numbers.";
      }
      if (!minLen(fd.specializations, 2)) {
        e.specializations = "Enter at least one specialization.";
      }
      if (!minLen(fd.qualifications, 2)) {
        e.qualifications = "Enter qualifications.";
      }
      const years = Number(fd.yearsOfExperience);
      if (!Number.isFinite(years) || years < 0 || years > 60) {
        e.yearsOfExperience = "Years of experience must be 0–60.";
      }
      if (!fd.dateOfBirth) e.dateOfBirth = "Date of birth is required.";
      else if (ageFromISO(fd.dateOfBirth) < 18) {
        e.dateOfBirth = "Must be at least 18 years old.";
      }
      if (!editingItem && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(fd.password)) {
        e.password =
          "Password must be at least 8 characters with letters and numbers.";
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------- employee CRUD ---------- */
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check if form has required data
    console.log("Current form data:", formData);
    if (!formData.name || !formData.contact || !formData.title || !formData.joined || !formData.email || !formData.department || !formData.address) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const form = new FormData();
      // Only send the required fields, explicitly excluding ID
      const fieldsToSend = ['name', 'contact', 'title', 'type', 'joined'];
      fieldsToSend.forEach(field => {
        if (formData[field]) {
          console.log(`Adding to form: ${field} = ${formData[field]}`);
          form.append(field, formData[field]);
        }
      });
      if (formData.photoFile) form.append("photo", formData.photoFile);
      if (formData.cvFile) form.append("cv", formData.cvFile);

      console.log("Form data being sent:", formData);
      console.log("Form entries:");
      for (let [key, value] of form.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch("http://localhost:5000/api/employees", {
        method: "POST",
        body: form,
      });
      const data = await response.json();

      if (response.ok) {
        setEmployees((list) => [...list, data]);
        setShowForm(false);
        resetForm();
        showSuccess("Employee added successfully!");
      } else {
        console.error("Backend error:", data);
        alert(`Error: ${data.error || "Failed to add employee"}`);
      }
    } catch (err) {
      console.error("Frontend error:", err);
      alert("Failed to add employee.");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "photoFile" && k !== "cvFile") form.append(k, v);
      });
      if (formData.photoFile) form.append("photo", formData.photoFile);
      if (formData.cvFile) form.append("cv", formData.cvFile);

      const response = await fetch(
        `http://localhost:5000/api/employees/${editingItem.id}`,
        { method: "PUT", body: form }
      );
      const data = await response.json();

      if (response.ok) {
        setEmployees((list) =>
          list.map((emp) => (emp.id === data.id ? data : emp))
        );
        setShowForm(false);
        resetForm();
        showSuccess("Employee updated successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to update employee"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update employee.");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    setLoading((p) => ({ ...p, employees: true }));
    setShowLoader(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/employees/${id}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setEmployees((list) => list.filter((emp) => emp.id !== id));
        setDeleteConfirm(null);
        showSuccess("Employee deleted successfully!");
      } else {
        alert("Failed to delete employee.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee.");
    } finally {
      setLoading((p) => ({ ...p, employees: false }));
      setShowLoader(false);
    }
  };

  /* ---------- doctor CRUD ---------- */
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(
            key,
            JSON.stringify(
              formData.specializations.split(",").map((s) => s.trim())
            )
          );
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) data.append("profilePhoto", formData.photoFile);

      await axios.post("http://localhost:5000/api/doctors", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showSuccess("Doctor added successfully!");
      fetchDoctors();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding doctor:", err);
      alert("Failed to add doctor");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(
            key,
            JSON.stringify(
              formData.specializations.split(",").map((s) => s.trim())
            )
          );
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) data.append("profilePhoto", formData.photoFile);

      await axios.put(
        `http://localhost:5000/api/doctors/${editingItem._id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showSuccess("Doctor updated successfully!");
      fetchDoctors();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error updating doctor:", err);
      alert("Failed to update doctor");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleDeleteDoctor = async (id) => {
    setLoading((p) => ({ ...p, doctors: true }));
    setShowLoader(true);
    try {
      await axios.delete(`http://localhost:5000/api/doctors/${id}`);
      fetchDoctors();
      setDeleteConfirm(null);
      showSuccess("Doctor deleted successfully!");
    } catch (err) {
      console.error("Error deleting doctor:", err);
      alert("Failed to delete doctor");
    } finally {
      setLoading((p) => ({ ...p, doctors: false }));
      setShowLoader(false);
    }
  };

  /* ---------- pathologist CRUD ---------- */
  const handleAddPathologist = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(
            key,
            JSON.stringify(
              formData.specializations.split(",").map((s) => s.trim())
            )
          );
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) data.append("profilePhoto", formData.photoFile);

      await axios.post("http://localhost:5000/api/plant-pathologists", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showSuccess("Plant Pathologist added successfully!");
      fetchPathologists();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error adding plant pathologist:", err);
      alert("Failed to add plant pathologist");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleUpdatePathologist = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "specializations") {
          data.append(
            key,
            JSON.stringify(
              formData.specializations.split(",").map((s) => s.trim())
            )
          );
        } else if (key !== "photoFile" && key !== "cvFile") {
          data.append(key, formData[key]);
        }
      });
      if (formData.photoFile) data.append("profilePhoto", formData.photoFile);

      await axios.put(
        `http://localhost:5000/api/plant-pathologists/${editingItem._id}`,
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      showSuccess("Plant Pathologist updated successfully!");
      fetchPathologists();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error updating plant pathologist:", err);
      alert("Failed to update plant pathologist");
    } finally {
      setLoading((p) => ({ ...p, form: false }));
      setShowLoader(false);
    }
  };

  const handleDeletePathologist = async (id) => {
    setLoading((p) => ({ ...p, pathologists: true }));
    setShowLoader(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/plant-pathologists/${id}`
      );
      fetchPathologists();
      setDeleteConfirm(null);
      showSuccess("Plant Pathologist deleted successfully!");
    } catch (err) {
      console.error("Error deleting plant pathologist:", err);
      alert("Failed to delete plant pathologist");
    } finally {
      setLoading((p) => ({ ...p, pathologists: false }));
      setShowLoader(false);
    }
  };

  /* ---------- edit prefill ---------- */
  const handleEdit = (item, type) => {
    if (type === "employee") {
      setFormData({
        ...formDataTemplate,
        id: item.id,
        name: item.name,
        contact: item.contact,
        title: item.title,
        type: item.type,
        joined: item.joined,
        email: item.email || "",
        department: item.department || "",
        address: item.address || "",
        status: item.status || "Active",
      });
    } else if (type === "doctor") {
      setFormData({
        ...formDataTemplate,
        name: item.fullName,
        contact: item.phoneNo,
        email: item.email,
        licenseNumber: item.licenseNumber,
        specializations: Array.isArray(item.specializations)
          ? item.specializations.join(", ")
          : item.specializations,
        qualifications: item.qualifications,
        yearsOfExperience: item.yearsOfExperience,
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
        gender: item.gender,
        address: item.address || "",
      });
    } else if (type === "pathologist") {
      setFormData({
        ...formDataTemplate,
        name: item.fullName,
        contact: item.phoneNo,
        email: item.email,
        licenseNumber: item.licenseNumber,
        specializations: Array.isArray(item.specializations)
          ? item.specializations.join(", ")
          : item.specializations,
        qualifications: item.qualifications,
        yearsOfExperience: item.yearsOfExperience,
        dateOfBirth: item.dateOfBirth ? item.dateOfBirth.split("T")[0] : "",
        gender: item.gender,
      });
    }
    setEditingItem({ ...item, type });
    setShowForm(true);
  };

  /* ---------- email ---------- */
  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendEmail = async () => {
    if (!emailData.subject.trim() || !emailData.message.trim()) {
      alert("Please fill in both subject and message");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, form: true }));
      
      // For now, we'll use mailto: to open the default email client
      // In a real implementation, you would send this to your backend
      
      // Format employee email as employeename@mountolive.com
      const employeeName = emailModal.employee.name.toLowerCase().replace(/\s+/g, '');
      const employeeEmail = `${employeeName}@mountolive.com`;
      
      const mailtoLink = `mailto:${employeeEmail}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.message)}`;
      window.open(mailtoLink);
      
      setSuccessMessage(`Email opened for ${emailModal.employee.name}`);
      setEmailModal(null);
      setEmailData({
        subject: "",
        message: "",
        fromEmail: "sarah.emp@mountolive.com"
      });
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending email. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, form: false }));
    }
  };

  /* ---------- export ---------- */
  const handleDownloadPDF = (type) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table visibility
    
    // Company information
    const companyName = "Mount Olive Farm House";
    const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
    const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
    const reportDate = new Date().toLocaleDateString();
    const reportTime = new Date().toLocaleTimeString();
    
    // Professional color scheme
    const primaryColor = [34, 197, 94]; // Green
    const secondaryColor = [16, 185, 129]; // Teal
    const accentColor = [59, 130, 246]; // Blue
    const textColor = [31, 41, 55]; // Dark gray
    const lightGray = [243, 244, 246];

    // Add real company logo
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        doc.addImage(logoImg, 'PNG', 20, 15, 25, 25);
        generatePDFContent();
      };
      logoImg.onerror = () => {
        // Fallback to placeholder if logo fails to load
        doc.setFillColor(...primaryColor);
        doc.rect(20, 15, 25, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MOF', 30, 30, { align: 'center' });
        generatePDFContent();
      };
      logoImg.src = '/logo512.png';
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to placeholder
      doc.setFillColor(...primaryColor);
      doc.rect(20, 15, 25, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MOF', 30, 30, { align: 'center' });
      generatePDFContent();
    }

    const generatePDFContent = () => {

    // Company header
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 50, 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(companyAddress, 50, 27);
    doc.text(companyContact, 50, 32);

    // Report title with professional styling
    doc.setFillColor(...lightGray);
    doc.rect(20, 40, 170, 12, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    
    let reportTitle = "";
    let headers = [];
    let body = [];

    if (type === "doctors") {
      reportTitle = "MEDICAL STAFF REPORT";
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
        Array.isArray(d.specializations)
          ? d.specializations.join(", ")
          : d.specializations,
        d.qualifications,
        d.yearsOfExperience,
        d.dateOfBirth ? d.dateOfBirth.split("T")[0] : "",
        d.gender,
      ]);
    } else if (type === "pathologists") {
      reportTitle = "PLANT PATHOLOGIST REPORT";
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
        Array.isArray(p.specializations)
          ? p.specializations.join(", ")
          : p.specializations,
        p.qualifications,
        p.yearsOfExperience,
        p.dateOfBirth ? p.dateOfBirth.split("T")[0] : "",
        p.gender,
      ]);
    } else {
      reportTitle = "EMPLOYEE STAFF REPORT";
      headers = ["Emp ID", "Name", "Contact No", "Email", "Job Title", "Department", "Type", "Status", "Joined", "Address"];
      body = employees.map((e) => [
        e.id,
        e.name,
        e.contact,
        e.email || "—",
        e.title,
        e.department || "—",
        e.type,
        e.status || "Active",
        e.joined,
        e.address || "—",
      ]);
    }

    doc.text(reportTitle, 148, 49, { align: 'center' }); // Centered for landscape

    // Report metadata
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Generated: ${reportDate} at ${reportTime}`, 20, 60);
    doc.text(`Total Records: ${body.length}`, 20, 65);
    doc.text(`Report ID: MOF-ES-${Date.now().toString().slice(-6)}`, 20, 70);

    // Create professional table
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 80,
      theme: 'striped',
      headStyles: {
        fillColor: [34, 197, 94], // Green color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 6,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor,
        cellPadding: 4,
        halign: 'left',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        halign: 'left',
        valign: 'middle',
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 15 }, // No
        1: { cellWidth: 25 }, // Emp ID
        2: { cellWidth: 30 }, // Name
        3: { cellWidth: 32 }, // Contact
        4: { cellWidth: 40 }, // Email
        5: { cellWidth: 35 }, // Job Title
        6: { cellWidth: 32 }, // Department
        7: { cellWidth: 22 }, // Type
        8: { cellWidth: 22 }, // Status
        9: { cellWidth: 25 }, // Joined
        10: { cellWidth: 45 } // Address
      }
    });

    // Professional footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(...lightGray);
      doc.rect(0, 200, 297, 15, 'F'); // Landscape dimensions
      
      // Footer content
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, 208);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 148, 208, { align: 'center' });
      doc.text(companyName, 277, 208, { align: 'right' });
      
      // Footer line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 198, 277, 198);
      
      // Disclaimer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("This report is generated by Mount Olive Farm House Management System", 148, 215, { align: 'center' });
    }

      // Save PDF with professional naming
      const fileName = `MOF_${type.charAt(0).toUpperCase() + type.slice(1)}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };
  };

  /* ---------- filtering ---------- */
  const filteredEmployees = employees.filter(
    (employee) =>
      (employee.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (employee.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (doctor.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (doctor.licenseNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (Array.isArray(doctor.specializations)
        ? doctor.specializations.join(" ").toLowerCase()
        : (doctor.specializations || "").toLowerCase()
      ).includes(searchQuery.toLowerCase())
  );

  const filteredPathologists = pathologists.filter(
    (pathologist) =>
      (pathologist.fullName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (pathologist.licenseNumber || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (Array.isArray(pathologist.specializations)
        ? pathologist.specializations.join(" ").toLowerCase()
        : (pathologist.specializations || "").toLowerCase()
      ).includes(searchQuery.toLowerCase())
  );
  

  /* ---------- tables ---------- */
  const renderEmployeeTable = () => (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <table className="w-full text-sm min-w-full">
          <thead
            className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}
          >
            <tr>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">No</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Emp ID</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Name</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Contact</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Email</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Job Title</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Department</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Type</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Status</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Joined</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Address</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Photo</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">CV</th>
              <th className="px-3 py-4 text-left font-semibold text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading.employees ? (
              <tr>
                <td colSpan="14" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan="14"
                  className={`px-6 py-8 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {searchQuery
                    ? "No employees found matching your search."
                    : "No employees found. Add your first employee!"}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`border-b transition duration-200 ${
                    darkMode 
                      ? "border-gray-700 hover:bg-gray-700 text-white" 
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                    {employee.id}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {employee.name}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {employee.contact}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {employee.email || "—"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {employee.title}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {employee.department || "—"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.type === "Full-time"
                          ? "bg-green-100 text-green-800"
                          : employee.type === "Part-time"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {employee.type}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : employee.status === "Inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {employee.status || "Active"}
                    </span>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {employee.joined}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    <div className="truncate" title={employee.address}>
                      {employee.address || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {employee.photo ? (
                      <img
                        src={`http://localhost:5000${employee.photo}`}
                        alt="Employee"
                        className="h-12 w-12 rounded-full object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        onClick={() => setSelectedPhoto(`http://localhost:5000${employee.photo}`)}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {employee.cv ? (
                      <a
                        href={`http://localhost:5000${employee.cv}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <FileText size={12} className="mr-1" />
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQrItem({ ...employee, type: "employee" })}
                        className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Generate QR Code"
                      >
                        <QrCode size={16} />
                      </button>
                      <a
                        href={`http://localhost:5000/api/employees/${employee.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        title="Generate PDF Report"
                      >
                        <FileText size={16} />
                      </a>
                      <button
                        onClick={() => setEmailModal({ employee: employee })}
                        className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(employee, "employee")}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Employee"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: employee.id,
                            type: "employee",
                            name: employee.name,
                          })
                        }
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} />
                      </button>
                      {/* Removed Activate/Deactivate toggle button as requested */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDoctorTable = () => (
    <div className="overflow-x-auto">
      <div
        className={`rounded-lg overflow-hidden shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <table className="w-full text-sm">
          <thead
            className={`${
              darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"
            }`}
          >
            <tr>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">Full Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">License</th>
              <th className="px-4 py-3 text-left">Specializations</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading.doctors ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading doctors...
                  </div>
                </td>
              </tr>
            ) : filteredDoctors.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className={`px-6 py-8 text-center ${
                    darkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {searchQuery
                    ? "No doctors found matching your search."
                    : "No doctors found. Add your first doctor!"}
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr
                  key={doctor._id}
                  className={`transition ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-200"
                      : "hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <td className="px-4 py-3">
                    {doctor.profilePhoto ? (
                      <img
                        src={`http://localhost:5000${doctor.profilePhoto}`}
                        alt={doctor.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          darkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <User
                          size={16}
                          className={darkMode ? "text-gray-400" : "text-gray-500"}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{doctor.fullName}</td>
                  <td className="px-4 py-3">{doctor.email}</td>
                  <td className="px-4 py-3">{doctor.phoneNo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        darkMode
                          ? "bg-blue-700 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {doctor.licenseNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(doctor.specializations) ? (
                        doctor.specializations.map((spec, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded ${
                              darkMode
                                ? "bg-purple-700 text-purple-200"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {spec}
                          </span>
                        ))
                      ) : (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            darkMode
                              ? "bg-purple-700 text-purple-200"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {doctor.specializations}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setQrItem({ ...doctor, type: "doctor" })}
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Generate QR Code"
                        >
                          <QrCode size={16} className="text-purple-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(doctor, "doctor")}
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Edit Doctor"
                        >
                          <Edit size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: doctor._id,
                              type: "doctor",
                              name: doctor.fullName,
                            })
                          }
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Delete Doctor"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${doctor.phoneNo}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 text-center text-xs py-1 rounded transition ${
                            darkMode
                              ? "bg-green-700 text-green-200 hover:bg-green-600"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${doctor.email}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 text-center text-xs py-1 rounded transition ${
                            darkMode
                              ? "bg-blue-700 text-blue-200 hover:bg-blue-600"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPathologistTable = () => (
    <div className="overflow-x-auto">
      <div
        className={`rounded-lg overflow-hidden shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <table className="w-full text-sm">
          <thead
            className={`${
              darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"
            }`}
          >
            <tr>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">Full Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">License</th>
              <th className="px-4 py-3 text-left">Specializations</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading.pathologists ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading pathologists...
                  </div>
                </td>
              </tr>
            ) : filteredPathologists.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className={`px-6 py-8 text-center ${
                    darkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {searchQuery
                    ? "No plant pathologists found matching your search."
                    : "No plant pathologists found. Add your first plant pathologist!"}
                </td>
              </tr>
            ) : (
              filteredPathologists.map((pathologist) => (
                <tr
                  key={pathologist._id}
                  className={`transition ${
                    darkMode
                      ? "hover:bg-gray-800 text-gray-200"
                      : "hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <td className="px-4 py-3">
                    {pathologist.profilePhoto ? (
                      <img
                        src={`http://localhost:5000${pathologist.profilePhoto}`}
                        alt={pathologist.fullName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          darkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <User
                          size={16}
                          className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{pathologist.fullName}</td>
                  <td className="px-4 py-3">{pathologist.email}</td>
                  <td className="px-4 py-3">{pathologist.phoneNo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        darkMode
                          ? "bg-blue-700 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {pathologist.licenseNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(pathologist.specializations)
                        ? pathologist.specializations.map((spec, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode
                                  ? "bg-purple-700 text-purple-200"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {spec}
                            </span>
                          ))
                        : (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              darkMode
                                ? "bg-purple-700 text-purple-200"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {pathologist.specializations}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setQrItem({ ...pathologist, type: "pathologist" })
                          }
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Generate QR Code"
                        >
                          <QrCode size={16} className="text-purple-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(pathologist, "pathologist")}
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Edit Pathologist"
                        >
                          <Edit size={16} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: pathologist._id,
                              type: "pathologist",
                              name: pathologist.fullName,
                            })
                          }
                          className={`p-1.5 rounded transition ${
                            darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                          }`}
                          title="Delete Pathologist"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/${pathologist.phoneNo}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 text-center text-xs py-1 rounded transition ${
                            darkMode
                              ? "bg-green-700 text-green-200 hover:bg-green-600"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`mailto:${pathologist.email}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex-1 text-center text-xs py-1 rounded transition ${
                            darkMode
                              ? "bg-blue-700 text-blue-200 hover:bg-blue-600"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          }`}
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---------- render ---------- */
  return (
    <div className={`p-4 min-h-screen ${darkMode ? 'bg-gray-900 text-gray-200' : 'light-beige'}`}>
      {/* Loader Component */}
      {showLoader && <Loader darkMode={darkMode} />}

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              darkMode
                ? "bg-green-800 text-green-100"
                : "bg-green-100 text-green-800"
            } flex items-center`}
          >
            <span className="mr-2">✅</span>
            {successMessage}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
            activeTab === "employees"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Users size={18} />
          <span>Employees</span>
          {loading.employees && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
        </button>
        <button
          onClick={() => setActiveTab("doctors")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
            activeTab === "doctors"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Stethoscope size={18} />
          <span>Doctors</span>
          {loading.doctors && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
        </button>
        <button
          onClick={() => setActiveTab("pathologists")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
            activeTab === "pathologists"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          <Leaf size={18} />
          <span>Plant Pathologists</span>
          {loading.pathologists && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
        </button>
      </div>

      {/* Search & actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div
          className={`flex items-center px-3 py-2 rounded-md w-full md:w-auto ${
            darkMode ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`ml-2 bg-transparent outline-none text-sm flex-1 ${
              darkMode
                ? "placeholder-gray-400 text-white"
                : "placeholder-gray-500 text-black"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => handleDownloadPDF(activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition flex-1 md:flex-none justify-center ${
              darkMode
                ? "bg-gray-600 hover:bg-gray-700 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download PDF</span>
          </button>

          <button
            onClick={async () => {
              await resetForm();
              setShowForm(true);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium transition flex-1 md:flex-none justify-center ${
              darkMode ? "bg-red-600 hover:bg-red-700" : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            <Plus size={16} />
            <span>
              Add{" "}
              {activeTab === "employees"
                ? "Employee"
                : activeTab === "doctors"
                ? "Doctor"
                : "Pathologist"}
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center">
            <div className={`rounded-full p-3 mr-4 ${darkMode ? "bg-gray-600" : "bg-orange-100"}`}>
              <Users className={darkMode ? "text-orange-400" : "text-orange-500"} size={20} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Employees</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{employees.length}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center">
            <div className={`rounded-full p-3 mr-4 ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>
              <Stethoscope className={darkMode ? "text-blue-400" : "text-blue-500"} size={20} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Doctors</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{doctors.length}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center">
            <div className={`rounded-full p-3 mr-4 ${darkMode ? "bg-gray-600" : "bg-green-100"}`}>
              <Leaf className={darkMode ? "text-green-400" : "text-green-500"} size={20} />
            </div>
            <div>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Pathologists</p>
              <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{pathologists.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      {activeTab === "employees" && renderEmployeeTable()}
      {activeTab === "doctors" && renderDoctorTable()}
      {activeTab === "pathologists" && renderPathologistTable()}

      {/* QR Modal */}
      {qrItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg p-6 w-full max-w-sm ${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } animate-scale-in`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">QR Code</h2>
              <button
                onClick={() => setQrItem(null)}
                className={`rounded-full p-1 ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeCanvas 
                  value={(() => {
                    const qrData = JSON.stringify({
                      id: qrItem.id || qrItem._id,
                      name: qrItem.name || qrItem.fullName,
                      type: qrItem.type,
                      timestamp: new Date().toISOString()
                    });
                    console.log("QR Code data:", qrData);
                    return qrData;
                  })()} 
                  size={180} 
                />
              </div>
              <p className="text-sm text-center">
                <strong>{qrItem.name || qrItem.fullName}</strong>
                <br />
                <span className="text-gray-500">ID: {qrItem.id || qrItem._id}</span>
                <br />
                <span className="text-gray-500">Type: {qrItem.type}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Generate professional employee ID card PDF
                    const doc = new jsPDF('p', 'mm', 'a4');
                    
                    // Company branding
                    const companyName = "Mount Olive Farm House";
                    const companyAddress = "No. 45, Green Valley Road, Boragasketiya, Nuwaraeliya, Sri Lanka";
                    const companyContact = "Phone: +94 81 249 2134 | Email: info@mountolivefarm.com";
                    const primaryColor = [34, 197, 94]; // Green
                    const textColor = [31, 41, 55]; // Dark gray
                    const lightGray = [243, 244, 246];
                    
                    // Company logo - Try to load actual logo image
                    try {
                      // Try to load the company logo image
                      const logoImg = new Image();
                      logoImg.crossOrigin = 'anonymous';
                      logoImg.onload = () => {
                        // Add logo image to PDF
                        doc.addImage(logoImg, 'PNG', 20, 10, 30, 30);
                        generatePDFContent();
                      };
                      logoImg.onerror = () => {
                        // Fallback to text logo if image fails to load
                        doc.setFillColor(...primaryColor);
                        doc.circle(35, 25, 15, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'bold');
                        doc.text('MOUNT', 35, 22, { align: 'center' });
                        doc.text('OLIVE', 35, 26, { align: 'center' });
                        doc.text('FARM', 35, 30, { align: 'center' });
                        generatePDFContent();
                      };
                      logoImg.src = '/logo512.png';
                    } catch (error) {
                      console.error('Error loading logo:', error);
                      // Fallback to text logo
                      doc.setFillColor(...primaryColor);
                      doc.circle(35, 25, 15, 'F');
                      doc.setTextColor(255, 255, 255);
                      doc.setFontSize(8);
                      doc.setFont('helvetica', 'bold');
                      doc.text('MOUNT', 35, 22, { align: 'center' });
                      doc.text('OLIVE', 35, 26, { align: 'center' });
                      doc.text('FARM', 35, 30, { align: 'center' });
                      generatePDFContent();
                    }
                    
                    const generatePDFContent = () => {
                    
                    // Company information
                    doc.setTextColor(...textColor);
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.text(companyName, 60, 20);
                    
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'normal');
                    doc.text(companyAddress, 60, 28);
                    doc.text(companyContact, 60, 32);
                    
                    // Report title banner
                    doc.setFillColor(...lightGray);
                    doc.rect(20, 40, 170, 12, 'F');
                    doc.setTextColor(...primaryColor);
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text("EMPLOYEE ID CARD", 105, 49, { align: 'center' });
                    
                    // Report metadata
                    doc.setTextColor(...textColor);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 60);
                    doc.text(`Report ID: MOF-ID-${Date.now().toString().slice(-6)}`, 20, 65);
                    
                    // Employee Information Section
                    doc.setFillColor(255, 255, 255);
                    doc.rect(20, 75, 170, 40, 'S');
                    
                    doc.setTextColor(...primaryColor);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text("EMPLOYEE INFORMATION", 25, 85);
                    
                    doc.setTextColor(...textColor);
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Employee ID: ${qrItem.id || qrItem._id}`, 25, 95);
                    doc.text(`Name: ${qrItem.name || qrItem.fullName}`, 25, 102);
                    doc.text(`Type: ${qrItem.type}`, 25, 109);
                    
                    // QR Code Section
                    doc.setTextColor(...primaryColor);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text("QR CODE FOR ATTENDANCE", 25, 125);
                    
                    // Generate QR code data URL
                    const qrData = JSON.stringify({
                      id: qrItem.id || qrItem._id,
                      name: qrItem.name || qrItem.fullName,
                      type: qrItem.type,
                      timestamp: new Date().toISOString()
                    });
                    
                    // Log QR code data to console for easy access
                    console.log("QR Code data:", qrData);
                    
                    // Create a temporary QR code element to get the data URL
                    const tempDiv = document.createElement('div');
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.left = '-9999px';
                    tempDiv.style.top = '-9999px';
                    tempDiv.style.width = '200px';
                    tempDiv.style.height = '200px';
                    document.body.appendChild(tempDiv);
                    
                    // Create QR code using qrcode.react
                    const QRCodeComponent = React.createElement(QRCodeCanvas, {
                      value: qrData,
                      size: 200,
                      level: 'M',
                      includeMargin: true
                    });
                    
                    // Render the QR code to get the canvas
                    const root = ReactDOM.createRoot(tempDiv);
                    root.render(QRCodeComponent);
                    
                    // Wait for the QR code to render, then get the canvas
                    setTimeout(() => {
                      const canvas = tempDiv.querySelector('canvas');
                      if (canvas) {
                        const qrDataURL = canvas.toDataURL('image/png');
                        
                        // Add QR code image to PDF - centered
                        doc.addImage(qrDataURL, 'PNG', 75, 135, 60, 60);
                        
                        // Add QR code instruction
                        doc.setTextColor(...textColor);
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.text("Scan this QR code for attendance", 105, 205, { align: 'center' });
                        
                        // Professional footer
                        doc.setDrawColor(...primaryColor);
                        doc.setLineWidth(0.5);
                        doc.line(20, 220, 190, 220);
                        
                        doc.setTextColor(100, 100, 100);
                        doc.setFontSize(8);
                        doc.text("Page 1 of 1", 20, 230);
                        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 230, { align: 'center' });
                        doc.text("Mount Olive Farm House", 190, 230, { align: 'right' });
                        
                        doc.setTextColor(100, 100, 100);
                        doc.setFontSize(7);
                        doc.text("This report is generated by Mount Olive Farm House Management System", 105, 235, { align: 'center' });
                        
                        // Save PDF
                        const fileName = `Employee_${qrItem.id || qrItem._id}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                        
                        // Clean up
                        document.body.removeChild(tempDiv);
                      } else {
                        // Fallback if QR code generation fails
                        doc.setFillColor(0, 0, 0);
                        doc.rect(75, 135, 60, 60, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(8);
                        doc.text("QR CODE", 105, 170, { align: 'center' });
                        
                        // Add QR code instruction
                        doc.setTextColor(...textColor);
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'normal');
                        doc.text("Scan this QR code for attendance", 105, 205, { align: 'center' });
                        
                        // Professional footer
                        doc.setDrawColor(...primaryColor);
                        doc.setLineWidth(0.5);
                        doc.line(20, 220, 190, 220);
                        
                        doc.setTextColor(100, 100, 100);
                        doc.setFontSize(8);
                        doc.text("Page 1 of 1", 20, 230);
                        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 230, { align: 'center' });
                        doc.text("Mount Olive Farm House", 190, 230, { align: 'right' });
                        
                        doc.setTextColor(100, 100, 100);
                        doc.setFontSize(7);
                        doc.text("This report is generated by Mount Olive Farm House Management System", 105, 235, { align: 'center' });
                        
                        // Save PDF
                        const fileName = `Employee_${qrItem.id || qrItem._id}_${new Date().toISOString().split('T')[0]}.pdf`;
                        doc.save(fileName);
                        
                        // Clean up
                        document.body.removeChild(tempDiv);
                      }
                    }, 200);
                    };
                  }}
                  className={`px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition`}
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setQrItem(null)}
                  className={`px-4 py-2 rounded-md ${
                    darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                  } transition`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Send Email to {emailModal.employee.name}
                </h3>
                <button
                  onClick={() => setEmailModal(null)}
                  className={`p-2 rounded-full transition ${
                    darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  From (Employee Manager)
                </label>
                <input
                  type="email"
                  value={emailData.fromEmail}
                  disabled
                  className={`w-full px-3 py-2 rounded-md text-sm border ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 border-gray-600'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  To
                </label>
                <input
                  type="email"
                  value={`${emailModal.employee.name.toLowerCase().replace(/\s+/g, '')}@mountolive.com`}
                  disabled
                  className={`w-full px-3 py-2 rounded-md text-sm border ${
                    darkMode
                      ? 'bg-gray-700 text-gray-300 border-gray-600'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={emailData.subject}
                  onChange={handleEmailChange}
                  placeholder="Enter email subject"
                  className={`w-full px-3 py-2 rounded-md text-sm border ${
                    darkMode
                      ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
                      : 'border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={emailData.message}
                  onChange={handleEmailChange}
                  rows={6}
                  placeholder="Enter your message here..."
                  className={`w-full px-3 py-2 rounded-md text-sm border ${
                    darkMode
                      ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400'
                      : 'border-gray-300 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
            
            <div className={`px-6 py-4 border-t flex justify-end space-x-3 ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setEmailModal(null)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={loading.form}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  loading.form
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading.form ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-lg p-6 w-full max-w-md ${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } animate-scale-in`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Confirm Delete</h2>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`rounded-full p-1 ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <p className="mb-6">
              Are you sure you want to delete {deleteConfirm.name}? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                } transition`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === "employee")
                    handleDeleteEmployee(deleteConfirm.id);
                  else if (deleteConfirm.type === "doctor")
                    handleDeleteDoctor(deleteConfirm.id);
                  else if (deleteConfirm.type === "pathologist")
                    handleDeletePathologist(deleteConfirm.id);
                }}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition"
                disabled={loading.employees || loading.doctors || loading.pathologists}
              >
                {loading.employees || loading.doctors || loading.pathologists ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-4"></div>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className={`rounded-lg p-6 max-w-3xl w-full ${darkMode ? "bg-gray-800 text-white" : "bg-white"} animate-scale-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Profile Photo</h2>
              <button
                onClick={() => setSelectedPhoto(null)}
                className={`rounded-full p-1 ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex justify-center">
              <img 
                src={selectedPhoto} 
                alt="Enlarged profile" 
                className="max-h-[70vh] max-w-full rounded-lg shadow-lg object-contain" 
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedPhoto(null)}
                className={`px-4 py-2 rounded-md ${
                  darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                } transition`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div
            className={`rounded-lg p-6 w-full max-w-4xl my-8 ${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            } animate-scale-in`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingItem
                  ? `Edit ${
                      editingItem.type === "employee"
                        ? "Employee"
                        : editingItem.type === "doctor"
                        ? "Doctor"
                        : "Plant Pathologist"
                    }`
                  : `Add New ${
                      activeTab === "employees"
                        ? "Employee"
                        : activeTab === "doctors"
                        ? "Doctor"
                        : "Plant Pathologist"
                    }`}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className={`rounded-full p-1 ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="space-y-6 max-h-[70vh] overflow-y-auto pr-2"
              onSubmit={
                editingItem
                  ? editingItem.type === "employee"
                    ? handleUpdateEmployee
                    : editingItem.type === "doctor"
                    ? handleUpdateDoctor
                    : handleUpdatePathologist
                  : activeTab === "employees"
                  ? handleAddEmployee
                  : activeTab === "doctors"
                  ? handleAddDoctor
                  : handleAddPathologist
              }
            >
              {/* Personal Information */}
              <div>
                <h3
                  className={`text-md font-medium mb-4 pb-2 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., John Doe"
                        className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${errors.name ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        required
                        placeholder="07XXXXXXXX or 7XXXXXXXX"
                        className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${errors.contact ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.contact && (
                      <p className="text-red-500 text-xs mt-1">{errors.contact}</p>
                    )}
                  </div>
                </div>

                {(activeTab === "doctors" ||
                  activeTab === "pathologists" ||
                  editingItem?.type === "doctor" ||
                  editingItem?.type === "pathologist") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="e.g., john@example.com"
                          className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                              : "border-gray-300 placeholder-gray-500"
                          } ${errors.email ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar
                          size={18}
                          className="absolute left-3 top-2.5 text-gray-400"
                        />
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600"
                              : "border-gray-300"
                          } ${errors.dateOfBirth ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.dateOfBirth && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.dateOfBirth}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(activeTab === "employees" || editingItem?.type === "employee") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Employee ID <span className="text-green-600 text-xs">(Auto-generated)</span>
                      </label>
                      <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        required
                        disabled={true}
                        placeholder="Auto-generated (e.g., EMP001)"
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-600 text-gray-300 border-gray-600 placeholder-gray-400"
                            : "bg-gray-100 text-gray-600 border-gray-300 placeholder-gray-500"
                        } opacity-70 cursor-not-allowed ${
                          errors.id ? "border-red-500" : ""
                        }`}
                      />
                      {errors.id && (
                        <p className="text-red-500 text-xs mt-1">{errors.id}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Join Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar
                          size={18}
                          className="absolute left-3 top-2.5 text-gray-400"
                        />
                        <input
                          type="date"
                          name="joined"
                          value={formData.joined}
                          onChange={handleChange}
                          required
                          className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600"
                              : "border-gray-300"
                          } ${errors.joined ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.joined && (
                        <p className="text-red-500 text-xs mt-1">{errors.joined}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Information */}
              <div>
                <h3
                  className={`text-md font-medium mb-4 pb-2 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Professional Information
                </h3>

                {(activeTab === "employees" || editingItem?.type === "employee") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600"
                            : "border-gray-300"
                        } ${errors.title ? "border-red-500" : ""}`}
                      >
                        <option value="">Select Job Title</option>
                        <option value="Employee Manager">Employee Manager</option>
                        <option value="Animal Manager">Animal Manager</option>
                        <option value="Plant Manager">Plant Manager</option>
                        <option value="Inventory Manager">Inventory Manager</option>
                        <option value="Animal Health Manager">Animal Health Manager</option>
                        <option value="Plant Health Manager">Plant Health Manager</option>
                        <option value="Worker">Worker</option>
                        <option value="Care Taker">Care Taker</option>
                        <option value="Cleaner">Cleaner</option>
                        <option value="Driver">Driver</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Employee Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600"
                            : "border-gray-300"
                        } ${errors.type ? "border-red-500" : ""}`}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                      {errors.type && (
                        <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="employeename@mountolive.com"
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${errors.email ? "border-red-500" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600"
                            : "border-gray-300"
                        } ${errors.department ? "border-red-500" : ""}`}
                      >
                        <option value="">Select Department</option>
                        <option value="Farm Operations">Farm Operations</option>
                        <option value="Inventory Management">Inventory Management</option>
                        <option value="Health Management">Health Management</option>
                        <option value="Administration">Administration</option>
                        <option value="Employee Management">Employee Management</option>
                        <option value="Plant Management">Plant Management</option>
                        <option value="Animal Management">Animal Management</option>
                      </select>
                      {errors.department && (
                        <p className="text-red-500 text-xs mt-1">{errors.department}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600"
                            : "border-gray-300"
                        } ${errors.status ? "border-red-500" : ""}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                      {errors.status && (
                        <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows={3}
                        placeholder="Enter complete address"
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${errors.address ? "border-red-500" : ""}`}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                      )}
                    </div>
                  </div>
                )}

                {(activeTab === "doctors" ||
                  activeTab === "pathologists" ||
                  editingItem?.type === "doctor" ||
                  editingItem?.type === "pathologist") && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          License Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={handleChange}
                          required
                          placeholder="e.g., MED12345"
                          className={`w-full px-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                              : "border-gray-300 placeholder-gray-500"
                          } ${errors.licenseNumber ? "border-red-500" : ""}`}
                        />
                        {errors.licenseNumber && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.licenseNumber}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Years of Experience <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="yearsOfExperience"
                          value={formData.yearsOfExperience}
                          onChange={handleChange}
                          required
                          min="0"
                          className={`w-full px-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                              : "border-gray-300 placeholder-gray-500"
                          } ${errors.yearsOfExperience ? "border-red-500" : ""}`}
                        />
                        {errors.yearsOfExperience && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.yearsOfExperience}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Specializations <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <BookOpen
                            size={18}
                            className="absolute left-3 top-2.5 text-gray-400"
                          />
                          <input
                            type="text"
                            name="specializations"
                            value={formData.specializations}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Cardiology, Neurology (comma separated)"
                            className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                              darkMode
                                ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                                : "border-gray-300 placeholder-gray-500"
                            } ${errors.specializations ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors.specializations && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.specializations}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Qualifications <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Award
                            size={18}
                            className="absolute left-3 top-2.5 text-gray-400"
                          />
                          <input
                            type="text"
                            name="qualifications"
                            value={formData.qualifications}
                            onChange={handleChange}
                            required
                            placeholder="e.g., MBBS, MD"
                            className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                              darkMode
                                ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                                : "border-gray-300 placeholder-gray-500"
                            } ${errors.qualifications ? "border-red-500" : ""}`}
                          />
                        </div>
                        {errors.qualifications && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.qualifications}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {activeTab === "doctors" && (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Address
                          </label>
                          <div className="relative">
                            <MapPin
                              size={18}
                              className="absolute left-3 top-2.5 text-gray-400"
                            />
                            <input
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="e.g., 123 Main St, City"
                              className={`w-full pl-10 pr-3 py-2 rounded-md text-sm border ${
                                darkMode
                                  ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                                  : "border-gray-300 placeholder-gray-500"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {!editingItem && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          className={`w-full px-3 py-2 rounded-md text-sm border ${
                            darkMode
                              ? "bg-gray-800 text-white border-gray-600 placeholder-gray-400"
                              : "border-gray-300 placeholder-gray-500"
                          } ${errors.password ? "border-red-500" : ""}`}
                        />
                        {errors.password && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.password}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3
                  className={`text-md font-medium mb-4 pb-2 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Photo
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-md p-4 text-center ${
                        darkMode ? "border-gray-600" : "border-gray-300"
                      }`}
                    >
                      <Upload size={20} className="mx-auto text-gray-400 mb-2" />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer text-blue-500 hover:text-blue-600"
                      >
                        {formData.photoFile
                          ? formData.photoFile.name
                          : "Click to upload photo"}
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData((f) => ({ ...f, photoFile: e.target.files[0] }))
                        }
                        className="hidden"
                      />
                    </div>
                  </div>

                  {(activeTab === "employees" || editingItem?.type === "employee") && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        CV (PDF)
                      </label>
                      <div
                        className={`border-2 border-dashed rounded-md p-4 text-center ${
                          darkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      >
                        <FileText size={20} className="mx-auto text-gray-400 mb-2" />
                        <label
                          htmlFor="cv-upload"
                          className="cursor-pointer text-blue-500 hover:text-blue-600"
                        >
                          {formData.cvFile
                            ? formData.cvFile.name
                            : "Click to upload CV"}
                        </label>
                        <input
                          id="cv-upload"
                          type="file"
                          accept="application/pdf"
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, cvFile: e.target.files[0] }))
                          }
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`flex justify-end gap-3 pt-4 border-t ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-md bg-gray-300 text-black hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600 transition flex items-center gap-2"
                  disabled={loading.form}
                >
                  {loading.form ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      {editingItem ? "Update" : "Add"}{" "}
                      {activeTab === "employees"
                        ? "Employee"
                        : activeTab === "doctors"
                        ? "Doctor"
                        : "Pathologist"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};