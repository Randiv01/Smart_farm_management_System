import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Card from '../P-Card.jsx';
import { Thermometer, Droplet, Sprout, Wind, Lightbulb, Waves, AlertTriangle, WifiOff, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '../Loader/Loader';
import '../styles/P-MonitorControl.css';
import "../styles/theme.css";

const MonitorControl = () => {
  const {
    t
  } = useLanguage();
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('GH-01');
  const [telemetryData, setTelemetryData] = useState({
    temperature: 25,
    humidity: 65,
    soilMoisture: 42,
    controls: {
      fan: {
        status: 'on',
        lastToggled: '2023-07-14 15:30'
      },
      lights: {
        status: 'off',
        lastToggled: '2023-07-14 18:00'
      },
      waterPump: {
        status: 'off',
        lastToggled: '2023-07-14 12:15'
      }
    }
  });
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([{
    id: 1,
    type: 'temperature',
    message: 'Temperature above threshold (30°C)',
    timestamp: '2023-07-14 14:23'
  }, {
    id: 2,
    type: 'connection',
    message: 'Connection lost to sensor node #3',
    timestamp: '2023-07-14 10:45'
  }, {
    id: 3,
    type: 'moisture',
    message: 'Soil moisture below threshold (30%)',
    timestamp: '2023-07-14 08:12'
  }]);
  const [loading, setLoading] = useState(true);
  
  // Sample greenhouse options
  const greenhouseOptions = [{
    id: 'GH-01',
    name: 'Greenhouse 1 - Tomato'
  }, {
    id: 'GH-02',
    name: 'Greenhouse 2 - Cucumber'
  }, {
    id: 'GH-03',
    name: 'Greenhouse 3 - Lettuce'
  }, {
    id: 'GH-04',
    name: 'Greenhouse 4 - Strawberry'
  }, {
    id: 'GH-05',
    name: 'Greenhouse 5 - Chili'
  }];
  
  // Generate mock historical data
  useEffect(() => {
    const generateHistoricalData = () => {
      setLoading(true);
      const data = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = now.getHours() - i;
        const formattedHour = `${hour < 0 ? 24 + hour : hour}:00`;
        data.push({
          time: formattedHour,
          temperature: Math.round((22 + Math.random() * 8) * 10) / 10,
          humidity: Math.round((55 + Math.random() * 20) * 10) / 10,
          soilMoisture: Math.round((35 + Math.random() * 25) * 10) / 10
        });
      }
      return data;
    };
    
    // Simulate data loading delay
    setTimeout(() => {
      setHistoricalData(generateHistoricalData());
      setLoading(false);
    }, 1000);
  }, [selectedGreenhouse]);
  
  // Simulate WebSocket connection for real-time updates
  useEffect(() => {
    if (selectedGreenhouse === 'GH-01') {
      const interval = setInterval(() => {
        setTelemetryData(prev => ({
          ...prev,
          temperature: Math.round((prev.temperature + (Math.random() - 0.5) * 0.5) * 10) / 10,
          humidity: Math.round((prev.humidity + (Math.random() - 0.5) * 1) * 10) / 10,
          soilMoisture: Math.round((prev.soilMoisture + (Math.random() - 0.5) * 0.8) * 10) / 10
        }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGreenhouse]);
  
  const handleGreenhouseChange = e => {
    setLoading(true);
    setSelectedGreenhouse(e.target.value);
    // Reset data for non-GH-01 greenhouses
    if (e.target.value !== 'GH-01') {
      setTelemetryData({
        temperature: null,
        humidity: null,
        soilMoisture: null,
        controls: {
          fan: {
            status: 'off',
            lastToggled: 'N/A'
          },
          lights: {
            status: 'off',
            lastToggled: 'N/A'
          },
          waterPump: {
            status: 'off',
            lastToggled: 'N/A'
          }
        }
      });
      setHistoricalData([]);
    } else {
      // Reset to default data for GH-01
      setTelemetryData({
        temperature: 25,
        humidity: 65,
        soilMoisture: 42,
        controls: {
          fan: {
            status: 'on',
            lastToggled: '2023-07-14 15:30'
          },
          lights: {
            status: 'off',
            lastToggled: '2023-07-14 18:00'
          },
          waterPump: {
            status: 'off',
            lastToggled: '2023-07-14 12:15'
          }
        }
      });
    }
    
    // Simulate loading delay when switching greenhouses
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };
  
  const toggleControl = control => {
    if (selectedGreenhouse !== 'GH-01') {
      alert('Control not available. Equipment not connected.');
      return;
    }
    setTelemetryData(prev => ({
      ...prev,
      controls: {
        ...prev.controls,
        [control]: {
          status: prev.controls[control].status === 'on' ? 'off' : 'on',
          lastToggled: new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', '')
        }
      }
    }));
  };
  
  const getGaugeColor = (value, type) => {
    if (type === 'temperature') {
      if (value < 18) return '#29B6F6'; // cold
      if (value > 28) return '#EF5350'; // hot
      return '#66BB6A'; // optimal
    } else if (type === 'humidity') {
      if (value < 40) return '#EF5350'; // dry
      if (value > 80) return '#29B6F6'; // wet
      return '#66BB6A'; // optimal
    } else if (type === 'soilMoisture') {
      if (value < 30) return '#EF5350'; // dry
      if (value > 70) return '#29B6F6'; // wet
      return '#66BB6A'; // optimal
    }
  };
  
  const getGaugeBorderColor = type => {
    if (type === 'temperature') return '#EF5350'; // red for temperature
    if (type === 'humidity') return '#29B6F6'; // blue for humidity
    return '#66BB6A'; // green for soil moisture
  };
  
  const getAlertIcon = type => {
    switch (type) {
      case 'temperature':
        return <Thermometer size={16} />;
      case 'humidity':
        return <Droplet size={16} />;
      case 'moisture':
        return <Sprout size={16} />;
      case 'connection':
        return <WifiOff size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };
  
  // Calculate the percentage for the gauge circle
  const calculateGaugePercentage = (value, min, max) => {
    if (value === null) return 0;
    const percentage = (value - min) / (max - min) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };
  
  // Calculate the stroke dash offset for the gauge
  const calculateStrokeDashOffset = percentage => {
    const circumference = 2 * Math.PI * 45; // 45 is the radius of the circle
    return circumference - percentage / 100 * circumference;
  };
  
  const renderEquipmentNotConnectedMessage = () => {
    if (selectedGreenhouse !== 'GH-01') {
      return <div className="not-connected-message">
          <AlertTriangle size={24} />
          <p>Equipment not connected for {selectedGreenhouse}. Limited data available.</p>
        </div>;
    }
    return null;
  };

  // Show loader while data is being loaded
  if (loading) {
    return <Loader darkMode={false} />;
  }
  
  return <div className="monitor-control">
      <div className="monitor-header">
        <h1>Monitor & Control</h1>
        <div className="greenhouse-selector">
          <label htmlFor="greenhouseSelect">Select Greenhouse:</label>
          <select id="greenhouseSelect" value={selectedGreenhouse} onChange={handleGreenhouseChange}>
            {greenhouseOptions.map(option => <option key={option.id} value={option.id}>
                {option.name}
              </option>)}
          </select>
        </div>
      </div>
      {renderEquipmentNotConnectedMessage()}
      <div className="gauges-container">
        <Card className="gauge-card">
          <div className="gauge-title">
            <Thermometer size={20} />
            <h3>Temperature</h3>
          </div>
          <div className="gauge">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              {/* Colored border */}
              <circle cx="60" cy="60" r="52" fill="none" stroke={getGaugeBorderColor('temperature')} strokeWidth="2" />
              {/* Value fill */}
              {telemetryData.temperature !== null && <circle cx="60" cy="60" r="45" fill="none" stroke={getGaugeColor(telemetryData.temperature, 'temperature')} strokeWidth="10" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.temperature, 10, 40))} strokeLinecap="round" transform="rotate(-90 60 60)" />}
              <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill={telemetryData.temperature !== null ? getGaugeColor(telemetryData.temperature, 'temperature') : '#999'}>
                {telemetryData.temperature !== null ? telemetryData.temperature : 'N/A'}
              </text>
              <text x="60" y="75" textAnchor="middle" fontSize="14" fill="currentColor">
                °C
              </text>
            </svg>
          </div>
        </Card>
        <Card className="gauge-card">
          <div className="gauge-title">
            <Droplet size={20} />
            <h3>Humidity</h3>
          </div>
          <div className="gauge">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              {/* Colored border */}
              <circle cx="60" cy="60" r="52" fill="none" stroke={getGaugeBorderColor('humidity')} strokeWidth="2" />
              {/* Value fill */}
              {telemetryData.humidity !== null && <circle cx="60" cy="60" r="45" fill="none" stroke={getGaugeColor(telemetryData.humidity, 'humidity')} strokeWidth="10" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.humidity, 0, 100))} strokeLinecap="round" transform="rotate(-90 60 60)" />}
              <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill={telemetryData.humidity !== null ? getGaugeColor(telemetryData.humidity, 'humidity') : '#999'}>
                {telemetryData.humidity !== null ? telemetryData.humidity : 'N/A'}
              </text>
              <text x="60" y="75" textAnchor="middle" fontSize="14" fill="currentColor">
                %
              </text>
            </svg>
          </div>
        </Card>
        <Card className="gauge-card">
          <div className="gauge-title">
            <Sprout size={20} />
            <h3>Soil Moisture</h3>
          </div>
          <div className="gauge">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              {/* Colored border */}
              <circle cx="60" cy="60" r="52" fill="none" stroke={getGaugeBorderColor('soilMoisture')} strokeWidth="2" />
              {/* Value fill */}
              {telemetryData.soilMoisture !== null && <circle cx="60" cy="60" r="45" fill="none" stroke={getGaugeColor(telemetryData.soilMoisture, 'soilMoisture')} strokeWidth="10" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.soilMoisture, 0, 100))} strokeLinecap="round" transform="rotate(-90 60 60)" />}
              <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" fill={telemetryData.soilMoisture !== null ? getGaugeColor(telemetryData.soilMoisture, 'soilMoisture') : '#999'}>
                {telemetryData.soilMoisture !== null ? telemetryData.soilMoisture : 'N/A'}
              </text>
              <text x="60" y="75" textAnchor="middle" fontSize="14" fill="currentColor">
                %
              </text>
            </svg>
          </div>
        </Card>
      </div>
      {selectedGreenhouse === 'GH-01' && <div className="charts-container">
          <Card className="chart-card">
            <h3>24-Hour History</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{
            top: 20,
            right: 30,
            left: 0,
            bottom: 10
          }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#EF5350" activeDot={{
              r: 8
            }} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#29B6F6" activeDot={{
              r: 8
            }} />
                <Line yAxisId="right" type="monotone" dataKey="soilMoisture" name="Soil Moisture (%)" stroke="#66BB6A" activeDot={{
              r: 8
            }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>}
      <div className="control-panel">
        <h3>Manual Control Panel</h3>
        <div className="controls">
          <div className="control-item">
            <div className="control-info">
              <Wind size={20} />
              <div className="control-details">
                <h4>Fan</h4>
                <p>Last toggled: {telemetryData.controls.fan.lastToggled}</p>
              </div>
            </div>
            <button className={`toggle-button ${telemetryData.controls.fan.status}`} onClick={() => toggleControl('fan')}>
              <span className="toggle-slider"></span>
              <span className="toggle-text">{telemetryData.controls.fan.status}</span>
            </button>
          </div>
          <div className="control-item">
            <div className="control-info">
              <Lightbulb size={20} />
              <div className="control-details">
                <h4>Lights</h4>
                <p>Last toggled: {telemetryData.controls.lights.lastToggled}</p>
              </div>
            </div>
            <button className={`toggle-button ${telemetryData.controls.lights.status}`} onClick={() => toggleControl('lights')}>
              <span className="toggle-slider"></span>
              <span className="toggle-text">{telemetryData.controls.lights.status}</span>
            </button>
          </div>
          <div className="control-item">
            <div className="control-info">
              <Waves size={20} />
              <div className="control-details">
                <h4>Water Pump</h4>
                <p>Last toggled: {telemetryData.controls.waterPump.lastToggled}</p>
              </div>
            </div>
            <button className={`toggle-button ${telemetryData.controls.waterPump.status}`} onClick={() => toggleControl('waterPump')}>
              <span className="toggle-slider"></span>
              <span className="toggle-text">{telemetryData.controls.waterPump.status}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="control-alerts-container">
        <Card className="alerts-panel">
          <div className="alerts-header">
            <h3>Alerts & Notifications</h3>
            <span className="alert-count">{selectedGreenhouse === 'GH-01' ? alerts.length : 0}</span>
          </div>
          {selectedGreenhouse === 'GH-01' ? <div className="alerts-list">
              {alerts.map(alert => <div key={alert.id} className="alert-item">
                  <div className="alert-icon">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="alert-content">
                    <p className="alert-message">{alert.message}</p>
                    <p className="alert-timestamp">{alert.timestamp}</p>
                  </div>
                </div>)}
              <div className="connection-status">
                <div className="status-indicator connected"></div>
                <span>WebSocket Connected</span>
              </div>
            </div> : <div className="no-alerts-message">
              <WifiOff size={24} />
              <p>No alerts available. Equipment not connected.</p>
              <div className="connection-status">
                <div className="status-indicator disconnected"></div>
                <span>WebSocket Disconnected</span>
              </div>
            </div>}
        </Card>
      </div>
    </div>;
};

export default MonitorControl;