import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { jsPDF } from "jspdf";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer, faPencilAlt, faEraser, faSquare, faCircle,
  faMinus, faPlay, faFont, faImage, faPaintBrush,
  faFillDrip, faBrush, faTrashAlt, faFilePdf, faSave, faUndo, faRedo
} from "@fortawesome/free-solid-svg-icons";
import { faSquare as faSquareRegular, faCircle as faCircleRegular } from "@fortawesome/free-regular-svg-icons";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // State
  const [activeTool, setActiveTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState("#000000ff");
  const [fillColor, setFillColor] = useState("#ffffffff");
  const [textInput, setTextInput] = useState("Your text here");
  const [canvasName, setCanvasName] = useState(`Farm Design - ${type || "New Plan"}`);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  // Canvas state
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  const tools = [
    { tool: "select", icon: faMousePointer, label: "Select" },
    { tool: "pencil", icon: faPencilAlt, label: "Pencil" },
    { tool: "erase", icon: faEraser, label: "Eraser" },
    { tool: "rect", icon: faSquareRegular, label: "Rectangle" },
    { tool: "circle", icon: faCircleRegular, label: "Circle" },
    { tool: "line", icon: faMinus, label: "Line" },
    { tool: "triangle", icon: faPlay, label: "Triangle" },
    { tool: "text", icon: faFont, label: "Text" },
    { tool: "image", icon: faImage, label: "Image" },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set canvas background
      ctx.fillStyle = darkMode ? "#1F2937" : "#ffffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Save initial state
      saveCanvasState();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [darkMode]);

  // Save canvas state for undo/redo
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setCanvasHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataURL);
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  }, [historyStep]);

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Drawing functions
  const startDrawing = (e) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (activeTool === "pencil") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else if (activeTool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize, 0, 2 * Math.PI);
      ctx.fill();
    } else if (activeTool === "text") {
      setTextPosition(pos);
      setShowTextInput(true);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;

    if (activeTool === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (activeTool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    ctx.fillStyle = fillColor;

    // Draw shapes
    if (activeTool === "rect") {
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;
      ctx.fillRect(startPos.x, startPos.y, width, height);
      ctx.strokeRect(startPos.x, startPos.y, width, height);
    } else if (activeTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (activeTool === "line") {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (activeTool === "triangle") {
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;
      ctx.beginPath();
      ctx.moveTo(startPos.x + width / 2, startPos.y);
      ctx.lineTo(startPos.x, startPos.y + height);
      ctx.lineTo(startPos.x + width, startPos.y + height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    setIsDrawing(false);
    saveCanvasState();
  };

  // Add text to canvas
  const addText = () => {
    if (!textInput.trim()) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${brushSize * 4}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPosition.x, textPosition.y);
    
    setShowTextInput(false);
    saveCanvasState();
  };

  // Add image to canvas
  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Calculate size to fit canvas
        const maxWidth = canvas.width * 0.5;
        const maxHeight = canvas.height * 0.5;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        
        // Draw image at center
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        saveCanvasState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Clear canvas
  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the canvas?")) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = darkMode ? "#1F2937" : "#F3F4F6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      saveCanvasState();
    }
  };

  // Undo/Redo functions
  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep - 1];
    }
  };

  const redo = () => {
    if (historyStep < canvasHistory.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep + 1];
    }
  };

  // Export PDF
  const exportPDF = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${canvasName.replace(/ /g, "_")}.pdf`);
  };

  // Save design
  const saveDesign = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL();
      
      // Here you would save to your backend
      console.log("Saving design:", dataURL);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Design saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save design");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`${darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"} p-4 md:p-6 min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{canvasName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Design your farm layout</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={undo}
            disabled={historyStep <= 0}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faUndo} /> Undo
          </button>
          <button 
            onClick={redo}
            disabled={historyStep >= canvasHistory.length - 1}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faRedo} /> Redo
          </button>
          <button 
            onClick={clearCanvas} 
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faTrashAlt} /> Clear
          </button>
          <button 
            onClick={exportPDF} 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <FontAwesomeIcon icon={faFilePdf} /> Export PDF
          </button>
          <button 
            onClick={saveDesign} 
            disabled={isSaving} 
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-70 transition-colors"
          >
            <FontAwesomeIcon icon={faSave} /> {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* Toolbox */}
        <div className={`flex flex-col gap-3 p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-md"} w-full lg:w-64 h-fit`}>
          <h3 className="font-medium text-sm mb-2">Tools</h3>
          
          {/* Tool buttons */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {tools.map((t) => (
              <button 
                key={t.tool} 
                onClick={() => {
                  setActiveTool(t.tool);
                  setShowTextInput(false);
                }} 
                className={`p-3 flex items-center gap-2 rounded-md transition-colors ${
                  activeTool === t.tool 
                    ? (darkMode ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800") 
                    : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")
                }`} 
                title={t.label}
              >
                <FontAwesomeIcon icon={t.icon} className="text-lg" />
                <span className="text-sm hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col gap-4 border-t pt-4 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faPaintBrush} /> Stroke
              </label>
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)} 
                className="w-8 h-8 rounded border-0 cursor-pointer" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faFillDrip} /> Fill
              </label>
              <input 
                type="color" 
                value={fillColor} 
                onChange={(e) => setFillColor(e.target.value)} 
                className="w-8 h-8 rounded border-0 cursor-pointer" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faBrush} /> Size: {brushSize}px
              </label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                className="w-full"
              />
            </div>

            {/* Text input */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faFont} /> Text
              </label>
              <input 
                type="text" 
                value={textInput} 
                onChange={(e) => setTextInput(e.target.value)} 
                placeholder="Enter text here"
                className="border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>

            {/* Image upload */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <FontAwesomeIcon icon={faImage} /> Add Image
              </label>
              <input 
                type="file" 
                onChange={addImage} 
                accept="image/*" 
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 min-h-[600px] rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
          <canvas 
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="w-full h-full block cursor-crosshair"
            style={{
              cursor: activeTool === 'select' ? 'default' : 
                     activeTool === 'erase' ? 'grab' : 
                     activeTool === 'text' ? 'text' : 'crosshair'
            }}
          />
          
          {/* Text input overlay */}
          {showTextInput && (
            <div 
              className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 shadow-lg"
              style={{
                left: textPosition.x + 10,
                top: textPosition.y + 10,
              }}
            >
              <input 
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addText()}
                className="border rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter text"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={addText}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
                >
                  Add
                </button>
                <button 
                  onClick={() => setShowTextInput(false)}
                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}