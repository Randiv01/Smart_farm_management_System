import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { jsPDF } from "jspdf";
import {
  MousePointer2, Pencil, Square, Circle, Minus, Type, Image as ImageIcon,
  Paintbrush, Droplet, Brush, Trash2, Download, Save, Undo, Redo, Grid
} from "lucide-react";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // State
  const [activeTool, setActiveTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [textInput, setTextInput] = useState("Shelter Label");
  const [canvasName, setCanvasName] = useState(`Farm Layout - ${type || "New Plan"}`);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState([]); // Store drawn objects
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(null); // Track selected object
  const [isDragging, setIsDragging] = useState(false); // Track dragging state
  const [isResizing, setIsResizing] = useState(false); // Track resizing state
  const [resizeHandle, setResizeHandle] = useState(null); // Track which handle is being resized
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Offset for dragging
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(false); // Grid toggle
  const [gridSize, setGridSize] = useState(50); // Grid size in pixels
  const [currentMeasurement, setCurrentMeasurement] = useState(null); // Real-time measurement

  const tools = [
    { tool: "select", icon: MousePointer2, label: "Select / Move / Resize" },
    { tool: "pencil", icon: Pencil, label: "Freehand" },
    { tool: "rect", icon: Square, label: "Shelter (Rectangle)" },
    { tool: "circle", icon: Circle, label: "Circular Pen" },
    { tool: "line", icon: Minus, label: "Fence Line" },
    { tool: "text", icon: Type, label: "Label" },
    { tool: "image", icon: ImageIcon, label: "Add Image" },
  ];

  // Conversion factor: 1 pixel = 0.01 meters (adjustable)
  const PIXEL_TO_METER = 0.01;

  // Initialize canvas and keydown listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Handle Delete key
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedObjectIndex !== null) {
        setObjects((prev) => prev.filter((_, index) => index !== selectedObjectIndex));
        setSelectedObjectIndex(null);
        redrawCanvas();
        saveCanvasState();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [darkMode, objects, selectedObjectIndex]);

  // Save canvas state for undo/redo
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();
    setCanvasHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataURL);
      return newHistory;
    });
    setHistoryStep((prev) => prev + 1);
  }, [historyStep]);

  // Snap coordinates to grid
  const snapToGrid = (coord) => {
    if (!showGrid) return coord;
    return Math.round(coord / gridSize) * gridSize;
  };

  // Redraw all objects, rulers, and grid on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = darkMode ? "#1F2937" : "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = darkMode ? "#4B5563" : "#E5E7EB";
      ctx.lineWidth = 1;
      for (let x = gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw rulers
    ctx.fillStyle = darkMode ? "#374151" : "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, 20); // Top ruler
    ctx.fillRect(0, 0, 20, canvas.height); // Left ruler
    ctx.strokeStyle = darkMode ? "#9CA3AF" : "#6B7280";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";
    ctx.fillStyle = darkMode ? "#D1D5DB" : "#374151";
    // Horizontal ruler ticks
    for (let x = 50; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 10);
      ctx.stroke();
      ctx.fillText(`${(x * PIXEL_TO_METER).toFixed(1)}m`, x + 2, 12);
    }
    // Vertical ruler ticks
    for (let y = 50; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(10, y);
      ctx.stroke();
      ctx.fillText(`${(y * PIXEL_TO_METER).toFixed(1)}m`, 2, y + 12);
    }

    
    // Draw objects
    objects.forEach((obj, index) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = obj.brushSize || brushSize;
      ctx.strokeStyle = obj.color || color;
      ctx.fillStyle = obj.fillColor || fillColor;

      if (obj.type === "pencil") {
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        obj.points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      } else if (obj.type === "rect") {
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      } else if (obj.type === "circle") {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (obj.type === "line") {
        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();
      } else if (obj.type === "text") {
        ctx.font = `${obj.fontSize || brushSize * 4}px Arial`;
        ctx.fillStyle = obj.color || color;
        ctx.fillText(obj.text, obj.x, obj.y);
      } else if (obj.type === "image") {
        ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
      }

      // Highlight selected object and draw resize handles
      if (selectedObjectIndex === index && obj.type !== "pencil") {
        ctx.strokeStyle = "#10b981"; // Green for selection
        ctx.lineWidth = 2;
        if (obj.type === "circle") {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius + 5, 0, 2 * Math.PI);
          ctx.stroke();
          // Resize handle at right edge
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x + obj.radius - 5, obj.y - 5, 10, 10);
        } else if (obj.type === "line") {
          ctx.beginPath();
          ctx.moveTo(obj.x1 - 5, obj.y1 - 5);
          ctx.lineTo(obj.x2 + 5, obj.y2 + 5);
          ctx.stroke();
          // Resize handles at endpoints
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x1 - 5, obj.y1 - 5, 10, 10);
          ctx.fillRect(obj.x2 - 5, obj.y2 - 5, 10, 10);
        } else if (obj.type === "rect" || obj.type === "image") {
          ctx.strokeRect(obj.x - 5, obj.y - 5, obj.width + 10, obj.height + 10);
          // Resize handles at corners
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x - 5, obj.y - 5, 10, 10); // Top-left
          ctx.fillRect(obj.x + obj.width - 5, obj.y - 5, 10, 10); // Top-right
          ctx.fillRect(obj.x - 5, obj.y + obj.height - 5, 10, 10); // Bottom-left
          ctx.fillRect(obj.x + obj.width - 5, obj.y + obj.height - 5, 10, 10); // Bottom-right
        }
      }
    });

    // Draw current measurement if any
    if (currentMeasurement) {
      ctx.fillStyle = darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)";
      ctx.strokeStyle = darkMode ? "#D1D5DB" : "#374151";
      ctx.lineWidth = 1;
      ctx.fillRect(currentMeasurement.x, currentMeasurement.y, 120, 30);
      ctx.strokeRect(currentMeasurement.x, currentMeasurement.y, 120, 30);
      ctx.fillStyle = darkMode ? "#D1D5DB" : "#374151";
      ctx.font = "12px Arial";
      ctx.fillText(currentMeasurement.text, currentMeasurement.x + 5, currentMeasurement.y + 20);
    }
  }, [objects, selectedObjectIndex, darkMode, brushSize, color, fillColor, showGrid, gridSize, currentMeasurement]);

  // Get mouse position relative to canvas
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Check if a point is inside an object or its resize handles
  const isPointInObject = (x, y, obj) => {
    if (obj.type === "rect" || obj.type === "image") {
      return (
        x >= obj.x &&
        x <= obj.x + obj.width &&
        y >= obj.y &&
        y <= obj.y + obj.height
      );
    } else if (obj.type === "circle") {
      const dx = x - obj.x;
      const dy = y - obj.y;
      return Math.sqrt(dx * dx + dy * dy) <= obj.radius;
    } else if (obj.type === "line") {
      const [x1, y1, x2, y2] = [obj.x1, obj.y1, obj.x2, obj.y2];
      const dist = Math.abs(
        (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1
      ) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return dist <= 5;
    } else if (obj.type === "text") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.font = `${obj.fontSize || brushSize * 4}px Arial`;
      const metrics = ctx.measureText(obj.text);
      return (
        x >= obj.x &&
        x <= obj.x + metrics.width &&
        y >= obj.y - (obj.fontSize || brushSize * 4) &&
        y <= obj.y
      );
    }
    return false;
  };

  const isPointInResizeHandle = (x, y, obj, index) => {
    if (obj.type === "rect" || obj.type === "image") {
      const handles = [
        { x: obj.x, y: obj.y, handle: "top-left" },
        { x: obj.x + obj.width, y: obj.y, handle: "top-right" },
        { x: obj.x, y: obj.y + obj.height, handle: "bottom-left" },
        { x: obj.x + obj.width, y: obj.y + obj.height, handle: "bottom-right" },
      ];
      return handles.find((h) => x >= h.x - 5 && x <= h.x + 5 && y >= h.y - 5 && y <= h.y + 5);
    } else if (obj.type === "circle") {
      const handleX = obj.x + obj.radius;
      const handleY = obj.y;
      return x >= handleX - 5 && x <= handleX + 5 && y >= handleY - 5 && y <= handleY + 5
        ? { handle: "right", x: handleX, y: handleY }
        : null;
    } else if (obj.type === "line") {
      const handles = [
        { x: obj.x1, y: obj.y1, handle: "start" },
        { x: obj.x2, y: obj.y2, handle: "end" },
      ];
      return handles.find((h) => x >= h.x - 5 && x <= h.x + 5 && y >= h.y - 5 && y <= h.y + 5);
    }
    return null;
  };

  // Drawing functions
  const startDrawing = (e) => {
    const pos = getMousePos(e);
    setStartPos({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (activeTool === "select") {
      let foundIndex = null;
      let resizeHandle = null;
      for (let i = objects.length - 1; i >= 0; i--) {
        resizeHandle = isPointInResizeHandle(pos.x, pos.y, objects[i]);
        if (resizeHandle) {
          foundIndex = i;
          break;
        } else if (isPointInObject(pos.x, pos.y, objects[i])) {
          foundIndex = i;
          break;
        }
      }
      setSelectedObjectIndex(foundIndex);
      setResizeHandle(resizeHandle ? resizeHandle.handle : null);
      if (foundIndex !== null) {
        if (resizeHandle) {
          setIsResizing(true);
        } else {
          setIsDragging(true);
          setDragOffset({
            x: pos.x - objects[foundIndex].x,
            y: pos.y - objects[foundIndex].y,
          });
        }
      }
      redrawCanvas();
    } else if (activeTool === "pencil") {
      setIsDrawing(true);
      setObjects((prev) => [
        ...prev,
        { type: "pencil", points: [{ x: snapToGrid(pos.x), y: snapToGrid(pos.y) }], brushSize, color },
      ]);
      ctx.beginPath();
      ctx.moveTo(snapToGrid(pos.x), snapToGrid(pos.y));
    } else if (activeTool === "text") {
      setTextPosition({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) });
      setShowTextInput(true);
    } else {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.fillStyle = fillColor;
    }
  };

  const draw = (e) => {
    if (!isDrawing && !isDragging && !isResizing) return;

    const pos = getMousePos(e);
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (isDragging && selectedObjectIndex !== null) {
      setObjects((prev) => {
        const newObjects = [...prev];
        const obj = newObjects[selectedObjectIndex];
        obj.x = snappedPos.x - dragOffset.x;
        obj.y = snappedPos.y - dragOffset.y;
        if (obj.type === "line") {
          const dx = obj.x2 - obj.x1;
          const dy = obj.y2 - obj.y1;
          obj.x1 = obj.x;
          obj.y1 = obj.y;
          obj.x2 = obj.x + dx;
          obj.y2 = obj.y + dy;
        }
        return newObjects;
      });
      redrawCanvas();
    } else if (isResizing && selectedObjectIndex !== null) {
      setObjects((prev) => {
        const newObjects = [...prev];
        const obj = newObjects[selectedObjectIndex];
        if (obj.type === "rect" || obj.type === "image") {
          if (resizeHandle === "top-left") {
            const dx = snappedPos.x - obj.x;
            const dy = snappedPos.y - obj.y;
            obj.width -= dx;
            obj.height -= dy;
            obj.x = snappedPos.x;
            obj.y = snappedPos.y;
          } else if (resizeHandle === "top-right") {
            obj.width = snappedPos.x - obj.x;
            obj.height = obj.y + obj.height - snappedPos.y;
            obj.y = snappedPos.y;
          } else if (resizeHandle === "bottom-left") {
            obj.width = obj.x + obj.width - snappedPos.x;
            obj.x = snappedPos.x;
            obj.height = snappedPos.y - obj.y;
          } else if (resizeHandle === "bottom-right") {
            obj.width = snappedPos.x - obj.x;
            obj.height = snappedPos.y - obj.y;
          }
          // Ensure minimum size
          obj.width = Math.max(obj.width, 10);
          obj.height = Math.max(obj.height, 10);
        } else if (obj.type === "circle") {
          obj.radius = Math.max(
            Math.sqrt(Math.pow(snappedPos.x - obj.x, 2) + Math.pow(snappedPos.y - obj.y, 2)),
            10
          );
        } else if (obj.type === "line") {
          if (resizeHandle === "start") {
            obj.x1 = snappedPos.x;
            obj.y1 = snappedPos.y;
          } else if (resizeHandle === "end") {
            obj.x2 = snappedPos.x;
            obj.y2 = snappedPos.y;
          }
        }
        return newObjects;
      });
      // Update measurements
      const obj = objects[selectedObjectIndex];
      let measurementText = "";
      if (obj.type === "rect" || obj.type === "image") {
        measurementText = `W: ${(obj.width * PIXEL_TO_METER).toFixed(1)}m, H: ${(obj.height * PIXEL_TO_METER).toFixed(1)}m`;
      } else if (obj.type === "circle") {
        measurementText = `R: ${(obj.radius * PIXEL_TO_METER).toFixed(1)}m`;
      } else if (obj.type === "line") {
        const length = Math.sqrt(Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2));
        measurementText = `L: ${(length * PIXEL_TO_METER).toFixed(1)}m`;
      }
      setCurrentMeasurement({
        x: snappedPos.x + 10,
        y: snappedPos.y + 10,
        text: measurementText,
      });
      redrawCanvas();
    } else if (isDrawing) {
      redrawCanvas();
      ctx.globalCompositeOperation = "source-over";
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = color;
      ctx.fillStyle = fillColor;

      let measurementText = "";
      if (activeTool === "pencil") {
        ctx.lineCap = "round";
        ctx.lineTo(snappedPos.x, snappedPos.y);
        ctx.stroke();
        setObjects((prev) => {
          const newObjects = [...prev];
          newObjects[newObjects.length - 1].points.push(snappedPos);
          return newObjects;
        });
      } else if (activeTool === "rect") {
        const width = snappedPos.x - startPos.x;
        const height = snappedPos.y - startPos.y;
        ctx.fillRect(startPos.x, startPos.y, width, height);
        ctx.strokeRect(startPos.x, startPos.y, width, height);
        measurementText = `W: ${(width * PIXEL_TO_METER).toFixed(1)}m, H: ${(height * PIXEL_TO_METER).toFixed(1)}m`;
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2)
        );
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        measurementText = `R: ${(radius * PIXEL_TO_METER).toFixed(1)}m`;
      } else if (activeTool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(snappedPos.x, snappedPos.y);
        ctx.stroke();
        const length = Math.sqrt(
          Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2)
        );
        measurementText = `L: ${(length * PIXEL_TO_METER).toFixed(1)}m`;
      }
      if (measurementText) {
        setCurrentMeasurement({
          x: snappedPos.x + 10,
          y: snappedPos.y + 10,
          text: measurementText,
        });
      }
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing && !isDragging && !isResizing) return;

    const pos = getMousePos(e);
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };

    if (isDrawing) {
      if (activeTool === "rect") {
        const width = snappedPos.x - startPos.x;
        const height = snappedPos.y - startPos.y;
        setObjects((prev) => [
          ...prev,
          { type: "rect", x: startPos.x, y: startPos.y, width, height, brushSize, color, fillColor },
        ]);
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2)
        );
        setObjects((prev) => [
          ...prev,
          { type: "circle", x: startPos.x, y: startPos.y, radius, brushSize, color, fillColor },
        ]);
      } else if (activeTool === "line") {
        setObjects((prev) => [
          ...prev,
          { type: "line", x1: startPos.x, y1: startPos.y, x2: snappedPos.x, y2: snappedPos.y, brushSize, color },
        ]);
      }
      redrawCanvas();
      saveCanvasState();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setCurrentMeasurement(null);
  };
  useEffect(() => {
            document.title = "FarmDesigner - Animal Manager";
        }, []);

  // Add text to canvas
  const addText = () => {
    if (!textInput.trim()) return;

    setObjects((prev) => [
      ...prev,
      { type: "text", text: textInput, x: textPosition.x, y: textPosition.y, fontSize: brushSize * 4, color },
    ]);
    setShowTextInput(false);
    redrawCanvas();
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
        const maxWidth = canvas.width * 0.5;
        const maxHeight = canvas.height * 0.5;
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const width = img.width * ratio;
        const height = img.height * ratio;
        const x = snapToGrid((canvas.width - width) / 2);
        const y = snapToGrid((canvas.height - height) / 2);

        setObjects((prev) => [
          ...prev,
          { type: "image", image: img, x, y, width, height },
        ]);
        redrawCanvas();
        saveCanvasState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Clear canvas
  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the farm layout?")) {
      setObjects([]);
      setSelectedObjectIndex(null);
      redrawCanvas();
      saveCanvasState();
    }
  };

  // Undo/Redo functions
  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep - 1];
      setSelectedObjectIndex(null);
    }
  };

  const redo = () => {
    if (historyStep < canvasHistory.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyStep + 1];
      setSelectedObjectIndex(null);
    }
  };

  // Export PDF
  const exportPDF = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(dataURL, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${canvasName.replace(/ /g, "_")}.pdf`);
  };

  // Save design
  const saveDesign = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL();
      console.log("Saving farm layout:", dataURL);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Farm layout saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save farm layout");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Pencil className="text-blue-600 dark:text-blue-400" size={32} />
              {canvasName}
            </h1>
            <p className={`mt-2 text-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Plan farm shelters and buildings with measurements for animal management
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              } transition-all`}
            >
              <Undo size={18} />
              Undo
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= canvasHistory.length - 1}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
              } transition-all`}
            >
              <Redo size={18} />
              Redo
            </button>
            <button
              onClick={clearCanvas}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
                darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
              } transition-all`}
            >
              <Trash2 size={18} />
              Clear
            </button>
            <button
              onClick={exportPDF}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
                darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-all`}
            >
              <Download size={18} />
              Export PDF
            </button>
            <button
              onClick={saveDesign}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${
                darkMode
                  ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:text-gray-400"
                  : "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-500 disabled:text-gray-300"
              } transition-all`}
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Toolbox */}
        <div className={`flex flex-col gap-3 p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg w-full lg:w-64 h-fit`}>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brush size={20} />
            Tools
          </h3>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {tools.map((t) => (
              <button
                key={t.tool}
                onClick={() => {
                  setActiveTool(t.tool);
                  setShowTextInput(false);
                  setSelectedObjectIndex(null);
                }}
                className={`p-3 flex items-center gap-2 rounded-lg transition-all ${
                  activeTool === t.tool
                    ? darkMode
                      ? "bg-blue-900 text-blue-200"
                      : "bg-blue-100 text-blue-800"
                    : darkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                }`}
                title={t.label}
              >
                <t.icon size={18} />
                <span className="text-sm hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-4 border-t pt-4 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Paintbrush size={16} />
                Stroke Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Droplet size={16} />
                Fill Color
              </label>
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-8 h-8 rounded-full border-0 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Brush size={16} />
                Size: {brushSize}px
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
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Type size={16} />
                Label Text
              </label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter shelter label"
                className={`px-3 py-2.5 rounded-lg border ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <ImageIcon size={16} />
                Add Image
              </label>
              <input
                type="file"
                onChange={addImage}
                accept="image/*"
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-800"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Grid size={16} />
                Grid Size: {gridSize}px
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Grid size={16} />
                Show Grid
              </label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={() => setShowGrid(!showGrid)}
                className="w-5 h-5 rounded"
              />
            </div>
            <div className="text-sm">
              <p>Unit: 1px = {PIXEL_TO_METER}m</p>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className={`flex-1 min-h-[600px] rounded-2xl overflow-hidden border ${
          darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
        } shadow-lg relative`}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="w-full h-full block cursor-crosshair"
            style={{
              cursor:
                activeTool === "select"
                  ? isResizing
                    ? "nwse-resize"
                    : "pointer"
                  : activeTool === "text"
                  ? "text"
                  : "crosshair",
            }}
          />
          {showTextInput && (
            <div
              className={`absolute p-3 rounded-lg shadow-lg border ${
                darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
              }`}
              style={{
                left: Math.min(textPosition.x + 10, canvasRef.current.width - 200),
                top: Math.min(textPosition.y + 10, canvasRef.current.height - 100),
              }}
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") addText();
                }}
                className={`px-2 py-1.5 rounded border text-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter label"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={addText}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowTextInput(false)}
                  className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
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