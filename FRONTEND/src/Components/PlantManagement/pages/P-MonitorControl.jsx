import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import Card from '../P-Card.jsx';
import { Thermometer, Droplet, Sprout, Wind, Lightbulb, Waves, AlertTriangle, Bell, Clock, Wifi, RefreshCw, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Loader from '../Loader/Loader';
import axios from 'axios';
import esp32WebSocketService from "../../../utils/esp32WebSocketService";

  // Backend base URL: force HTTP for local backend (port 5000 has no TLS)
  const API_BASE = `http://localhost:5000`;

const MonitorControl = () => {
  // const { t } = useLanguage(); // Unused for now
  const [selectedGreenhouse, setSelectedGreenhouse] = useState('GH-01');
  const [validGreenhouses, setValidGreenhouses] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const fetchInFlight = useRef(false);
  const [customIP, setCustomIP] = useState('');
  const [isConnectingToCustomIP, setIsConnectingToCustomIP] = useState(false);
  const [telemetryData, setTelemetryData] = useState({
    temperature: 25,
    humidity: 65,
    soilMoisture: 1500,
    ipAddress: '172.20.10.2',
    signalStrength: -55,
    connectedSSID: 'Danuz',
    webSocketClients: 0,
    dhtSensorWorking: true,
    controls: {
      fan: { status: 'off', lastToggled: null, timer: null },
      lights: { status: 'off', lastToggled: null, timer: null },
      waterPump: { status: 'off', lastToggled: null, timer: null },
      heater: { status: 'off', lastToggled: null, timer: null }
    }
  });
  const [timerSettings, setTimerSettings] = useState({
    fan: { hours: 0, minutes: 0, active: false },
    lights: { hours: 0, minutes: 0, active: false },
    waterPump: { hours: 0, minutes: 0, active: false },
    heater: { hours: 0, minutes: 0, active: false }
  });
  
  const pollingIntervalRef = useRef(null);
  const retryCountRef = useRef(0);
  
  // ESP32 WebSocket service integration
  // const [esp32ConnectionStatus, setESP32ConnectionStatus] = useState('disconnected'); // Unused for now
  const [esp32CurrentIP, setESP32CurrentIP] = useState(null);

  // Normalize and apply ESP32 data to UI state
  const handleESP32Data = (data) => {
    try {
      const temperature = data?.temperature ?? null;
      const humidity = data?.humidity ?? null;
      const dhtSensorWorking = data?.dhtSensorWorking ?? false;

      setTelemetryData((prev) => ({
        ...prev,
        temperature,
        humidity,
        soilMoisture: data?.soilMoisture ?? prev.soilMoisture ?? 1500,
        ipAddress: data?.ipAddress ?? prev.ipAddress ?? '172.20.10.2',
        signalStrength: data?.signalStrength ?? prev.signalStrength ?? -55,
        connectedSSID: data?.connectedSSID ?? prev.connectedSSID ?? 'Danuz',
        webSocketClients: data?.webSocketClients ?? prev.webSocketClients ?? 0,
        dhtSensorWorking,
        controls: {
          ...prev.controls,
          fan: { ...prev.controls.fan, status: data?.fanState ? 'on' : 'off' },
          lights: { ...prev.controls.lights, status: data?.lightState ? 'on' : 'off' },
          waterPump: { ...prev.controls.waterPump, status: data?.pumpState ? 'on' : 'off' },
          heater: { ...prev.controls.heater, status: data?.heaterState ? 'on' : 'off' }
        }
      }));

      setAutoMode(data?.autoMode !== undefined ? data.autoMode : true);

      // Historical data update only if sensors valid
      if (dhtSensorWorking && temperature !== null && humidity !== null) {
        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        setHistoricalData((prev) => {
          const newData = [...prev, {
            time: timeString,
            temperature,
            humidity,
            soilMoisture: data?.soilMoisture
          }];
          return newData.slice(-50);
        });
      }

      // Alerts
      checkAlerts(data, dhtSensorWorking, temperature, humidity);
    } catch (err) {
      console.error('handleESP32Data error:', err);
    }
  };

  // Fetch valid greenhouses on component mount
  useEffect(() => {
    const fetchValidGreenhouses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/greenhouses');
        // Handle both response formats: {success: true, data: [...]} or direct array
        const greenhousesData = response.data.success ? response.data.data : response.data;
        setValidGreenhouses(greenhousesData);
      } catch (error) {
        console.error('Error fetching valid greenhouses:', error);
      }
    };

    fetchValidGreenhouses();
  }, []);

  // Test connection function
  const testConnection = async () => {
    try {
      // Use backend proxy health which discovers active ESP32
      const targetIP = (customIP && customIP.trim()) || telemetryData.ipAddress || '172.20.10.2';
      const url = `${API_BASE}/health?ip=${encodeURIComponent(targetIP)}`;
      
      console.log(`🔗 Testing connection to: ${url}`);
      
      // Create an AbortController for timeout (allow proxy to probe ESP32)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 13000); // 13 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  };

  // ESP32 WebSocket service connection management
  const connectESP32WebSocket = useCallback(() => {
    console.log('🔄 Starting ESP32 WebSocket connection...');
    console.log('📊 Current greenhouse:', selectedGreenhouse);
    console.log('📊 WebSocket service status:', esp32WebSocketService.getConnectionStatus());
    
    // Check if already connected
    if (esp32WebSocketService.getConnectionStatus() === 'connected') {
      console.log('✅ ESP32 WebSocket already connected');
      setConnectionStatus('connected');
      setLoading(false);
      return;
    }

    setConnectionStatus('connecting');
    setLoading(true);
    
    // Add a timeout to fallback to HTTP polling if WebSocket doesn't connect quickly
    const webSocketTimeout = setTimeout(() => {
      console.log('⏰ WebSocket connection timeout, falling back to HTTP polling...');
      startPolling();
    }, 3000); // 3 second timeout

    // Define event handlers
    const handleConnected = (data) => {
      console.log('✅ ESP32 WebSocket connected:', data);
      clearTimeout(webSocketTimeout); // Clear the timeout since we connected successfully
      setESP32CurrentIP(data.ip);
      setConnectionStatus('connected');
      setLoading(false);
    };

    const handleDisconnected = () => {
      console.log('❌ ESP32 WebSocket disconnected');
      setESP32CurrentIP(null);
      setConnectionStatus('disconnected');
      setLoading(false);
    };

    const handleConnecting = () => {
      console.log('🔄 ESP32 WebSocket connecting...');
      setConnectionStatus('connecting');
    };

    const handleData = (data) => {
      console.log('📊 ESP32 data received:', data);
      handleESP32Data(data);
    };

    const handleError = (error) => {
      console.error('❌ ESP32 WebSocket error:', error);
      clearTimeout(webSocketTimeout); // Clear the timeout since we're handling the error
      setConnectionStatus('disconnected');
      setLoading(false);
      
      // Fallback to HTTP polling after WebSocket failure
      console.log('🔄 Falling back to HTTP polling...');
      startPolling();
    };

    // Set up event listeners
    esp32WebSocketService.on('connected', handleConnected);
    esp32WebSocketService.on('disconnected', handleDisconnected);
    esp32WebSocketService.on('connecting', handleConnecting);
    esp32WebSocketService.on('data', handleData);
    esp32WebSocketService.on('error', handleError);

    // Store handlers for cleanup
    esp32WebSocketService._componentHandlers = {
      connected: handleConnected,
      disconnected: handleDisconnected,
      connecting: handleConnecting,
      data: handleData,
      error: handleError
    };

    // Register this component and connect to ESP32
    esp32WebSocketService.registerComponent();
    esp32WebSocketService.connect();
  }, []);

  const disconnectESP32WebSocket = () => {
    console.log('🔌 Disconnecting ESP32 WebSocket...');
    
    // Clean up event listeners if they exist
    if (esp32WebSocketService._componentHandlers) {
      esp32WebSocketService.off('connected', esp32WebSocketService._componentHandlers.connected);
      esp32WebSocketService.off('disconnected', esp32WebSocketService._componentHandlers.disconnected);
      esp32WebSocketService.off('connecting', esp32WebSocketService._componentHandlers.connecting);
      esp32WebSocketService.off('data', esp32WebSocketService._componentHandlers.data);
      esp32WebSocketService.off('error', esp32WebSocketService._componentHandlers.error);
      esp32WebSocketService._componentHandlers = null;
    }
    
    // Unregister this component instead of disconnecting
    esp32WebSocketService.unregisterComponent();
    setESP32CurrentIP(null);
  };

  // Improved HTTP Polling implementation (fallback)
  const startPolling = async () => {
    const isRealGreenhouse = selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01';
    console.log('🔄 startPolling called:', { selectedGreenhouse, isRealGreenhouse });
    
    if (!isRealGreenhouse) {
      console.log('❌ Not a real greenhouse, setting disconnected');
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    console.log('🔄 Starting HTTP polling to ESP32 (fallback mode)');
    setConnectionStatus('connecting');
    setLoading(true);
    
    retryCountRef.current = 0;

    // Test connection first
    console.log('🧪 Testing ESP32 connectivity...');
    const isReachable = await testConnection();
    if (!isReachable) {
      console.log('❌ ESP32 not reachable via HTTP');
      handleFetchError();
      return;
    }

    console.log('✅ ESP32 is reachable via HTTP, starting data polling...');
    // Fetch data immediately
    fetchDataWithRetry();

    // Set up polling every 2 seconds (as requested)
    pollingIntervalRef.current = setInterval(() => {
      console.log('🔄 HTTP polling interval tick...');
      fetchDataWithRetry();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setConnectionStatus('disconnected');
    setLoading(false);
  };

  const fetchDataWithRetry = async () => {
    try {
      await fetchData();
      retryCountRef.current = 0;
    } catch (error) {
      console.error('❌ Fetch failed, scheduling retry:', error.message);
      handleFetchError();
    }
  };

  const handleFetchError = () => {
    retryCountRef.current += 1;
    const maxRetries = 2;
    
    if (retryCountRef.current > maxRetries) {
      console.log('❌ Max retries reached, stopping polling');
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 3000);
    
    console.log(`🔁 Retrying in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
    
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      fetchDataWithRetry();
    }, retryDelay);
  };

  const fetchData = async () => {
    if (fetchInFlight.current) {
      return; // Prevent overlapping polls
    }
    fetchInFlight.current = true;
    try {
      console.log('📡 Fetching data from ESP32 (via backend proxy)...');
      
      // Use backend proxy status with direct IP to avoid discovery delays
      const targetIP = (customIP && customIP.trim()) || telemetryData.ipAddress || '172.20.10.2';
      const url = `${API_BASE}/status?ip=${encodeURIComponent(targetIP)}&_t=${Date.now()}`;
      
      console.log(`🔗 Fetching from: ${url}`);
      
      // Create an AbortController for timeout (allow proxy to probe ESP32)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 13000); // 13 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payload = await response.json();
      const data = payload && payload.success && payload.data ? payload.data : payload; // unwrap proxy response
      console.log('✅ Data received successfully:', data);
      
      handleESP32Data(data);
      setConnectionStatus('connected');
      setLoading(false);
    const temperature = data.temperature !== null && data.temperature !== undefined ? data.temperature : null;
    const humidity = data.humidity !== null && data.humidity !== undefined ? data.humidity : null;
    const dhtSensorWorking = data.dhtSensorWorking !== undefined ? data.dhtSensorWorking : false;

    console.log('Sensor data received:', {
      temperature,
      humidity,
      dhtSensorWorking,
      soilMoisture: data.soilMoisture
    });

    setTelemetryData(prev => ({
      ...prev,
      temperature: temperature,
      humidity: humidity,
      soilMoisture: data.soilMoisture || 1500,
      ipAddress: data.ipAddress || '172.20.10.2',
      signalStrength: data.signalStrength || -55,
      connectedSSID: data.connectedSSID || 'Danuz',
      webSocketClients: data.webSocketClients || 0,
      dhtSensorWorking: dhtSensorWorking,
      controls: {
        ...prev.controls,
        fan: { ...prev.controls.fan, status: data.fanState ? 'on' : 'off' },
        lights: { ...prev.controls.lights, status: data.lightState ? 'on' : 'off' },
        waterPump: { ...prev.controls.waterPump, status: data.pumpState ? 'on' : 'off' },
        heater: { ...prev.controls.heater, status: data.heaterState ? 'on' : 'off' }
      }
    }));

    // Update auto mode
    setAutoMode(data.autoMode !== undefined ? data.autoMode : true);

    // Only add to historical data if sensors are working and have valid values
    if (dhtSensorWorking && temperature !== null && humidity !== null) {
      const now = new Date();
      const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      setHistoricalData(prev => {
        const newData = [...prev, {
          time: timeString,
          temperature: temperature,
          humidity: humidity,
          soilMoisture: data.soilMoisture
        }];
        
        return newData.slice(-50);
      });
    }

    // Check for alerts
    checkAlerts(data, dhtSensorWorking, temperature, humidity);
    } catch (error) {
      console.error('❌ Fetch error details:', error);
      if (error.name === 'AbortError') {
        console.warn('⏱️ Fetch aborted due to timeout');
      }
      throw error;
    } finally {
      fetchInFlight.current = false;
    }
  };

  const checkAlerts = (data, dhtSensorWorking, temperature, humidity) => {
    const newAlerts = [];
    const now = new Date().toLocaleString();

    // DHT Sensor alerts
    if (!dhtSensorWorking) {
      newAlerts.push({
        id: Date.now(),
        type: 'temperature',
        message: 'DHT22 Sensor Not Working - Check wiring and connections',
        timestamp: now
      });
    } else {
      // Temperature alerts (only if sensor is working)
      if (temperature > 30) {
        newAlerts.push({
          id: Date.now() + 1,
          type: 'temperature',
          message: `Temperature above threshold (${temperature}°C)`,
          timestamp: now
        });
      } else if (temperature < 15) {
        newAlerts.push({
          id: Date.now() + 2,
          type: 'temperature',
          message: `Temperature below threshold (${temperature}°C)`,
          timestamp: now
        });
      }

      // Humidity alerts (only if sensor is working)
      if (humidity < 40) {
        newAlerts.push({
          id: Date.now() + 3,
          type: 'humidity',
          message: `Humidity below threshold (${humidity}%)`,
          timestamp: now
        });
      } else if (humidity > 80) {
        newAlerts.push({
          id: Date.now() + 4,
          type: 'humidity',
          message: `Humidity above threshold (${humidity}%)`,
          timestamp: now
        });
      }
    }

    // Soil moisture alerts (always works)
    if (data.soilMoisture > 2000) {
      newAlerts.push({
        id: Date.now() + 5,
        type: 'moisture',
        message: `Soil moisture critical (${data.soilMoisture}) - Needs watering`,
        timestamp: now
      });
    } else if (data.soilMoisture < 1000) {
      newAlerts.push({
        id: Date.now() + 6,
        type: 'moisture',
        message: `Soil moisture too wet (${data.soilMoisture})`,
        timestamp: now
      });
    }

    setAlerts(prev => {
      const allAlerts = [...newAlerts, ...prev];
      const uniqueAlerts = allAlerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.id === alert.id)
      );
      return uniqueAlerts.slice(-10);
    });
  };

  // Control commands via ESP32 WebSocket service or HTTP
  const sendControlCommand = async (device, action, duration = null) => {
    const isRealGreenhouse = selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01';
    if (!isRealGreenhouse) {
      alert('Control not available. Equipment not connected.');
      return;
    }

    console.log(`🎮 Sending control command: ${device} ${action}${duration ? ` for ${duration} minutes` : ''}`);

    // Try ESP32 WebSocket service first if connected
    if (esp32WebSocketService.getConnectionStatus() === 'connected') {
      const success = esp32WebSocketService.sendControlCommand(device, action, duration);
      
      if (success) {
        console.log(`✅ ESP32 WebSocket control command sent: ${device} ${action}`);
        
        const now = new Date().toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setTelemetryData(prev => ({
          ...prev,
          controls: {
            ...prev.controls,
            [device]: {
              ...prev.controls[device],
              status: action === 'on' ? 'on' : 'off',
              lastToggled: now,
              timer: duration
            }
          }
        }));

        return;
      } else {
        console.warn('⚠️ ESP32 WebSocket command failed, falling back to HTTP');
      }
    }

    // Fallback to HTTP if WebSocket not available
    try {
      const response = await fetch(`${API_BASE}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device: device,
          action: action,
          duration: duration
        })
      });
      
      if (response.ok) {
        console.log(`✅ HTTP control command sent: ${device} ${action}`);
        
        const now = new Date().toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setTelemetryData(prev => ({
          ...prev,
          controls: {
            ...prev.controls,
            [device]: {
              ...prev.controls[device],
              status: action === 'on' ? 'on' : 'off',
              lastToggled: now,
              timer: duration
            }
          }
        }));

        // Refresh data after control command
        setTimeout(fetchData, 1000);
      } else {
        throw new Error(`Control command failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ HTTP control command error:', error);
      alert(`Failed to send control command: ${error.message}`);
    }
  };

  const toggleControl = (device) => {
    // Lights can be controlled in both auto and manual modes
    if (device === 'lights') {
      const currentStatus = telemetryData.controls[device].status;
      const newStatus = currentStatus === 'on' ? 'off' : 'on';
      sendControlCommand(device, newStatus);
      return;
    }

    // For other devices (fan, waterPump, heater), only allow control in manual mode
    if (autoMode) {
      alert(`Cannot manually control ${device} in Auto Mode. Switch to Manual Mode first.`);
      return;
    }

    const currentStatus = telemetryData.controls[device].status;
    const newStatus = currentStatus === 'on' ? 'off' : 'on';
    
    sendControlCommand(device, newStatus);
  };

  const setTimer = (device, hours, minutes) => {
    // Lights can have timer in both modes
    if (device !== 'lights' && autoMode) {
      alert(`Cannot set timer for ${device} in Auto Mode. Switch to Manual Mode first.`);
      return;
    }

    if (hours === 0 && minutes === 0) {
      setTimerSettings(prev => ({
        ...prev,
        [device]: { ...prev[device], active: false }
      }));
      sendControlCommand(device, 'off');
      return;
    }

    const totalMinutes = (hours * 60) + minutes;
    setTimerSettings(prev => ({
      ...prev,
      [device]: { hours, minutes, active: true }
    }));

    sendControlCommand(device, 'on', totalMinutes);
  };

  const toggleAutoMode = async () => {
    const isRealGreenhouse = selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01';
    if (!isRealGreenhouse) {
      alert('Auto mode not available. Equipment not connected.');
      return;
    }

    const newMode = !autoMode;
    setAutoMode(newMode);
    
    console.log(`🔄 Toggling mode to: ${newMode ? 'AUTO' : 'MANUAL'}`);
    
    // Try ESP32 WebSocket service first if connected
    if (esp32WebSocketService.getConnectionStatus() === 'connected') {
      const success = esp32WebSocketService.sendModeCommand(newMode ? 'auto' : 'manual');
      
      if (success) {
        console.log(`✅ ESP32 WebSocket mode changed to: ${newMode ? 'AUTO' : 'MANUAL'}`);
        return;
      } else {
        console.warn('⚠️ ESP32 WebSocket mode command failed, falling back to HTTP');
      }
    }

    // Fallback to HTTP if WebSocket not available
    try {
      const response = await fetch(`${API_BASE}/toggleMode`);
      if (response.ok) {
        console.log(`✅ HTTP mode changed to: ${newMode ? 'AUTO' : 'MANUAL'}`);
        setTimeout(fetchData, 1000);
      } else {
        throw new Error('Mode toggle failed');
      }
    } catch (error) {
      console.error('❌ HTTP mode toggle error:', error);
      setAutoMode(!newMode);
      alert('Failed to toggle mode. Please try again.');
    }
  };

  const manualRefresh = () => {
    const isRealGreenhouse = selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01';
    if (isRealGreenhouse) {
      setConnectionStatus('connecting');
      setLoading(true);
      fetchDataWithRetry();
    }
  };

  // Expose test functions to window for debugging
  useEffect(() => {
    window.testESP32Connection = async () => {
      console.log('🧪 Testing ESP32 connection...');
      const result = await testConnection();
      console.log('Connection test result:', result);
      return result;
    };
    
    window.forceHTTPPolling = () => {
      console.log('🔄 Forcing HTTP polling...');
      startPolling();
    };
    
    window.testFetchData = async () => {
      console.log('📡 Testing fetch data...');
      try {
        const data = await fetchData();
        console.log('Fetch data result:', data);
        return data;
      } catch (error) {
        console.error('Fetch data error:', error);
        return null;
      }
    };
  }, []);

  const connectToCustomIP = async () => {
    if (!customIP.trim()) {
      alert('Please enter a valid IP address');
      return;
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(customIP.trim())) {
      alert('Please enter a valid IP address format (e.g., 192.168.1.100)');
      return;
    }

    setIsConnectingToCustomIP(true);
    setConnectionStatus('connecting');
    setLoading(true);

    try {
      console.log(`🔍 Testing connection to custom IP: ${customIP}`);
      
      // Test connection first
      const response = await fetch(`http://${customIP}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        console.log(`✅ Successfully connected to ESP32 at ${customIP}`);
        
        // Update ESP32 WebSocket service with custom IP
        esp32WebSocketService.setCustomIP(customIP);
        
        // Try WebSocket connection first
        esp32WebSocketService.connect();
        
        // Also update backend configuration
        await fetch(`${API_BASE}/set-custom-ip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ip: customIP })
        });

        setConnectionStatus('connected');
        setLoading(false);
        alert(`✅ Successfully connected to ESP32 at ${customIP}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Failed to connect to ${customIP}:`, error);
      setConnectionStatus('disconnected');
      setLoading(false);
      alert(`❌ Failed to connect to ${customIP}. Please check:\n1. ESP32 is powered on\n2. ESP32 is connected to WiFi\n3. IP address is correct\n4. You're on the same network`);
    } finally {
      setIsConnectingToCustomIP(false);
    }
  };

  useEffect(() => {
    // Check if this is the real greenhouse (GH-01 or GH01)
    const isRealGreenhouse = selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01';
    
    console.log('🔄 useEffect triggered:', {
      selectedGreenhouse,
      isRealGreenhouse,
      validGreenhouses: validGreenhouses.map(g => g.greenhouseName)
    });
    
    if (isRealGreenhouse) {
      console.log('✅ Real greenhouse detected, starting connection...');
      // Try ESP32 WebSocket connection first, fallback to HTTP polling
      connectESP32WebSocket();
    } else {
      console.log('❌ Mock greenhouse detected, setting disconnected status');
      // Disconnect ESP32 WebSocket and stop polling for other greenhouses
      disconnectESP32WebSocket();
      stopPolling();
      // Set mock data for other greenhouses
      setTelemetryData(prev => ({
        ...prev,
        temperature: 24.0,
        humidity: 60,
        soilMoisture: 1200,
        ipAddress: '192.168.1.100',
        signalStrength: -65,
        connectedSSID: 'Mock Network',
        dhtSensorWorking: true
      }));
      setConnectionStatus('disconnected');
    }

    return () => {
      // Only clean up event listeners, don't disconnect WebSocket
      // as it might be needed by other components
      if (esp32WebSocketService._componentHandlers) {
        esp32WebSocketService.off('connected', esp32WebSocketService._componentHandlers.connected);
        esp32WebSocketService.off('disconnected', esp32WebSocketService._componentHandlers.disconnected);
        esp32WebSocketService.off('connecting', esp32WebSocketService._componentHandlers.connecting);
        esp32WebSocketService.off('data', esp32WebSocketService._componentHandlers.data);
        esp32WebSocketService.off('error', esp32WebSocketService._componentHandlers.error);
        esp32WebSocketService._componentHandlers = null;
      }
      // Unregister this component when unmounting
      esp32WebSocketService.unregisterComponent();
      stopPolling();
    };
  }, [selectedGreenhouse, connectESP32WebSocket]);

  const handleGreenhouseChange = (e) => {
    const newGreenhouse = e.target.value;
    setSelectedGreenhouse(newGreenhouse);
    setAlerts([]);
  };

  const getGaugeColor = (value, type) => {
    if (value === null || value === undefined) return '#ccc';
    
    if (type === 'temperature') {
      if (value < 18) return '#29B6F6';
      if (value > 28) return '#EF5350';
      return '#66BB6A';
    } else if (type === 'humidity') {
      if (value < 40) return '#EF5350';
      if (value > 80) return '#29B6F6';
      return '#66BB6A';
    } else if (type === 'soilMoisture') {
      const percentage = Math.max(0, Math.min(100, 100 - ((value - 1000) / (2000 - 1000)) * 100));
      if (percentage < 30) return '#EF5350';
      if (percentage > 70) return '#29B6F6';
      return '#66BB6A';
    }
    return '#999';
  };

  const calculateGaugePercentage = (value, min, max) => {
    if (value === null || value === undefined) return 0;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  };

  const calculateStrokeDashOffset = (percentage) => {
    const circumference = 2 * Math.PI * 45;
    return circumference - (percentage / 100) * circumference;
  };

  const convertToPercentage = (value, type) => {
    if (value === null || value === undefined) return 'N/A';
    
    if (type === 'humidity') {
      return `${Math.round(value)}%`;
    } else if (type === 'soilMoisture') {
      const percentage = Math.max(0, Math.min(100, 100 - ((value - 1000) / (2000 - 1000)) * 100));
      return `${Math.round(percentage)}%`;
    }
    return value;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'CONNECTED';
      case 'connecting': return `CONNECTING... (${retryCountRef.current} retries)`;
      default: return 'DISCONNECTED';
    }
  };

  const TimerModal = ({ device, isOpen, onClose }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);

    const handleSetTimer = () => {
      if (hours > 0 || minutes > 0) {
        setTimer(device, hours, minutes);
      }
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-80">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Set Timer for {device.charAt(0).toUpperCase() + device.slice(1)}</h3>
          
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Hours</label>
              <input 
                type="number" 
                min="0" 
                max="23"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Minutes</label>
              <input 
                type="number" 
                min="0" 
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleSetTimer}
              className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Set Timer
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ControlButton = ({ device, label, icon: Icon }) => {
    const [showTimer, setShowTimer] = useState(false);
    const status = telemetryData.controls[device]?.status === 'on';
    const timerActive = timerSettings[device]?.active;

    // Lights can always be controlled, other devices only in manual mode
    const isDisabled = device !== 'lights' && autoMode;

    return (
      <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-gray-700 dark:text-gray-300" />
          <div>
            <h4 className="m-0 text-base font-medium text-gray-900 dark:text-white">{label}</h4>
            <p className="mt-1 mb-0 text-xs text-gray-500 dark:text-gray-400">
              Last toggled: {telemetryData.controls[device]?.lastToggled}
              {timerActive && ` | Timer: ${timerSettings[device].hours}h ${timerSettings[device].minutes}m`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* On/Off Button - FIXED COLORS */}
          <button 
            className={`relative w-14 h-7 rounded-full border-none cursor-pointer transition-all duration-300 p-0 ${
              status ? 'bg-green-500' : 'bg-red-500'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            onClick={() => toggleControl(device)}
            disabled={isDisabled}
            title={isDisabled ? 'Switch to Manual Mode to control' : status ? 'Turn Off' : 'Turn On'}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
              status ? 'translate-x-7' : 'translate-x-0'
            }`}></span>
          </button>
          
          {/* Timer Button - FIXED SPACING */}
          <button 
            onClick={() => setShowTimer(true)}
            className={`p-2 rounded border ${
              isDisabled 
                ? 'text-gray-400 border-gray-300 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
                : 'text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:text-blue-600 hover:border-blue-400 bg-white dark:bg-gray-700'
            }`}
            title={isDisabled ? 'Switch to Manual Mode to set timer' : 'Set Timer'}
            disabled={isDisabled}
          >
            <Clock size={16} />
          </button>
        </div>

        <TimerModal 
          device={device}
          isOpen={showTimer}
          onClose={() => setShowTimer(false)}
        />
      </div>
    );
  };

  if (loading && connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader darkMode={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Monitor & Control</h1>
        <div className="flex items-center gap-3">
          <label htmlFor="greenhouseSelect" className="font-medium text-gray-700 dark:text-gray-300">Select Greenhouse:</label>
          <select 
            id="greenhouseSelect" 
            value={selectedGreenhouse} 
            onChange={handleGreenhouseChange}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-w-64"
          >
            {validGreenhouses.map(greenhouse => (
              <option key={greenhouse._id} value={greenhouse.greenhouseName}>
                {greenhouse.greenhouseName} {(greenhouse.greenhouseName === 'GH-01' || greenhouse.greenhouseName === 'GH01') ? '(Real Data)' : '(Mock Data)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact ESP32 Connection Card */}
      {(selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01') && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Wifi size={16} className="text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white m-0">ESP32 Connection</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 m-0">
                  {customIP || 'Auto-connect (172.20.10.2)'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customIP}
                onChange={(e) => setCustomIP(e.target.value)}
                placeholder="IP address"
                className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
              />
              <button
                onClick={connectToCustomIP}
                disabled={isConnectingToCustomIP || !customIP.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                title="Connect to custom IP"
              >
                {isConnectingToCustomIP ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Wifi size={12} />
                )}
              </button>
              {customIP && (
                <button
                  onClick={() => setCustomIP('')}
                  className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                  title="Clear IP"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message for non-GH-01 greenhouses */}
      {selectedGreenhouse !== 'GH-01' && selectedGreenhouse !== 'GH01' && (
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">Equipment Not Connected</span>
          </div>
          <p className="mt-1">Real-time monitoring and control is only available for GH-01. Other greenhouses show mock data.</p>
        </div>
      )}

      {/* Connection Status */}
      <div className={`flex items-center gap-3 p-3 rounded text-white ${getConnectionStatusColor()}`}>
        <Wifi size={20} />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <span>Connection: {getConnectionStatusText()} ({esp32WebSocketService.getConnectionStatus() === 'connected' ? 'ESP32 WebSocket' : 'HTTP Polling'})</span>
            <span className="text-sm bg-black bg-opacity-20 px-2 py-1 rounded">
              {(selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01') ? 'Real Data' : 'Mock Data'}
            </span>
          </div>
          
          {connectionStatus === 'connected' && (
            <div className="text-sm mt-1 opacity-90">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>📡 ESP32 IP:</strong> {esp32CurrentIP || telemetryData.ipAddress}
                </div>
                <div>
                  <strong>💪 Signal:</strong> {telemetryData.signalStrength ? `${telemetryData.signalStrength} dBm` : 'N/A'}
                </div>
                <div>
                  <strong>📶 Network:</strong> {telemetryData.connectedSSID}
                </div>
                <div>
                  <strong>🔧 DHT Status:</strong> 
                  <span className={`ml-1 ${telemetryData.dhtSensorWorking ? 'text-green-300' : 'text-yellow-300'}`}>
                    {telemetryData.dhtSensorWorking ? '✅ WORKING' : '❌ NOT WORKING'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={manualRefresh}
            disabled={connectionStatus === 'connecting'}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-sm flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button 
            onClick={async () => {
              console.log('🧪 Testing ESP32 connectivity...');
              const result = await esp32WebSocketService.testHTTPConnection();
              if (result.success) {
                alert(`✅ ESP32 found at ${result.ip}`);
                // If ESP32 is found, try to start HTTP polling
                console.log('🔄 Starting HTTP polling after successful test...');
                startPolling();
              } else {
                alert('❌ No ESP32 devices found');
              }
            }}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-sm flex items-center gap-1"
            title="Test ESP32 Connectivity"
          >
            <Settings size={14} />
            Test
          </button>
          <button 
            onClick={() => {
              console.log('🔄 Manually forcing HTTP polling...');
              startPolling();
            }}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-sm flex items-center gap-1"
            title="Force HTTP Polling"
          >
            <RefreshCw size={14} />
            Force HTTP
          </button>
          <button 
            onClick={() => {
              console.log('🔍 Debug info:', {
                selectedGreenhouse,
                isRealGreenhouse: selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01',
                connectionStatus,
                webSocketStatus: esp32WebSocketService.getConnectionStatus(),
                validGreenhouses: validGreenhouses.map(g => g.greenhouseName)
              });
              alert(`Debug Info:\nSelected: ${selectedGreenhouse}\nIs Real: ${selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01'}\nStatus: ${connectionStatus}\nWebSocket: ${esp32WebSocketService.getConnectionStatus()}`);
            }}
            className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 text-sm flex items-center gap-1"
            title="Debug Info"
          >
            <Settings size={14} />
            Debug
          </button>
        </div>
      </div>

      {/* Auto/Manual Mode Toggle */}
      {(selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01') && (
        <div className="flex justify-center">
          <button 
            onClick={toggleAutoMode}
            disabled={connectionStatus !== 'connected'}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              autoMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {autoMode ? '🔧 AUTO MODE' : '✋ MANUAL MODE'}
          </button>
        </div>
      )}

      {/* Sensor Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Temperature Gauge */}
        <Card className="flex flex-col items-center p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
            <Thermometer size={20} />
            <h3 className="text-lg font-medium m-0">Temperature</h3>
            {!telemetryData.dhtSensorWorking && (
              <span className="text-red-500 text-sm bg-red-100 dark:bg-red-900 px-2 py-1 rounded">SENSOR ERROR</span>
            )}
          </div>
          <div className="flex justify-center items-center text-gray-700 dark:text-gray-300">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              {telemetryData.dhtSensorWorking && telemetryData.temperature !== null ? (
                <>
                  <circle 
                    cx="60" cy="60" r="45" fill="none" 
                    stroke={getGaugeColor(telemetryData.temperature, 'temperature')} 
                    strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45}`} 
                    strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.temperature, 10, 40))} 
                    strokeLinecap="round" 
                    transform="rotate(-90 60 60)" 
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" 
                        fill={getGaugeColor(telemetryData.temperature, 'temperature')}>
                    {telemetryData.temperature?.toFixed(1) || 'N/A'}
                  </text>
                  <text x="60" y="75" textAnchor="middle" fontSize="14" fill="currentColor">
                    °C
                  </text>
                </>
              ) : (
                <>
                  <circle 
                    cx="60" cy="60" r="45" fill="none" 
                    stroke="#ccc" 
                    strokeWidth="10" 
                    strokeDasharray="20 10" 
                    strokeLinecap="round" 
                    transform="rotate(-90 60 60)" 
                  />
                  <text x="60" y="60" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#999">
                    SENSOR ERROR
                  </text>
                </>
              )}
            </svg>
          </div>
        </Card>

        {/* Humidity Gauge */}
        <Card className="flex flex-col items-center p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
            <Droplet size={20} />
            <h3 className="text-lg font-medium m-0">Humidity</h3>
            {!telemetryData.dhtSensorWorking && (
              <span className="text-red-500 text-sm bg-red-100 dark:bg-red-900 px-2 py-1 rounded">SENSOR ERROR</span>
            )}
          </div>
          <div className="flex justify-center items-center text-gray-700 dark:text-gray-300">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              {telemetryData.dhtSensorWorking && telemetryData.humidity !== null ? (
                <>
                  <circle 
                    cx="60" cy="60" r="45" fill="none" 
                    stroke={getGaugeColor(telemetryData.humidity, 'humidity')} 
                    strokeWidth="10" 
                    strokeDasharray={`${2 * Math.PI * 45}`} 
                    strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.humidity, 0, 100))} 
                    strokeLinecap="round" 
                    transform="rotate(-90 60 60)" 
                  />
                  <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" 
                        fill={getGaugeColor(telemetryData.humidity, 'humidity')}>
                    {telemetryData.humidity?.toFixed(1) || 'N/A'}%
                  </text>
                </>
              ) : (
                <>
                  <circle 
                    cx="60" cy="60" r="45" fill="none" 
                    stroke="#ccc" 
                    strokeWidth="10" 
                    strokeDasharray="20 10" 
                    strokeLinecap="round" 
                    transform="rotate(-90 60 60)" 
                  />
                  <text x="60" y="60" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#999">
                    SENSOR ERROR
                  </text>
                </>
              )}
            </svg>
          </div>
        </Card>

        {/* Soil Moisture Gauge */}
        <Card className="flex flex-col items-center p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
            <Sprout size={20} />
            <h3 className="text-lg font-medium m-0">Soil Moisture</h3>
          </div>
          <div className="flex justify-center items-center text-gray-700 dark:text-gray-300">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#E0E0E0" strokeWidth="10" />
              <circle 
                cx="60" cy="60" r="45" fill="none" 
                stroke={getGaugeColor(telemetryData.soilMoisture, 'soilMoisture')} 
                strokeWidth="10" 
                strokeDasharray={`${2 * Math.PI * 45}`} 
                strokeDashoffset={calculateStrokeDashOffset(calculateGaugePercentage(telemetryData.soilMoisture, 1000, 2000))} 
                strokeLinecap="round" 
                transform="rotate(-90 60 60)" 
              />
              <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="bold" 
                    fill={getGaugeColor(telemetryData.soilMoisture, 'soilMoisture')}>
                {convertToPercentage(telemetryData.soilMoisture, 'soilMoisture')}
              </text>
            </svg>
          </div>
        </Card>
      </div>

      {/* Historical Chart - Only show when DHT sensor is working */}
      {(selectedGreenhouse === 'GH-01' || selectedGreenhouse === 'GH01') && historicalData.length > 0 && telemetryData.dhtSensorWorking && (
        <Card className="p-6">
          <h3 className="mt-0 mb-4 text-lg font-medium text-gray-900 dark:text-white">Sensor History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" interval={Math.ceil(historicalData.length / 10)} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#EF5350" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#29B6F6" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="soilMoisture" name="Soil Moisture" stroke="#66BB6A" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Control Panel */}
        <Card className="p-6">
          <h3 className="mt-0 mb-4 text-lg font-medium text-gray-900 dark:text-white">Manual Control Panel</h3>
          <div className="flex flex-col gap-4">
            <ControlButton device="fan" label="Fan" icon={Wind} />
            <ControlButton device="lights" label="Lights" icon={Lightbulb} />
            <ControlButton device="waterPump" label="Water Pump" icon={Waves} />
            <ControlButton device="heater" label="Heater" icon={Thermometer} />
          </div>
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 m-0">
              💡 <strong>Note:</strong> Lights can be controlled in both Auto and Manual modes. Fan, Water Pump, and Heater can only be controlled in Manual Mode.
            </p>
          </div>
        </Card>

        {/* Alerts Panel */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="mt-0 text-lg font-medium text-gray-900 dark:text-white">Alerts & Notifications</h3>
            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-semibold">
              {alerts.length}
            </span>
          </div>
          
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="m-0 text-sm font-medium text-red-800 dark:text-red-200">{alert.message}</p>
                    <p className="m-0 text-xs text-red-600 dark:text-red-300 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                <p className="m-0">No alerts at the moment</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonitorControl;