// ESP32 WebSocket Service for Smart Agriculture System
// Handles real-time communication with ESP32 device

class ESP32WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 10000;
    this.isConnecting = false;
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    
    // ESP32 IP addresses to try (from your Arduino code)
    this.esp32IPs = [
      '192.168.1.100',  // ESP32 Current IP (SLT-Fiber-A577 network)
      '172.20.10.2',    // Danuz network
      '172.20.10.3',    // Iphone 11 network
      '192.168.4.1'     // ESP32 AP mode default
    ];
    
    this.currentIPIndex = 0;
    this.customIP = null;
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Set custom IP for connection
  setCustomIP(ip) {
    this.customIP = ip;
    console.log(`🎯 ESP32 WebSocket: Custom IP set to ${ip}`);
  }

  // Connect to ESP32 WebSocket
  async connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.emit('connecting');

    console.log('🔄 ESP32 WebSocket: Starting connection...');

    const tryConnect = () => {
      // If custom IP is set, try it first
      if (this.customIP) {
        const wsUrl = `ws://${this.customIP}:81`;
        this.tryConnectToIP(this.customIP, wsUrl);
        return;
      }

      // Otherwise, try default IPs
      if (this.currentIPIndex >= this.esp32IPs.length) {
        console.log('❌ ESP32 WebSocket: All IP addresses failed');
        this.isConnecting = false;
        this.emit('error', { message: 'All ESP32 IP addresses failed' });
        return;
      }

      const ip = this.esp32IPs[this.currentIPIndex];
      const wsUrl = `ws://${ip}:81`;
      this.tryConnectToIP(ip, wsUrl);
    };

    tryConnect();
  }

  // Try connecting to a specific IP
  tryConnectToIP(ip, wsUrl) {
    console.log(`🔄 ESP32 WebSocket: Attempting connection to ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`✅ ESP32 WebSocket: Connected to ${wsUrl}`);
        this.ws = ws;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.currentIPIndex = 0;
        this.startHeartbeat();
        this.emit('connected', { ip, url: wsUrl });
        
        // Request initial data
        this.send({ type: 'getData' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.lastHeartbeat = Date.now();
          this.emit('data', data);
        } catch (error) {
          console.error('❌ ESP32 WebSocket: Failed to parse message:', error);
          this.emit('error', { message: 'Failed to parse WebSocket message' });
        }
      };

      ws.onclose = (event) => {
        console.log(`❌ ESP32 WebSocket: Connection closed to ${wsUrl}`, event.code, event.reason);
        this.ws = null;
        this.stopHeartbeat();
        this.isConnecting = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        if (event.code !== 1000) { // Not a normal closure
          this.scheduleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.log(`❌ ESP32 WebSocket: Error connecting to ${wsUrl}:`, error);
        
        // If custom IP failed, try default IPs
        if (this.customIP && ip === this.customIP) {
          console.log('🔄 ESP32 WebSocket: Custom IP failed, trying default IPs...');
          this.customIP = null;
          this.currentIPIndex = 0;
        } else {
          this.currentIPIndex++;
        }
        
        setTimeout(() => {
          this.connect();
        }, 1000);
      };

    } catch (error) {
      console.error('❌ ESP32 WebSocket: Connection error:', error);
      
      // If custom IP failed, try default IPs
      if (this.customIP && ip === this.customIP) {
        console.log('🔄 ESP32 WebSocket: Custom IP failed, trying default IPs...');
        this.customIP = null;
        this.currentIPIndex = 0;
      } else {
        this.currentIPIndex++;
      }
      
      setTimeout(() => {
        this.connect();
      }, 1000);
    }
  }

  // Schedule reconnection
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ ESP32 WebSocket: Max reconnection attempts reached');
      this.emit('error', { message: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    
    console.log(`🔄 ESP32 WebSocket: Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Send message to ESP32
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        this.ws.send(messageStr);
        console.log('📤 ESP32 WebSocket: Sent message:', message);
        return true;
      } catch (error) {
        console.error('❌ ESP32 WebSocket: Failed to send message:', error);
        this.emit('error', { message: 'Failed to send message' });
        return false;
      }
    } else {
      console.warn('⚠️ ESP32 WebSocket: Cannot send message, not connected');
      return false;
    }
  }

  // Send control command to ESP32
  sendControlCommand(device, action, duration = null) {
    const command = {
      type: 'control',
      device: device,
      action: action
    };

    if (duration !== null) {
      command.duration = duration;
    }

    return this.send(command);
  }

  // Send mode change command
  sendModeCommand(mode) {
    return this.send({
      type: 'setMode',
      mode: mode
    });
  }

  // Request data from ESP32
  requestData() {
    return this.send({ type: 'getData' });
  }

  // Start heartbeat to monitor connection
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping every 30 seconds
        this.send({ type: 'ping' });
        
        // Check if we haven't received data in 60 seconds
        if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > 60000) {
          console.log('⚠️ ESP32 WebSocket: No heartbeat received, reconnecting...');
          this.disconnect();
          this.connect();
        }
      }
    }, 30000);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Disconnect from ESP32
  disconnect() {
    console.log('🔌 ESP32 WebSocket: Disconnecting...');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.currentIPIndex = 0;
    this.emit('disconnected');
  }

  // Get connection status
  getConnectionStatus() {
    if (this.isConnecting) {
      return 'connecting';
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return 'connected';
    } else {
      return 'disconnected';
    }
  }

  // Get current ESP32 IP
  getCurrentIP() {
    return this.currentIPIndex < this.esp32IPs.length ? this.esp32IPs[this.currentIPIndex] : null;
  }

  // Test ESP32 connectivity via HTTP (fallback)
  async testHTTPConnection() {
    console.log('🧪 ESP32 WebSocket: Testing HTTP connectivity...');
    
    for (const ip of this.esp32IPs) {
      try {
        const response = await fetch(`http://${ip}/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          console.log(`✅ ESP32 HTTP: Device found at ${ip}`);
          return { success: true, ip };
        }
      } catch (error) {
        console.log(`❌ ESP32 HTTP: Device not reachable at ${ip}`);
      }
    }
    
    console.log('❌ ESP32 HTTP: No devices found');
    return { success: false };
  }

  // Cleanup
  destroy() {
    this.disconnect();
    this.listeners.clear();
  }
}

// Create singleton instance
const esp32WebSocketService = new ESP32WebSocketService();

export default esp32WebSocketService;

