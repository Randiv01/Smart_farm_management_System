import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  X, 
  Camera, 
  CameraOff, 
  Loader, 
  AlertCircle, 
  CheckCircle,
  Eye,
  MapPin,
  Calendar,
  Users,
  Activity,
  Heart,
  Beef,
  Info,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.js';
import axios from 'axios';
import jsQR from 'jsqr';

const QRScanner = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [cameraTimeout, setCameraTimeout] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // QR Code detection function
  const detectQRCode = (video, canvas) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    return code;
  };

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraLoading(true);
      
      console.log('Starting camera...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (envError) {
        console.log('Environment camera failed, trying user camera:', envError);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      }
      
      console.log('Camera stream obtained:', stream);
      
      streamRef.current = stream;
      setCameraLoading(false);
      setIsScanning(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Video ref current after state change:', videoRef.current);
      
      if (!videoRef.current) {
        throw new Error('Video element not available - ref not set');
      }
      
      videoRef.current.srcObject = stream;
      console.log('Stream assigned to video element');
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await videoRef.current.play();
      console.log('Video started playing successfully');
      
      if (cameraTimeout) {
        clearTimeout(cameraTimeout);
        setCameraTimeout(null);
      }
      
      setTimeout(() => {
        scanIntervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
            const qrCode = detectQRCode(videoRef.current, canvasRef.current);
            if (qrCode) {
              handleQRCodeDetected(qrCode.data);
            }
          }
        }, 100);
      }, 1000);
      
    } catch (err) {
      console.error('Camera error:', err);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found. Please check your device has a camera.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setCameraLoading(false);
  };

  // Handle QR code detected
  const handleQRCodeDetected = async (qrData) => {
    console.log('QR Code detected:', qrData);
    
    // Stop scanning
    stopCamera();
    setLoading(true);
    setError(null);
    
    // Parse QR data to extract ID
    let qrCodeToUse = qrData;
    
    try {
      const parsedData = JSON.parse(qrData);
      if (parsedData.id) {
        qrCodeToUse = parsedData.id;
      } else if (parsedData.animalId) {
        qrCodeToUse = parsedData.animalId;
      } else if (parsedData.batchId) {
        qrCodeToUse = parsedData.batchId;
      }
    } catch (parseError) {
      console.log('QR data is not JSON, using as-is:', qrData);
      qrCodeToUse = qrData;
    }
    
    console.log('Using QR code for API call:', qrCodeToUse);
    
    try {
      // Fetch animal/batch data based on QR code
      const response = await axios.get(`http://localhost:5000/animals/qr/${encodeURIComponent(qrCodeToUse)}`);
      setScannedData(response.data);
      setShowResult(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 404) {
        setError('Animal or batch not found with this QR code. Please check if the QR code is valid.');
        // Show the scanned QR data even if not found in database
        setScannedData({
          notFound: true,
          rawData: qrData,
          qrCode: qrCodeToUse
        });
        setShowResult(true);
      } else {
        setError(`Error fetching data: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset scanner
  const resetScanner = () => {
    stopCamera();
    setScannedData(null);
    setShowResult(false);
    setError(null);
    setCameraError(null);
    setLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Close modal
  const handleClose = () => {
    resetScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl mx-4 max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <QrCode className="h-7 w-7 text-green-600" />
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                QR Code Scanner
              </h2>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Scan animal or batch QR codes
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors z-10 ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title="Close Scanner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {!showResult ? (
            <div className="space-y-6">
              {/* Camera Section */}
              <div className="relative">
                <div className={`aspect-video rounded-xl overflow-hidden border-2 ${
                  isScanning 
                    ? 'border-green-500' 
                    : darkMode 
                      ? 'border-gray-600' 
                      : 'border-gray-300'
                }`}>
                  {cameraLoading ? (
                    <div className={`w-full h-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-center">
                        <Loader className={`h-16 w-16 mx-auto mb-4 animate-spin ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <p className={`text-lg font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Starting Camera...
                        </p>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Please wait while we access your camera
                        </p>
                      </div>
                    </div>
                  ) : isScanning ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                      onLoadedData={() => console.log('Video data loaded')}
                      onCanPlay={() => console.log('Video can play')}
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <div className="text-center">
                        <Camera className={`h-16 w-16 mx-auto mb-4 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                        <p className={`text-lg font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Camera Ready
                        </p>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Click start to begin scanning
                        </p>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden"></canvas>
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Scanning overlay */}
                      <div className="w-3/4 h-3/4 border-4 border-green-500 rounded-lg animate-pulse opacity-70"></div>
                      <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {!isScanning && !cameraLoading ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Start Scanning</span>
                    <span className="sm:hidden">Start</span>
                  </button>
                ) : cameraLoading ? (
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gray-400 text-white font-semibold rounded-xl text-sm sm:text-base cursor-not-allowed"
                  >
                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Starting Camera...</span>
                    <span className="sm:hidden">Starting...</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                  >
                    <CameraOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Stop Scanning</span>
                    <span className="sm:hidden">Stop</span>
                  </button>
                )}
                
                <button
                  onClick={resetScanner}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                >
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                  Reset
                </button>
                
                {cameraLoading && (
                  <button
                    onClick={() => {
                      setCameraLoading(false);
                      setCameraError('Camera loading cancelled by user.');
                    }}
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    Cancel
                  </button>
                )}
                
                <button
                  onClick={handleClose}
                  className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm sm:text-base"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  Close
                </button>
              </div>

              {/* Error Messages */}
              {cameraError && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-red-800 dark:text-red-200">{cameraError}</p>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      <Camera className="h-4 w-4" />
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center gap-3 p-8">
                  <Loader className="h-6 w-6 animate-spin text-green-600" />
                  <p className={`text-lg font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Fetching data...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ScanResult 
              data={scannedData} 
              onClose={handleClose}
              onScanAnother={resetScanner}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>
      
      {/* Hidden canvas for QR detection */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// Scan Result Component
const ScanResult = ({ data, onClose, onScanAnother, darkMode }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return 'text-green-500';
      case 'Sick': return 'text-yellow-500';
      case 'Critical': return 'text-red-500';
      case 'In Treatment': return 'text-blue-500';
      case 'Quarantined': return 'text-orange-500';
      default: return darkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className={`flex items-center gap-3 p-4 border rounded-xl ${
        data.notFound 
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }`}>
        {data.notFound ? (
          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        ) : (
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
        <div>
          <h3 className={`text-lg font-semibold ${
            data.notFound 
              ? 'text-yellow-800 dark:text-yellow-200'
              : 'text-green-800 dark:text-green-200'
          }`}>
            {data.notFound ? 'QR Code Scanned - Not Found' : 'QR Code Scanned Successfully!'}
          </h3>
          <p className={`text-sm ${
            data.notFound 
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            {data.notFound 
              ? 'QR code scanned but not found in database'
              : data.isBatch ? 'Batch information found' : 'Animal information found'
            }
          </p>
        </div>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className={`p-6 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {data.isBatch ? 'Batch ID:' : 'Animal ID:'}
              </span>
              <span className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {data.isBatch ? data.batchId : data.animalId || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Type:
              </span>
              <span className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {data.type?.name || 'Unknown'} {data.isBatch && '(Batch)'}
              </span>
            </div>
            {data.count && data.isBatch && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Count:
                </span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.count} animals
                </span>
              </div>
            )}
            
            {data.createdAt && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Created:
                </span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {formatDate(data.createdAt)}
                </span>
              </div>
            )}
            
            {data.notFound && data.rawData && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Raw QR Data:
                </span>
                <span className={`font-semibold text-xs break-all ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.rawData}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Location & Status */}
        <div className={`p-6 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Location & Status
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={`font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Zone:
              </span>
              <span className={`font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {data.assignedZone?.name || 'Not assigned'}
              </span>
            </div>
            {data.assignedZone?.type && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Zone Type:
                </span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.assignedZone.type}
                </span>
              </div>
            )}
            {data.assignedZone?.currentOccupancy !== undefined && data.assignedZone?.capacity !== undefined && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Occupancy:
                </span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.assignedZone.currentOccupancy} / {data.assignedZone.capacity}
                </span>
              </div>
            )}
            {data.data?.healthStatus && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Health Status:
                </span>
                <span className={`font-semibold ${getHealthStatusColor(data.data.healthStatus)}`}>
                  {data.data.healthStatus}
                </span>
              </div>
            )}
            {data.data?.status && (
              <div className="flex justify-between">
                <span className={`font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Overall Status:
                </span>
                <span className={`font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {data.data.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Dynamic Data */}
      {data.data && Object.keys(data.data).length > 0 && (
        <div className={`p-6 rounded-xl border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Additional Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.data).map(([key, value]) => {
              // Exclude fields already displayed
              if (['healthStatus', 'status', 'batchId'].includes(key)) return null;
              if (typeof value === 'object' && value !== null) return null; // Skip nested objects for now

              return (
                <div key={key} className="flex justify-between items-center">
                  <span className={`font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </span>
                  <span className={`font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onScanAnother}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Scan Another
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
        >
          <X className="h-5 w-5" />
          Close
        </button>
      </div>
    </div>
  );
};

export default QRScanner;