// ESP32 Proxy Routes for Smart Agriculture System
// This handles communication between the frontend and ESP32 device

import express from 'express';
import axios from 'axios';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const router = express.Router();

// ESP32 Configuration - Update these IPs based on your network setup
const ESP32_CONFIG = {
  // Primary ESP32 IPs to try (from your Arduino code)
  primaryIPs: [
    '192.168.1.100',  // ESP32 Current IP (SLT-Fiber-A577 network)
    '172.20.10.2',    // Danuz network
    '172.20.10.3',    // Iphone 11 network
    '192.168.4.1'     // ESP32 AP mode default
  ],
  httpPort: 80,
  wsPort: 81,
  timeout: 12000
};

// Cache last known active IP to avoid probing every request
let LAST_ACTIVE_IP = null;
let LAST_ACTIVE_AT = 0; // epoch ms
const LAST_ACTIVE_TTL_MS = 300_000; // 5 minutes

// Helper function to test ESP32 connectivity
const testESP32Connection = async (ip, customTimeout) => {
  try {
    const controller = new AbortController();
    const effectiveTimeout = typeof customTimeout === 'number' ? customTimeout : ESP32_CONFIG.timeout;
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
    
    const response = await axios.get(`http://${ip}/health`, {
      signal: controller.signal,
      timeout: effectiveTimeout
    });
    
    clearTimeout(timeoutId);
    return { success: true, ip, data: response.data };
  } catch (error) {
    return { success: false, ip, error: error.message };
  }
};

// Helper function to get active ESP32 quickly (prefer cached IP)
const findActiveESP32 = async () => {
  console.log('🔍 Searching for active ESP32...');

  // 1) If we have a cached IP within TTL, use it immediately (no extra ping)
  const now = Date.now();
  if (LAST_ACTIVE_IP && now - LAST_ACTIVE_AT < LAST_ACTIVE_TTL_MS) {
    console.log(`⚡ Using cached ESP32 IP: ${LAST_ACTIVE_IP}`);
    return { success: true, ip: LAST_ACTIVE_IP };
  }

  // 2) Probe all candidate IPs in parallel with shorter timeouts
  const candidates = [...ESP32_CONFIG.primaryIPs];
  console.log(`📡 Probing candidates in parallel: ${candidates.join(', ')}`);

  const probes = candidates.map(ip =>
    testESP32Connection(ip, 3000).then(result => ({ ip, result }))
  );

  // Wait for the first success
  const results = await Promise.allSettled(probes);
  const success = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.result)
    .find(r => r && r.success);

  if (success) {
    LAST_ACTIVE_IP = success.ip;
    LAST_ACTIVE_AT = Date.now();
    console.log(`✅ ESP32 found at ${success.ip}`);
    return { success: true, ip: success.ip, data: success.data };
  }

  console.log('❌ No active ESP32 found');
  return { success: false, error: 'No ESP32 device found' };
};

// Proxy route to get ESP32 status
router.get('/status', async (req, res) => {
  try {
    const directIP = req.query.ip;
    let esp32Result;
    if (directIP) {
      console.log(`⚡ Direct IP provided for status: ${directIP}`);
      esp32Result = { success: true, ip: directIP };
    } else {
      esp32Result = await findActiveESP32();
    }
    
    if (!esp32Result.success) {
      return res.status(503).json({
        success: false,
        error: esp32Result.error,
        message: 'ESP32 device not reachable'
      });
    }
    
    // Forward request to ESP32
    try {
      const response = await axios.get(`http://${esp32Result.ip}/status`, {
        timeout: Math.max(ESP32_CONFIG.timeout, 8000)
      });
      res.json({
        success: true,
        data: response.data,
        esp32IP: esp32Result.ip
      });
    } catch (err) {
      // Invalidate cache and retry discovery once (only if not direct IP)
      console.warn(`⚠️ Status fetch failed at ${esp32Result.ip}, retrying discovery...: ${err.message}`);
      if (!directIP) {
        LAST_ACTIVE_IP = null;
        LAST_ACTIVE_AT = 0;
        esp32Result = await findActiveESP32();
      } else {
        return res.status(503).json({ success: false, error: `ESP32 not reachable at ${directIP}` });
      }
      if (!esp32Result.success) {
        return res.status(503).json({
          success: false,
          error: 'ESP32 not reachable after retry'
        });
      }
      const response = await axios.get(`http://${esp32Result.ip}/status`, {
        timeout: Math.max(ESP32_CONFIG.timeout, 6000)
      });
      res.json({
        success: true,
        data: response.data,
        esp32IP: esp32Result.ip
      });
    }
    
  } catch (error) {
    console.error('❌ ESP32 proxy error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to communicate with ESP32'
    });
  }
});

