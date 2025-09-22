import React from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Card from '../P-Card.jsx';
import Button from '../P-Button.jsx';
import { Plus, FileDown, AlertTriangle, Calendar, TrendingUp, Warehouse, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '../Loader/Loader.js';
import "../styles/theme.css";
import '../styles/P-Dashboard.css';

const Dashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  // Simulate loading delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Check theme for loader
  React.useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setDarkMode(isDark);
    };

    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });

    return () => observer.disconnect();
  }, []);

  // Sample data for cards
  const summaryData = [{
    id: 1,
    title: 'totalGreenhouses',
    value: 24,
    color: '#2E7D32',
    icon: <Warehouse size={24} />
  }, {
    id: 2,
    title: 'active',
    value: 18,
    color: '#66BB6A',
    icon: <CheckCircle size={24} />
  }, {
    id: 3,
    title: 'inactive',
    value: 4,
    color: '#FFA726',
    icon: <XCircle size={24} />
  }, {
    id: 4,
    title: 'maintenance',
    value: 2,
    color: '#EF5350',
    icon: <Wrench size={24} />
  }];

  // Sample data for charts
  const issueData = [{
    name: 'Pest',
    value: 35
  }, {
    name: 'Disease',
    value: 25
  }, {
    name: 'Equipment',
    value: 20
  }, {
    name: 'Environment',
    value: 15
  }, {
    name: 'Other',
    value: 5
  }];

  const yieldData = [{
    month: 'Jan',
    yield: 120
  }, {
    month: 'Feb',
    yield: 150
  }, {
    month: 'Mar',
    yield: 180
  }, {
    month: 'Apr',
    yield: 220
  }, {
    month: 'May',
    yield: 250
  }, {
    month: 'Jun',
    yield: 280
  }, {
    month: 'Jul',
    yield: 310
  }];

  const telemetryData = [{
    time: '00:00',
    temp: 22,
    humidity: 65
  }, {
    time: '04:00',
    temp: 21,
    humidity: 68
  }, {
    time: '08:00',
    temp: 23,
    humidity: 62
  }, {
    time: '12:00',
    temp: 26,
    humidity: 55
  }, {
    time: '16:00',
    temp: 25,
    humidity: 58
  }, {
    time: '20:00',
    temp: 23,
    humidity: 63
  }];

  // Sample data for active issues
  const activeIssues = [{
    id: 1,
    greenhouse: 'GH-05',
    issue: 'Pest Infestation',
    severity: 'High',
    date: '2023-07-12'
  }, {
    id: 2,
    greenhouse: 'GH-12',
    issue: 'Irrigation Failure',
    severity: 'Medium',
    date: '2023-07-13'
  }, {
    id: 3,
    greenhouse: 'GH-08',
    issue: 'Temperature Control',
    severity: 'Low',
    date: '2023-07-14'
  }];

  // Sample data for calendar events
  const calendarEvents = [{
    id: 1,
    title: 'Inspection: GH-03',
    date: '2023-07-15'
  }, {
    id: 2,
    title: 'Fertilizing: GH-07',
    date: '2023-07-16'
  }, {
    id: 3,
    title: 'Harvest: GH-12',
    date: '2023-07-18'
  }];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const getSeverityClass = severity => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  // Show loader while loading
  if (loading) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard')}</h1>
        <div className="dashboard-actions">
          <Button icon={<Plus size={16} />} onClick={() => console.log('Add Greenhouse')}>
            {t('addGreenhouse')}
          </Button>
          <Button variant="secondary" icon={<FileDown size={16} />} onClick={() => console.log('Export Reports')}>
            {t('exportReports')}
          </Button>
        </div>
      </div>

      <div className="summary-cards">
        {summaryData.map(item => (
          <Card key={item.id} className="summary-card" onClick={() => console.log(`Clicked ${t(item.title)}`)}>
            <div className="card-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="card-value" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="card-label">{t(item.title)}</div>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card title={t('activeIssues')} className="issues-card">
          <div className="issues-list">
            {activeIssues.map(issue => (
              <div key={issue.id} className="issue-item">
                <div className="issue-header">
                  <span className="issue-greenhouse">{issue.greenhouse}</span>
                  <span className={`issue-severity ${getSeverityClass(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
                <div className="issue-details">
                  <span className="issue-name">
                    <AlertTriangle size={14} />
                    {issue.issue}
                  </span>
                  <span className="issue-date">{issue.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('yieldForecast')} className="yield-card">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart 
              data={yieldData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#66BB6A" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="yield" 
                stroke="#2E7D32" 
                fillOpacity={1} 
                fill="url(#colorYield)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Calendar Events" className="calendar-card">
          <div className="calendar-widget">
            <div className="calendar-header">
              <Calendar size={18} />
              <span>July 2023</span>
            </div>
            <div className="events-list">
              {calendarEvents.map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-date">{event.date}</div>
                  <div className="event-title">{event.title}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Issues by Type" className="issues-chart-card">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={issueData} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                outerRadius={80} 
                fill="#8884d8" 
                dataKey="value" 
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {issueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Greenhouse Telemetry" className="telemetry-card">
          <div className="telemetry-header">
            <span>GH-05 (Selected)</span>
            <TrendingUp size={18} />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart 
              data={telemetryData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#EF5350" 
                activeDot={{ r: 8 }} 
                name="Temperature (°C)" 
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#29B6F6" 
                name="Humidity (%)" 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;