import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Button from '../P-Button.jsx';
import Modal from '../P-Modal.jsx';
import { Plus, FileDown, Edit, Trash, Check, Download, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/P-PestDiseaseManagement.css';
import "../styles/theme.css";

const PestDiseaseManagement = () => {
  const {
    t
  } = useLanguage();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  // Sample data for pest/disease issues
  const issueRecords = [{
    id: 1,
    greenhouseNo: 'GH-01',
    date: '2023-07-10',
    issueType: 'Fungus',
    description: 'White powdery mildew on leaves'
  }, {
    id: 2,
    greenhouseNo: 'GH-03',
    date: '2023-07-12',
    issueType: 'Insect',
    description: 'Aphid infestation on new growth'
  }, {
    id: 3,
    greenhouseNo: 'GH-02',
    date: '2023-07-15',
    issueType: 'Virus',
    description: 'Mosaic pattern on tomato leaves'
  }, {
    id: 4,
    greenhouseNo: 'GH-05',
    date: '2023-07-18',
    issueType: 'Other',
    description: 'Nutrient deficiency symptoms'
  }, {
    id: 5,
    greenhouseNo: 'GH-04',
    date: '2023-07-20',
    issueType: 'Fungus',
    description: 'Root rot in cucumber plants'
  }];
  // Sample data for specialist consultation
  const specialistRecords = [{
    id: 1,
    specialistName: 'Dr. Jane Smith',
    dateAssigned: '2023-07-11',
    greenhouseNo: 'GH-01',
    treatedIssue: 'Fungus - White powdery mildew',
    status: 'Resolved'
  }, {
    id: 2,
    specialistName: 'Dr. Mike Johnson',
    dateAssigned: '2023-07-13',
    greenhouseNo: 'GH-03',
    treatedIssue: 'Insect - Aphid infestation',
    status: 'In Progress'
  }, {
    id: 3,
    specialistName: 'Dr. Sarah Williams',
    dateAssigned: '2023-07-16',
    greenhouseNo: 'GH-02',
    treatedIssue: 'Virus - Mosaic pattern',
    status: 'Assigned'
  }, {
    id: 4,
    specialistName: 'Dr. David Brown',
    dateAssigned: '2023-07-19',
    greenhouseNo: 'GH-05',
    treatedIssue: 'Other - Nutrient deficiency',
    status: 'Resolved'
  }];
  // Sample data for charts
  const issueTypeData = [{
    name: 'Fungus',
    value: 2
  }, {
    name: 'Insect',
    value: 1
  }, {
    name: 'Virus',
    value: 1
  }, {
    name: 'Other',
    value: 1
  }];
  const issuesByGreenhouseData = [{
    greenhouseNo: 'GH-01',
    count: 1
  }, {
    greenhouseNo: 'GH-02',
    count: 1
  }, {
    greenhouseNo: 'GH-03',
    count: 1
  }, {
    greenhouseNo: 'GH-04',
    count: 1
  }, {
    greenhouseNo: 'GH-05',
    count: 1
  }];
  const COLORS = ['#EF5350', '#FFA726', '#29B6F6', '#66BB6A'];
  const getStatusClass = status => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'status-resolved';
      case 'in progress':
        return 'status-progress';
      case 'assigned':
        return 'status-assigned';
      default:
        return '';
    }
  };
  return <div className="pest-disease-management">
      <div className="pest-disease-header">
        <h1>Pest & Disease Management</h1>
        <div className="header-actions">
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => console.log('Export Reports')}>
            Pest & Disease Report
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => setShowIssueModal(true)}>
            Add Issue
          </Button>
        </div>
      </div>
      <div className="charts-section">
        <div className="chart-container">
          <h3>Issues by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={issueTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
              name,
              percent
            }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {issueTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3>Issues by Greenhouse</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={issuesByGreenhouseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="greenhouseNo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#EF5350" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="issues-table-container">
        <div className="table-header">
          <h2>Pest & Disease Issues</h2>
          <div className="table-actions">
            <Button variant="secondary" size="small" icon={<FileDown size={14} />} onClick={() => console.log('Export Issues')}>
              Export CSV
            </Button>
            <Button size="small" icon={<Download size={14} />} onClick={() => console.log('Download PDF Report')}>
              PDF Report
            </Button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="issues-table">
            <thead>
              <tr>
                <th>Greenhouse No</th>
                <th>Date</th>
                <th>Issue Type</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issueRecords.map(record => <tr key={record.id}>
                  <td>{record.greenhouseNo}</td>
                  <td>{record.date}</td>
                  <td>{record.issueType}</td>
                  <td>{record.description}</td>
                  <td className="action-buttons">
                    <button className="action-button edit" onClick={() => console.log('Edit issue', record.id)}>
                      <Edit size={16} />
                    </button>
                    <button className="action-button delete" onClick={() => console.log('Delete issue', record.id)}>
                      <Trash size={16} />
                    </button>
                    <button className="action-button assign" onClick={() => setShowSpecialistModal(true)}>
                      <UserPlus size={16} />
                    </button>
                    <button className="action-button download" onClick={() => console.log('Download PDF', record.id)}>
                      <Download size={16} />
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="specialist-section">
        <div className="section-header">
          <h2>Specialist Consultation Log</h2>
          <div className="section-actions">
            <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => console.log('Export Specialist Log')}>
              Specialist Report
            </Button>
            <Button icon={<UserPlus size={16} />} onClick={() => setShowSpecialistModal(true)}>
              Assign Specialist
            </Button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="specialist-table">
            <thead>
              <tr>
                <th>Specialist Name</th>
                <th>Date Assigned</th>
                <th>Greenhouse No</th>
                <th>Treated Issue</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {specialistRecords.map(record => <tr key={record.id}>
                  <td>{record.specialistName}</td>
                  <td>{record.dateAssigned}</td>
                  <td>{record.greenhouseNo}</td>
                  <td>{record.treatedIssue}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <button className="action-button edit" onClick={() => console.log('Edit assignment', record.id)}>
                      <Edit size={16} />
                    </button>
                    <button className="action-button delete" onClick={() => console.log('Delete assignment', record.id)}>
                      <Trash size={16} />
                    </button>
                    <button className="action-button download" onClick={() => console.log('Download Report', record.id)}>
                      <Download size={16} />
                    </button>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
      {showIssueModal && <Modal title="Add Pest & Disease Issue" onClose={() => setShowIssueModal(false)}>
          <form className="add-issue-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="greenhouseNo">Greenhouse No</label>
                <input type="text" id="greenhouseNo" name="greenhouseNo" required />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input type="date" id="date" name="date" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="issueType">Issue Type</label>
              <select id="issueType" name="issueType" required>
                <option value="">Select Type</option>
                <option value="Fungus">Fungus</option>
                <option value="Insect">Insect</option>
                <option value="Virus">Virus</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="4" required></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="issueImage">Upload Image (Optional)</label>
              <div className="file-input">
                <input type="file" id="issueImage" name="issueImage" accept="image/*" />
                <label htmlFor="issueImage">Choose File</label>
              </div>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowIssueModal(false)}>
                Cancel
              </Button>
              <Button type="submit" icon={<Check size={16} />} onClick={e => {
            e.preventDefault();
            console.log('Form submitted');
            setShowIssueModal(false);
          }}>
                Submit
              </Button>
            </div>
          </form>
        </Modal>}
      {showSpecialistModal && <Modal title="Assign Specialist" onClose={() => setShowSpecialistModal(false)}>
          <form className="assign-specialist-form">
            <div className="form-group">
              <label htmlFor="specialistName">Specialist Name</label>
              <input type="text" id="specialistName" name="specialistName" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateAssigned">Date Assigned</label>
                <input type="date" id="dateAssigned" name="dateAssigned" required />
              </div>
              <div className="form-group">
                <label htmlFor="assignGreenhouseNo">Greenhouse No</label>
                <select id="assignGreenhouseNo" name="assignGreenhouseNo" required>
                  <option value="">Select Greenhouse</option>
                  <option value="GH-01">GH-01</option>
                  <option value="GH-02">GH-02</option>
                  <option value="GH-03">GH-03</option>
                  <option value="GH-04">GH-04</option>
                  <option value="GH-05">GH-05</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="treatedIssue">Issue to Treat</label>
              <select id="treatedIssue" name="treatedIssue" required>
                <option value="">Select Issue</option>
                <option value="Fungus - White powdery mildew">Fungus - White powdery mildew</option>
                <option value="Insect - Aphid infestation">Insect - Aphid infestation</option>
                <option value="Virus - Mosaic pattern">Virus - Mosaic pattern</option>
                <option value="Other - Nutrient deficiency">Other - Nutrient deficiency</option>
                <option value="Fungus - Root rot">Fungus - Root rot</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" required>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowSpecialistModal(false)}>
                Cancel
              </Button>
              <Button type="submit" icon={<Check size={16} />} onClick={e => {
            e.preventDefault();
            console.log('Form submitted');
            setShowSpecialistModal(false);
          }}>
                Submit
              </Button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default PestDiseaseManagement;