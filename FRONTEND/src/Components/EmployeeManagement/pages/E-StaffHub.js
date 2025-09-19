import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, QrCode, FileText, X } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export const StaffHub = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState("employees");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [qrEmployee, setQrEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    contact: "",
    title: "",
    type: "Full-time",
    joined: "",
    photoFile: null,
    cvFile: null,
  });

  // Load employees from backend
  useEffect(() => {
    fetchEmployees();
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
      console.error(err);
      alert("Failed to load employees. Make sure the backend server is running on port 5000.");
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
    });
    setEditingEmployee(null);
  };

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
        `http://localhost:5000/api/employees/${editingEmployee.id}`,
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

  const handleDelete = async (id) => {
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

  const handleEdit = (employee) => {
    setFormData({
      id: employee.id,
      name: employee.name,
      contact: employee.contact,
      title: employee.title,
      type: employee.type,
      joined: employee.joined,
      photoFile: null,
      cvFile: null,
    });
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "employees"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === "reports"
              ? darkMode
                ? "border-b-2 border-orange-500 text-orange-400"
                : "border-b-2 border-orange-600 text-orange-600"
              : "text-gray-500 hover:text-orange-500"
          }`}
        >
          Reports
        </button>
      </div>

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <>
          {/* Search & Add */}
          <div className="flex justify-between items-center mb-6">
            <div className={`flex items-center px-3 py-2 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`ml-2 bg-transparent outline-none text-sm ${
                  darkMode ? "placeholder-gray-400 text-white" : "placeholder-gray-500 text-black"
                }`}
              />
            </div>

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
              <span>Add Employee</span>
            </button>
          </div>

          {/* Employee Table */}
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
                          <button onClick={() => setQrEmployee(employee)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Generate QR Code">
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
                          <button onClick={() => handleEdit(employee)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Edit Employee">
                            <Edit size={16} className="text-blue-500" />
                          </button>
                          <button onClick={() => handleDelete(employee.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500" title="Delete Employee">
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

          {/* QR Modal */}
          {qrEmployee && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`rounded-lg p-6 w-full max-w-sm ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">QR Code</h2>
                  <button onClick={() => setQrEmployee(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <QRCodeCanvas value={qrEmployee.id} size={180} />
                  <p className="text-sm text-center">
                    <strong>{qrEmployee.name}</strong><br />
                    <span className="text-gray-500">ID: {qrEmployee.id}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add/Edit Employee Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`rounded-lg p-6 w-full max-w-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
                  <button onClick={() => { setShowForm(false); resetForm(); }}>
                    <X size={20} />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee}>
                  <div>
                    <label className="block text-sm font-medium mb-1">Employee ID *</label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      required
                      disabled={editingEmployee}
                      placeholder="e.g., EMP001"
                      className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"} ${editingEmployee ? "opacity-70 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g., John Doe" className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Number *</label>
                    <input type="text" name="contact" value={formData.contact} onChange={handleChange} required placeholder="e.g., +1-234-567-8900" className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Farm Manager" className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Employee Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Joined Date *</label>
                    <input type="date" name="joined" value={formData.joined} onChange={handleChange} required className={`w-full px-3 py-2 rounded-md text-sm border ${darkMode ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"}`} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Photo</label>
                    <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photoFile: e.target.files[0] })} className="w-full text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">CV (PDF)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => setFormData({ ...formData, cvFile: e.target.files[0] })} className="w-full text-sm" />
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-md bg-gray-300 text-black hover:bg-gray-400">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600">{editingEmployee ? "Update" : "Add"} Employee</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
