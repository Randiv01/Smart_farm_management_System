import React, { useState, useRef, useEffect } from 'react';
import { QrCode, X, Clock, UserCheck, AlertCircle, Type } from 'lucide-react';
import jsQR from 'jsqr';

const QRScanner = ({ darkMode, onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch employees for quick selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/employees');
        const data = await response.json();
        // Handle both old format (array) and new format ({ docs: [...] })
        const employeesArray = Array.isArray(data) ? data : (data.docs || []);
        setEmployees(employeesArray);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to scan QR codes.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScan = async (result) => {
    try {
      console.log("QR Code scanned:", result);
      const data = JSON.parse(result);
      
      // Validate the QR code data
      if (data.id && data.name && data.type) {
        // Check if it's a valid employee QR code
        if (data.type === 'employee' || data.type === 'doctor' || data.type === 'pathologist') {
          // Verify the employee exists in the system
          const employeeExists = employees.find(emp => emp.id === data.id);
          if (employeeExists) {
            console.log("Employee found in system:", employeeExists);
            setScanResult(data);
            onScan(data);
            stopScanning();
          } else {
            console.log("Employee not found in system:", data.id);
            setError(`Employee ${data.id} not found in StaffHub. Please ensure the employee exists in the system.`);
          }
        } else {
          setError('Invalid QR code type. Please scan a valid employee QR code.');
        }
      } else {
        setError('Invalid QR code. Please scan a valid employee QR code.');
      }
    } catch (err) {
      console.error("QR Code parsing error:", err);
      setError('Invalid QR code format. Please scan a valid employee QR code.');
    }
  };

  // Real QR code detection using jsQR
  const detectQRCode = () => {
    if (!isScanning || !videoRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect QR code using jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        console.log("QR Code detected:", code.data);
        
        // Validate and process the QR code
        try {
          const data = JSON.parse(code.data);
          
          // Validate the QR code data structure
          if (data.id && data.name && data.type) {
            // Check if it's a valid employee QR code
            if (data.type === 'employee' || data.type === 'doctor' || data.type === 'pathologist') {
              // Verify the employee exists in the system
              const employeeExists = employees.find(emp => emp.id === data.id);
              if (employeeExists) {
                console.log("Valid employee QR code detected:", data);
                handleScan(code.data);
                stopScanning();
              } else {
                console.log("Employee not found in system:", data.id);
                setError(`Employee ${data.id} not found in StaffHub. Please ensure the employee exists.`);
              }
            } else {
              setError('Invalid QR code type. Please scan a valid employee QR code.');
            }
          } else {
            setError('Invalid QR code format. Please scan a valid employee QR code.');
          }
        } catch (parseError) {
          console.error("QR Code parsing error:", parseError);
          setError('Invalid QR code format. Please scan a valid employee QR code.');
        }
      }
    } catch (error) {
      console.error("QR detection error:", error);
    }
  };

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(detectQRCode, 1000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <QrCode size={20} />
            QR Code Scanner
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {!isScanning && !scanResult && !showManualInput && (
          <div className="text-center py-8">
            <QrCode size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">Scan employee QR code to mark attendance</p>
            {employees.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-blue-800 font-medium mb-2">📋 Available Employees:</p>
                <div className="text-xs text-blue-600 max-h-20 overflow-y-auto">
                  {employees.map((emp, index) => (
                    <div key={emp.id}>
                      {index + 1}. {emp.name} ({emp.id})
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={startScanning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Start Camera Scanning
              </button>
              <div className="text-sm text-gray-500">or</div>
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Type size={16} />
                Manual QR Code Input
              </button>
              <div className="text-sm text-gray-500">or</div>
              <div className="space-y-2">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select Employee for Quick Test</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
                {selectedEmployee && (
                  <button
                    onClick={() => {
                      const emp = employees.find(e => e.id === selectedEmployee);
                      if (emp) {
                        const testData = {
                          id: emp.id,
                          name: emp.name,
                          type: "employee",
                          timestamp: new Date().toISOString()
                        };
                        handleScan(JSON.stringify(testData));
                      }
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  >
                    Mark Attendance for {employees.find(e => e.id === selectedEmployee)?.name}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showManualInput && (
          <div className="text-center py-8">
            <Type size={64} className="mx-auto text-purple-400 mb-4" />
            <p className="text-gray-500 mb-4">Enter QR code data from StaffHub</p>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">📋 How to get QR data:</p>
                <p className="text-xs text-yellow-700">
                  1. Go to StaffHub page<br/>
                  2. Click "Generate QR Code" for an employee<br/>
                  3. In the QR modal, press F12 to open developer tools<br/>
                  4. Go to Console tab<br/>
                  5. Look for "QR Code data:" in the console<br/>
                  6. Copy the JSON data and paste it below
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code Data (JSON format):
                </label>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder='{"id":"EMP001","name":"John Doe","type":"employee","timestamp":"2024-01-01T00:00:00.000Z"}'
                  className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    try {
                      const data = JSON.parse(manualInput);
                      handleScan(JSON.stringify(data));
                    } catch (err) {
                      setError('Invalid JSON format. Please check your input.');
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
                >
                  Process QR Data
                </button>
                <button
                  onClick={() => setShowManualInput(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="text-center">
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-black rounded-lg"
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-2">📱 How to scan:</p>
              <p className="text-xs text-blue-600">
                1. Go to StaffHub page<br/>
                2. Click "Generate QR Code" for an employee<br/>
                3. Hold the QR code in front of the camera<br/>
                4. QR code will be detected automatically
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-4">Position the employee QR code within the frame - it will be detected automatically</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowManualInput(true)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Type size={16} />
                Manual Input
              </button>
              <button
                onClick={stopScanning}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Stop
              </button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center mb-4">
              <UserCheck size={48} className="text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">QR Code Scanned Successfully!</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Employee:</strong> {scanResult.name}<br/>
                <strong>ID:</strong> {scanResult.id}<br/>
                <strong>Type:</strong> {scanResult.type}<br/>
                <strong>Time:</strong> {new Date(scanResult.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 font-medium mb-1">📋 Check-in/Check-out System:</p>
              <p className="text-xs text-blue-700">
                • <strong>First scan:</strong> Records check-in time<br/>
                • <strong>Second scan:</strong> Records check-out time<br/>
                • <strong>Status updates:</strong> Based on total hours worked
              </p>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Processing attendance record...
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setScanResult(null);
                  startScanning();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Scan Another
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                startScanning();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
