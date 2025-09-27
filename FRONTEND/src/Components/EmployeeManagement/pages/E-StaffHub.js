// src/pages/StaffHub.jsx
import React, { useState, useEffect } from "react";
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

export const StaffHub = ({ darkMode }) => {
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

  const formDataTemplate = {
    // common
    id: "",
    name: "",
    contact: "",
    title: "",
    type: "Full-time",
    joined: "",
    photoFile: null,
    cvFile: null,
    // med
    email: "",
    licenseNumber: "",
    specializations: "",
    qualifications: "",
    yearsOfExperience: "",
    dateOfBirth: "",
    gender: "Male",
    address: "",
    password: "",
  };

  const [formData, setFormData] = useState(formDataTemplate);

  /* ---------- data ---------- */
  useEffect(() => {
    fetchEmployees();
    fetchDoctors();
    fetchPathologists();
  }, []);

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
      setEmployees(data);
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

  const resetForm = () => {
    setFormData(formDataTemplate);
    setEditingItem(null);
    setErrors({});
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
      if (!isEmpId(fd.id)) {
        e.id = "Employee ID should be 3–20 characters (letters, numbers, _ or -).";
      }
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

    setLoading((p) => ({ ...p, form: true }));
    setShowLoader(true);
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "photoFile" && k !== "cvFile") form.append(k, v);
      });
      if (formData.photoFile) form.append("photo", formData.photoFile);
      if (formData.cvFile) form.append("cv", formData.cvFile);

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
        alert(`Error: ${data.error || "Failed to add employee"}`);
      }
    } catch (err) {
      console.error(err);
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

  /* ---------- export ---------- */
  const handleDownloadPDF = (type) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
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

    doc.text(reportTitle, 105, 49, { align: 'center' });

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
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 },
      styles: {
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
        halign: 'left',
        valign: 'middle',
        overflow: 'linebreak'
      }
    });

    // Professional footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer background
      doc.setFillColor(...lightGray);
      doc.rect(0, 280, 210, 20, 'F');
      
      // Footer content
      doc.setTextColor(...textColor);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, 288);
      doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 288, { align: 'center' });
      doc.text(companyName, 190, 288, { align: 'right' });
      
      // Footer line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 290, 190, 290);
      
      // Disclaimer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.text("This report is generated by Mount Olive Farm House Management System", 105, 295, { align: 'center' });
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
    <div className="overflow-x-auto">
      <div
        className={`rounded-lg overflow-hidden shadow ${
          darkMode ? "bg-gray-700" : "bg-gray-50"
        }`}
      >
        <table className="w-full text-sm">
          <thead
            className={`${darkMode ? "bg-gray-800 text-white" : "bg-gray-100"}`}
          >
            <tr>
              <th className="px-4 py-3 text-left">Emp ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Contact No</th>
              <th className="px-4 py-3 text-left">Job Title</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Photo</th>
              <th className="px-4 py-3 text-left">CV</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading.employees ? (
              <tr>
                <td colSpan="10" className="px-6 py-8 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan="10"
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
              filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className={`transition ${
                    darkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{employee.id}</td>
                  <td className="px-4 py-3">{employee.name}</td>
                  <td className="px-4 py-3">{employee.contact}</td>
                  <td className="px-4 py-3">{employee.title}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
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
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{employee.joined}</td>
                  <td className="px-4 py-3">
                    {employee.photo ? (
                      <img
                        src={`http://localhost:5000${employee.photo}`}
                        alt="Employee"
                        className="h-10 w-10 rounded-full object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(`http://localhost:5000${employee.photo}`)}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {employee.cv ? (
                      <a
                        href={`http://localhost:5000${employee.cv}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-500 hover:underline"
                      >
                        <FileText size={14} className="mr-1" /> View
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setQrItem({ ...employee, type: "employee" })}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition"
                        title="Generate QR Code"
                      >
                        <QrCode size={16} className="text-purple-500" />
                      </button>
                      <a
                        href={`http://localhost:5000/api/employees/${employee.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-500 hover:underline p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition"
                        title="Generate PDF Report"
                      >
                        <FileText size={14} className="mr-1" /> PDF
                      </a>
                      <button
                        onClick={() => handleEdit(employee, "employee")}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition"
                        title="Edit Employee"
                      >
                        <Edit size={16} className="text-blue-500" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            id: employee.id,
                            type: "employee",
                            name: employee.name,
                          })
                        }
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition"
                        title="Delete Employee"
                      >
                        <Trash2 size={16} className="text-red-500" />
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
                      ? "hover:bg-gray-700 text-gray-200"
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
                      ? "hover:bg-gray-700 text-gray-200"
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
    <div className="p-4">
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
            darkMode ? "bg-gray-700" : "bg-gray-100"
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
            onClick={() => {
              resetForm();
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
        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-700" : "bg-white"}`}>
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

        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-700" : "bg-white"}`}>
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

        <div className={`rounded-lg p-4 shadow ${darkMode ? "bg-gray-700" : "bg-white"}`}>
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
                className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeCanvas value={qrItem.id || qrItem._id} size={180} />
              </div>
              <p className="text-sm text-center">
                <strong>{qrItem.name || qrItem.fullName}</strong>
                <br />
                <span className="text-gray-500">ID: {qrItem.id || qrItem._id}</span>
                <br />
                <span className="text-gray-500">Type: {qrItem.type}</span>
              </p>
              <button
                onClick={() => setQrItem(null)}
                className={`mt-4 px-4 py-2 rounded-md ${
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
                } transition`}
              >
                Close
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
                className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
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
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
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
                className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
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
                  darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"
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
                className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
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
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                              ? "bg-gray-700 text-white border-gray-600"
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
                        Employee ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        required
                        disabled={!!editingItem}
                        placeholder="e.g., EMP001"
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${editingItem ? "opacity-70 cursor-not-allowed" : ""} ${
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
                              ? "bg-gray-700 text-white border-gray-600"
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
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Farm Manager"
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode
                            ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                            : "border-gray-300 placeholder-gray-500"
                        } ${errors.title ? "border-red-500" : ""}`}
                      />
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
                            ? "bg-gray-700 text-white border-gray-600"
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
                              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                                ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                              ? "bg-gray-700 text-white border-gray-600"
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
                                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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
                              ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
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

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
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