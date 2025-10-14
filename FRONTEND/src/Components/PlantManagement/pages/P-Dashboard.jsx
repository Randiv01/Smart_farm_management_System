import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Card from '../P-Card.jsx';
import Button from '../P-Button.jsx';
import { AlertTriangle, TrendingUp, Warehouse, CheckCircle, XCircle, Wrench } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '../Loader/Loader.js';
import axios from 'axios';

const Dashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('GH-01');
  const [telemetryData, setTelemetryData] = useState([]);
  const [validGreenhouses, setValidGreenhouses] = useState([]);

  // Check theme for loader
  useEffect(() => {
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

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/dashboard');
        if (response.data.success) {
          setDashboardData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch valid greenhouses
  useEffect(() => {
    const fetchValidGreenhouses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/greenhouses');
        if (response.data.success) {
          setValidGreenhouses(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching greenhouses:', error);
        // Fallback to default greenhouses if API fails
        setValidGreenhouses([
          { _id: '1', greenhouseName: 'GH-01' },
          { _id: '2', greenhouseName: 'GH-02' },
          { _id: '3', greenhouseName: 'GH-03' },
          { _id: '4', greenhouseName: 'GH-04' },
          { _id: '5', greenhouseName: 'GH-05' }
        ]);
      }
    };

    fetchValidGreenhouses();
  }, []);

  // Fetch telemetry data for selected greenhouse
  useEffect(() => {
    const fetchTelemetryData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/telemetry/${selectedGreenhouse}`);
        if (response.data.success) {
          // Generate mock historical data for chart
          const now = new Date();
          const historicalData = [];
          for (let i = 11; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 2 * 60 * 60 * 1000); // Every 2 hours
            historicalData.push({
              time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              temp: response.data.data.temperature + (Math.random() - 0.5) * 4,
              humidity: response.data.data.humidity + (Math.random() - 0.5) * 10
            });
          }
          setTelemetryData(historicalData);
        }
      } catch (error) {
        console.error('Error fetching telemetry data:', error);
        // Set empty data for non-GH-01 greenhouses
        setTelemetryData([]);
      }
    };

    fetchTelemetryData();
  }, [selectedGreenhouse]);

  // Prepare summary data
  const summaryData = dashboardData ? [{
    id: 1,
    title: 'totalGreenhouses',
    value: dashboardData.summary.totalGreenhouses,
    color: '#2E7D32',
    icon: <Warehouse size={24} />
  }, {
    id: 2,
    title: 'active',
    value: dashboardData.summary.activeGreenhouses,
    color: '#66BB6A',
    icon: <CheckCircle size={24} />
  }, {
    id: 3,
    title: 'inactive',
    value: dashboardData.summary.inactiveGreenhouses,
    color: '#FFA726',
    icon: <XCircle size={24} />
  }, {
    id: 4,
    title: 'maintenance',
    value: dashboardData.summary.maintenanceGreenhouses,
    color: '#EF5350',
    icon: <Wrench size={24} />
  }] : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const getSeverityClass = severity => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200';
      case 'low':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Show loader while loading
  if (loading) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryData.map(item => (
          <Card 
            key={item.id} 
            className="text-center p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
            onClick={() => console.log(`Clicked ${t(item.title)}`)}
          >
            <div className="flex justify-center mb-2" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="text-3xl font-bold mb-2" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t(item.title)}
            </div>
          </Card>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Issues */}
        <Card title={t('activeIssues')} className="h-full">
          <div className="flex flex-col gap-3">
            {dashboardData?.activeIssues?.length > 0 ? (
              dashboardData.activeIssues.map(issue => (
                <div key={issue._id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{issue.tunnel}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityClass('medium')}`}>
                      Issue
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                      <AlertTriangle size={14} />
                      {issue.notes || 'Inspection Issue'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(issue.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No active issues
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Yield Chart */}
        <Card title="Monthly Yield" className="h-full">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart 
              data={dashboardData?.yieldData || []} 
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

        {/* Fertilizer Frequency by Greenhouse */}
        <Card title="Fertilizer Frequency by Greenhouse" className="h-full">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData?.fertilizerFrequencyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="greenhouseNo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequency" fill="#2E7D32"/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Issues by Type */}
        <Card title="Issues by Type" className="h-full">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={dashboardData?.issueData || []} 
                cx="50%" 
                cy="50%" 
                labelLine={false} 
                outerRadius={80} 
                fill="#8884d8" 
                dataKey="value" 
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(dashboardData?.issueData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Greenhouse Telemetry */}
        <Card title="Greenhouse Telemetry" className="h-full xl:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-900 dark:text-white">Select Greenhouse:</span>
              <select 
                value={selectedGreenhouse} 
                onChange={(e) => setSelectedGreenhouse(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {validGreenhouses.map((greenhouse) => (
                  <option key={greenhouse._id} value={greenhouse.greenhouseName}>
                    {greenhouse.greenhouseName} {greenhouse.greenhouseName === 'GH-01' ? '(Real Data)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <TrendingUp size={18} className="text-gray-600 dark:text-gray-400" />
          </div>
          {selectedGreenhouse === 'GH-01' && telemetryData.length > 0 ? (
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
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {selectedGreenhouse === 'GH-01' ? 'Loading telemetry data...' : 'Telemetry data only available for GH-01'}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;