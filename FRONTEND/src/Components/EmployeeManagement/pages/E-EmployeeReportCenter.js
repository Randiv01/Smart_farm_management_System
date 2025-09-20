import React, { useState } from "react";
import {
  Search,
  FileDown,
  FileText,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";

export const EEmployeeReportCenter = ({ darkMode }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const employees = [
    { id: "EMP001", name: "John Smith", title: "Farm Manager", department: "Farm Operations" },
    { id: "EMP002", name: "Sarah Johnson", title: "Crop Specialist", department: "Crop Management" },
    { id: "EMP003", name: "Michael Brown", title: "Equipment Technician", department: "Farm Operations" },
    { id: "EMP004", name: "Emily Davis", title: "Livestock Supervisor", department: "Livestock" },
    { id: "EMP005", name: "David Wilson", title: "Irrigation Specialist", department: "Farm Operations" }
  ];

  const employeeDetails = {
    id: "EMP001",
    name: "John Smith",
    title: "Farm Manager",
    department: "Farm Operations",
    joined: "2022-05-15",
    contact: "+94 77 123 4567",
    email: "john.smith@smartfarm.com",
    address: "123 Farm Road, Agricultural Zone",
    attendance: { present: 21, absent: 1, leave: 1 },
    leave: { annual: { used: 6, total: 21 }, sick: { used: 2, total: 14 } },
    overtime: { currentMonth: 12.5, lastMonth: 10 },
    salary: { basic: "$2,800", overtime: "$320", allowances: "$450", total: "$3,190" }
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-80 rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white dark:bg-dark-gray rounded-xl px-3 py-2 border border-gray-200/70 dark:border-transparent shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full bg-transparent outline-none text-gray-700 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-300"
              />
            </div>

            {/* Filter */}
            <select
              className="w-full rounded-xl px-3 py-2 border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-gray text-gray-700 dark:text-dark-text shadow-sm"
              defaultValue="all"
            >
              <option value="all">All Departments</option>
              <option value="farm">Farm Operations</option>
              <option value="crop">Crop Management</option>
              <option value="livestock">Livestock</option>
              <option value="admin">Administration</option>
            </select>

            {/* Employee list */}
            <div className="flex flex-col gap-2">
              {employees.map((e) => {
                const active = selectedEmployee === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEmployee(e.id)}
                    className={[
                      "text-left px-3 py-2 rounded-xl border transition",
                      "shadow-sm hover:shadow",
                      active
                        ? "bg-orange-500 text-white border-transparent"
                        : "bg-white dark:bg-dark-gray text-gray-800 dark:text-dark-text border-gray-200/70 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-600"
                    ].join(" ")}
                  >
                    <div className="font-medium">{e.name}</div>
                    <div className="text-sm opacity-80">{e.title}</div>
                    <div className="text-xs opacity-70">{e.department}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Details */}
        <main className="flex-1">
          {selectedEmployee ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                  {employeeDetails.name}
                </h3>
                <button className="inline-flex items-center gap-2 rounded-xl bg-btn-teal text-white px-4 py-2 shadow-btn hover:brightness-95 active:brightness-90">
                  <FileDown className="w-4 h-4" />
                  <span>Export Full Report</span>
                </button>
              </div>

              {/* Personal Info */}
              <section className="rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-5 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Employee ID</p>
                    <p className="font-medium">{employeeDetails.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Department</p>
                    <p className="font-medium">{employeeDetails.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Job Title</p>
                    <p className="font-medium">{employeeDetails.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Joined Date</p>
                    <p className="font-medium">{employeeDetails.joined}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Contact</p>
                    <p className="font-medium">{employeeDetails.contact}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Email</p>
                    <p className="font-medium">{employeeDetails.email}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-300">Address</p>
                    <p className="font-medium">{employeeDetails.address}</p>
                  </div>
                </div>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-4">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Attendance</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-300">This Month</p>
                    <p className="mt-1">
                      <span className="text-green-600">{employeeDetails.attendance.present} present</span>
                      <span className="mx-1 opacity-70">•</span>
                      <span className="text-red-600">{employeeDetails.attendance.absent} absent</span>
                      <span className="mx-1 opacity-70">•</span>
                      <span className="text-orange-500">{employeeDetails.attendance.leave} leave</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-4">
                  <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Overtime</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Hours</p>
                    <p className="mt-1">
                      This month:{" "}
                      <span className="text-orange-600">{employeeDetails.overtime.currentMonth}h</span>
                      <br />
                      Last month: {employeeDetails.overtime.lastMonth}h
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-4">
                  <div className="p-2 rounded-full bg-green-100 text-green-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Salary</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Current Month</p>
                    <p className="mt-1">
                      Basic: {employeeDetails.salary.basic}
                      <br />
                      Total: <span className="text-green-600">{employeeDetails.salary.total}</span>
                    </p>
                  </div>
                </div>
              </section>

              {/* Reports */}
              <section className="rounded-2xl border border-gray-200/70 dark:border-transparent bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-5">
                <h4 className="text-lg font-semibold mb-4">Available Reports</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Attendance Report", desc: "Monthly attendance summary", tone: "text-blue-600" },
                    { label: "Leave Report", desc: "Leave history and balance", tone: "text-orange-600" },
                    { label: "Overtime Report", desc: "Overtime hours and compensation", tone: "text-purple-600" },
                    { label: "Salary Report", desc: "Salary history and breakdown", tone: "text-green-600" },
                  ].map((r, i) => (
                    <button
                      key={i}
                      className="flex items-center gap-3 text-left w-full rounded-xl border border-gray-200/70 dark:border-transparent bg-gray-50 dark:bg-dark-gray hover:bg-gray-100 dark:hover:bg-gray-600 transition p-4"
                    >
                      <FileText className={`w-5 h-5 ${r.tone}`} />
                      <div>
                        <h5 className="font-medium">{r.label}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-300">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="h-full rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card shadow-card dark:shadow-cardDark p-10 flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">No Employee Selected</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select an employee from the list to view their detailed profile and generate reports.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