// Proxy route to get ESP32 health
router.get('/health', async (req, res) => {
  try {
    const directIP = req.query.ip;
    let esp32Result;
    if (directIP) {
      console.log(`⚡ Direct IP provided for health: ${directIP}`);
      esp32Result = { success: true, ip: directIP };
    } else {
      esp32Result = await findActiveESP32();
    }
    
    if (!esp32Result.success) {
      return res.status(503).json({
        success: false,
        error: esp32Result.error,
        message: 'ESP32 device not reachable'
      });
    }
    
    // Forward request to ESP32
    try {
      const response = await axios.get(`http://${esp32Result.ip}/health`, {
        timeout: Math.max(ESP32_CONFIG.timeout, 8000)
      });
      res.json({ success: true, data: response.data, esp32IP: esp32Result.ip });
    } catch (err) {
      console.warn(`⚠️ Health fetch failed at ${esp32Result.ip}, retrying discovery...: ${err.message}`);
      if (!directIP) {
        LAST_ACTIVE_IP = null;
        LAST_ACTIVE_AT = 0;
        esp32Result = await findActiveESP32();
      } else {
        return res.status(503).json({ success: false, error: `ESP32 not reachable at ${directIP}` });
      }
      if (!esp32Result.success) {
        return res.status(503).json({ success: false, error: 'ESP32 not reachable after retry' });
      }
      const response = await axios.get(`http://${esp32Result.ip}/health`, {
        timeout: Math.max(ESP32_CONFIG.timeout, 6000)
      });
      res.json({ success: true, data: response.data, esp32IP: esp32Result.ip });
    }
    
  } catch (error) {
    console.error('❌ ESP32 health check error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to check ESP32 health'
    });
  }
});

// Proxy route for ESP32 control commands
router.post('/control', async (req, res) => {
  try {
    const { device, action, duration } = req.body;
    
    if (!device || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: device, action'
      });
    }
    
    const esp32Result = await findActiveESP32();
    
    if (!esp32Result.success) {
      return res.status(503).json({
        success: false,
        error: esp32Result.error,
        message: 'ESP32 device not reachable'
      });
    }
    
    // Prepare control parameters
    const params = new URLSearchParams({
      device: device,
      action: action
    });
    
    if (duration) {
      params.append('duration', duration.toString());
    }
    
    // Forward control command to ESP32
    const response = await axios.post(`http://${esp32Result.ip}/control?${params}`, {}, {
      timeout: ESP32_CONFIG.timeout
    });
    
    res.json({
      success: true,
      data: response.data,
      esp32IP: esp32Result.ip,
      command: { device, action, duration }
    });
    
    console.log(`✅ Control command sent to ESP32 (${esp32Result.ip}): ${device} ${action}${duration ? ` for ${duration} minutes` : ''}`);
    
  } catch (error) {
    console.error('❌ ESP32 control error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send control command to ESP32'
    });
  }
});

// Proxy route for mode toggle
router.get('/toggleMode', async (req, res) => {
  try {
    const esp32Result = await findActiveESP32();
    
    if (!esp32Result.success) {
      return res.status(503).json({
        success: false,
        error: esp32Result.error,
        message: 'ESP32 device not reachable'
      });
    }
    
    // Forward mode toggle to ESP32
    const response = await axios.get(`http://${esp32Result.ip}/toggleMode`, {
      timeout: ESP32_CONFIG.timeout
    });
    
    res.json({
      success: true,
      data: response.data,
      esp32IP: esp32Result.ip
    });
    
  } catch (error) {
    console.error('❌ ESP32 mode toggle error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to toggle ESP32 mode'
    });
  }
});

// Proxy route for auto watering toggle
router.get('/toggleWatering', async (req, res) => {
  try {
    const esp32Result = await findActiveESP32();
    
    if (!esp32Result.success) {
      return res.status(503).json({
        success: false,
        error: esp32Result.error,
        message: 'ESP32 device not reachable'
      });
    }
    
    // Forward watering toggle to ESP32
    const response = await axios.get(`http://${esp32Result.ip}/toggleWatering`, {
      timeout: ESP32_CONFIG.timeout
    });
    
    res.json({
      success: true,
      data: response.data,
      esp32IP: esp32Result.ip
    });
    
  } catch (error) {
    console.error('❌ ESP32 watering toggle error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to toggle ESP32 watering'
    });
  }
});

// Route to get ESP32 configuration info
router.get('/config', (req, res) => {
  res.json({
    success: true,
    config: {
      primaryIPs: ESP32_CONFIG.primaryIPs,
      httpPort: ESP32_CONFIG.httpPort,
      wsPort: ESP32_CONFIG.wsPort,
      timeout: ESP32_CONFIG.timeout
    }
  });
});

// Route to test ESP32 connectivity
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing ESP32 connectivity...');
    
    const results = [];
    for (const ip of ESP32_CONFIG.primaryIPs) {
      const result = await testESP32Connection(ip);
      results.push(result);
    }
    
    const activeESP32 = results.find(r => r.success);
    
    res.json({
      success: true,
      results: results,
      activeESP32: activeESP32 || null,
      message: activeESP32 ? `ESP32 found at ${activeESP32.ip}` : 'No ESP32 devices found'
    });
    
  } catch (error) {
    console.error('❌ ESP32 test error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Route to set custom IP for ESP32 connection
router.post('/set-custom-ip', async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({
        success: false,
        error: 'IP address is required'
      });
    }

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IP address format'
      });
    }

    // Test connection to the custom IP
    const result = await testESP32Connection(ip);
    
    if (result.success) {
      // Add custom IP to the beginning of the IP list
      ESP32_CONFIG.primaryIPs.unshift(ip);
      console.log(`✅ Custom IP ${ip} added and tested successfully`);
      
      res.json({
        success: true,
        message: `Custom IP ${ip} set and tested successfully`,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Cannot connect to ESP32 at ${ip}`,
        details: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ ESP32 custom IP error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

