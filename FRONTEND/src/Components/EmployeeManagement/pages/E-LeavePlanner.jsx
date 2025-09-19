// src/pages/E-LeavePlanner.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Plus, FileDown, Edit, Trash2, X } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API = "http://localhost:5000/api/leaves";

export const ELeavePlanner = ({ darkMode }) => {
  const [activeTab, setActiveTab] = useState("requests");

  // ---- NEW State (replaces dummy) ----
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [empSearch, setEmpSearch] = useState(""); // for Summary tab
  const [leaves, setLeaves] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form popup
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // leave object or null
  const [form, setForm] = useState({
    empId: "",
    name: "",
    type: "Annual",
    from: "",
    to: "",
    days: "",
    reason: "",
    status: "Pending",
  });

  // Chart/Balance refs (for PDF)
  const distRef = useRef(null);
  const balanceRef = useRef(null);

  // Fetch leaves
  const loadLeaves = async () => {
    setLoading(true);
    // Build query
    const p = new URLSearchParams();
    if (statusFilter !== "All Status") p.append("status", statusFilter);
    if (typeFilter !== "All Types") p.append("type", typeFilter);
    if (yearFilter) p.append("year", yearFilter);
    const res = await fetch(`${API}?${p.toString()}`);
    const data = await res.json();
    setLeaves(data);
    setLoading(false);
  };

  // Fetch upcoming (for cards)
  const loadUpcoming = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${API}/upcoming?from=${today}`);
    const data = await res.json();
    setUpcoming(data.slice(0, 9)); // show grid
  };

  // SSE real-time stream
  useEffect(() => {
    loadLeaves();
    loadUpcoming();
    const es = new EventSource(`${API}/stream`);
    es.addEventListener("change", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        // simplest approach: reload list on any change
        loadLeaves();
        loadUpcoming();
      } catch (_) {}
    });
    es.onerror = () => {
      // silently ignore; EventSource will retry
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, yearFilter]);

  // Submit create/update
  const submitForm = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      // if days empty, backend computes
      days: form.days ? Number(form.days) : undefined,
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `${API}/${editing._id}` : API;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(`Failed: ${err.error || res.statusText}`);
      return;
    }

    setShowForm(false);
    setEditing(null);
    setForm({
      empId: "",
      name: "",
      type: "Annual",
      from: "",
      to: "",
      days: "",
      reason: "",
      status: "Pending",
    });
    // SSE will refresh lists
  };

  const onEdit = (row) => {
    setEditing(row);
    setForm({
      empId: row.empId,
      name: row.name,
      type: row.type,
      from: row.from?.slice(0, 10),
      to: row.to?.slice(0, 10),
      days: String(row.days || ""),
      reason: row.reason || "",
      status: row.status,
    });
    setShowForm(true);
  };

  const onDelete = async (row) => {
    if (!window.confirm("Delete this leave?")) return;
    await fetch(`${API}/${row._id}`, { method: "DELETE" });
    // SSE refreshes
  };

  // ---- Derived chart data from current leaves list ----
  const leaveData = useMemo(() => {
    const sums = { Annual: 0, Sick: 0, Casual: 0, Other: 0 };
    leaves.forEach((l) => {
      sums[l.type] = (sums[l.type] || 0) + (l.days || 0);
    });
    return [
      { name: "Annual Leave", raw: sums.Annual, key: "Annual", color: "#3b82f6" },
      { name: "Sick Leave", raw: sums.Sick, key: "Sick", color: "#ef4444" },
      { name: "Casual Leave", raw: sums.Casual, key: "Casual", color: "#f59e0b" },
      { name: "Other", raw: sums.Other, key: "Other", color: "#8b5cf6" },
    ].map((x) => ({ name: x.name, value: x.raw, color: x.color }));
  }, [leaves]);

  // ---- Balance (by empId + year) ----
  const [balance, setBalance] = useState(null);
  const fetchBalance = async () => {
    if (!empSearch) {
      setBalance(null);
      return;
    }
    const res = await fetch(`${API}/balance?empId=${empSearch}&year=${yearFilter}`);
    const data = await res.json();
    if (data && data.balance) setBalance(data.balance);
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empSearch, yearFilter, leaves.length]); // recalc when new leaves arrive

  // ---- PDF generation (chart + balance + upcoming) ----
  const generatePDF = async () => {
    if (!empSearch) {
      alert("Please enter an Emp ID to generate the report.");
      return;
    }
    const pdf = new jsPDF("p", "pt", "a4");

    pdf.setFontSize(16);
    pdf.text(`Leave Report - ${empSearch} (${yearFilter})`, 40, 40);

    // Capture Distribution
    if (distRef.current) {
      const canvas1 = await html2canvas(distRef.current);
      const img1 = canvas1.toDataURL("image/png");
      pdf.addImage(img1, "PNG", 40, 60, 520, 280, undefined, "FAST");
    }

    // Capture Balance
    if (balanceRef.current) {
      const canvas2 = await html2canvas(balanceRef.current);
      const img2 = canvas2.toDataURL("image/png");
      pdf.addPage();
      pdf.text(`Leave Balance - ${empSearch}`, 40, 40);
      pdf.addImage(img2, "PNG", 40, 60, 520, 280, undefined, "FAST");
    }

    // Upcoming
    pdf.addPage();
    pdf.text(`Upcoming Leaves`, 40, 40);
    pdf.setFontSize(11);
    let y = 70;
    upcoming.slice(0, 20).forEach((u) => {
      const line = `${u.name} (${u.empId}) - ${u.type} | ${new Date(
        u.from
      ).toLocaleDateString()} - ${new Date(u.to).toLocaleDateString()} | ${u.days} days | ${u.status}`;
      pdf.text(line, 40, y);
      y += 18;
    });

    pdf.save(`leave-report-${empSearch}-${yearFilter}.pdf`);
  };

  return (
    <div
      className={`p-6 font-sans ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Tabs */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "requests"
              ? "border-b-2 border-orange-500 text-orange-500 font-medium"
              : "text-gray-600"
          }`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "summary"
              ? "border-b-2 border-orange-500 text-orange-500 font-medium"
              : "text-gray-600"
          }`}
        >
          Leave Summary
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <>
          {/* Actions */}
          <div className="flex justify-between mb-6">
            <div className="flex gap-3">
              <select
                className="px-3 py-2 border rounded"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <select
                className="px-3 py-2 border rounded"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option>All Types</option>
                <option>Annual</option>
                <option>Sick</option>
                <option>Casual</option>
                <option>Other</option>
              </select>
              <select
                className="px-3 py-2 border rounded"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setForm({
                  empId: "",
                  name: "",
                  type: "Annual",
                  from: "",
                  to: "",
                  days: "",
                  reason: "",
                  status: "Pending",
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
            >
              <Plus size={18} />
              <span>New Leave Request</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="p-3">Number</th>
                  <th className="p-3">Emp ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((r) => (
                  <tr key={r._id} className="border-b">
                    <td className="p-3">{r.number}</td>
                    <td className="p-3">{r.empId}</td>
                    <td className="p-3">{r.name}</td>
                    <td className="p-3">{r.type}</td>
                    <td className="p-3">
                      {new Date(r.from).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {new Date(r.to).toLocaleDateString()}
                    </td>
                    <td className="p-3">{r.days}</td>
                    <td className="p-3">{r.reason}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          r.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : r.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => onEdit(r)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(r)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && leaves.length === 0 && (
                  <tr>
                    <td className="p-3 text-sm text-gray-500" colSpan={10}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Popup Form */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              />
              <div className="relative p-6 bg-white rounded-lg shadow w-full max-w-3xl">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  <X />
                </button>
                <h3 className="text-lg font-semibold mb-4">
                  {editing ? "Update Leave Request" : "New Leave Request"}
                </h3>

                <form onSubmit={submitForm} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm">Emp ID</label>
                    <input
                      type="text"
                      className="w-full border px-3 py-2 rounded"
                      value={form.empId}
                      onChange={(e) => setForm({ ...form, empId: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Name</label>
                    <input
                      type="text"
                      className="w-full border px-3 py-2 rounded"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Leave Type</label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      <option>Annual</option>
                      <option>Sick</option>
                      <option>Casual</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">From Date</label>
                    <input
                      type="date"
                      className="w-full border px-3 py-2 rounded"
                      value={form.from}
                      onChange={(e) => setForm({ ...form, from: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">To Date</label>
                    <input
                      type="date"
                      className="w-full border px-3 py-2 rounded"
                      value={form.to}
                      onChange={(e) => setForm({ ...form, to: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Days</label>
                    <input
                      type="number"
                      className="w-full border px-3 py-2 rounded"
                      value={form.days}
                      onChange={(e) => setForm({ ...form, days: e.target.value })}
                      placeholder="Auto-calc if empty"
                      min={1}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 text-sm">Reason</label>
                    <textarea
                      rows={3}
                      className="w-full border px-3 py-2 rounded"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm">Status</label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>

                  <div className="col-span-2 text-right mt-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(null);
                      }}
                      className="bg-gray-400 text-white px-4 py-2 rounded shadow hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
                    >
                      {editing ? "Update" : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Tab */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Leave Summary</h3>
            <div className="flex gap-3">
              <input
                className="px-3 py-2 border rounded"
                placeholder="Search by Emp ID"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
              <select
                className="px-3 py-2 border rounded"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option>2023</option>
                <option>2024</option>
                <option>2025</option>
              </select>
              <button
                onClick={generatePDF}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600"
              >
                <FileDown size={18} />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {/* Charts + Balance */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-lg shadow" ref={distRef}>
              <h4 className="font-medium mb-4">Leave Distribution</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100 || 0).toFixed(0)}%`
                      }
                    >
                      {leaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow" ref={balanceRef}>
              <h4 className="font-medium mb-4">Leave Balance</h4>
              {!balance ? (
                <p className="text-sm text-gray-500">
                  Enter an Emp ID to see balance (Annual 21, Sick 14, Casual 7).
                </p>
              ) : (
                <div className="space-y-4">
                  {[
                    ["Annual", "bg-blue-500"],
                    ["Sick", "bg-red-500"],
                    ["Casual", "bg-orange-500"],
                  ].map(([key, bar]) => {
                    const total = balance[key].total;
                    const used = balance[key].used;
                    const pct = total ? Math.min((used / total) * 100, 100) : 0;
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{key} Leave</span>
                          <span>
                            {used}/{total} days
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div className={`${bar} h-2 rounded`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Leaves */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h4 className="font-medium mb-4">Upcoming Leaves</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((u) => (
                <div
                  key={u._id}
                  className={`p-4 rounded-lg border-l-4 ${
                    u.type === "Other"
                      ? "border-purple-500"
                      : "border-blue-500"
                  } bg-gray-50`}
                >
                  <div className="flex justify-between mb-2">
                    <div>
                      <h5 className="font-semibold">{u.name}</h5>
                      <p className="text-sm text-gray-500">{u.type}</p>
                    </div>
                    <Calendar
                      size={18}
                      className={`${
                        u.type === "Other" ? "text-purple-500" : "text-blue-500"
                      }`}
                    />
                  </div>
                  <p className="text-sm">
                    {new Date(u.from).toLocaleDateString()} -{" "}
                    {new Date(u.to).toLocaleDateString()}
                  </p>
                  <p className="text-sm">{u.days} days</p>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-sm text-gray-500">No upcoming leaves.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
