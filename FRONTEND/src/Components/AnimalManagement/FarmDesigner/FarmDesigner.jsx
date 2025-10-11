import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.js";
import { jsPDF } from "jspdf";
import {
  MousePointer2, Pencil, Square, Circle, Minus, Type, Image as ImageIcon,
  Paintbrush, Droplet, Brush, Trash2, Download, Save, Undo, Redo, Grid,
  Maximize, Minimize, Hand
} from "lucide-react";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const designerContainerRef = useRef(null);
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  // State
  const [activeTool, setActiveTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState(darkMode ? "#FFFFFF" : "#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [textInput, setTextInput] = useState("Shelter Label");
  const [canvasName, setCanvasName] = useState(`Farm Layout - ${type || "New Plan"}`);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState([]);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [currentMeasurement, setCurrentMeasurement] = useState(null);

  // State for panning, zooming, and fullscreen
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State-based history for robust undo/redo
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const tools = [
    { tool: "select", icon: MousePointer2, label: "Select / Move / Resize" },
    { tool: "pencil", icon: Pencil, label: "Freehand" },
    { tool: "rect", icon: Square, label: "Shelter (Rectangle)" },
    { tool: "circle", icon: Circle, label: "Circular Pen" },
    { tool: "line", icon: Minus, label: "Fence Line" },
    { tool: "text", icon: Type, label: "Label" },
    { tool: "image", icon: ImageIcon, label: "Add Image" },
  ];

  const PIXEL_TO_METER = 0.01;

  useEffect(() => {
    setColor(darkMode ? "#FFFFFF" : "#000000");
  }, [darkMode]);

  const saveState = useCallback(() => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(objects);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep, objects]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = darkMode ? "#1F2937" : "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewOffset.x, viewOffset.y);
    ctx.scale(scale, scale);

    const minWorldX = (0 - viewOffset.x) / scale;
    const maxWorldX = (canvas.width - viewOffset.x) / scale;
    const minWorldY = (0 - viewOffset.y) / scale;
    const maxWorldY = (canvas.height - viewOffset.y) / scale;

    if (showGrid) {
      ctx.strokeStyle = darkMode ? "#4B5563" : "#E5E7EB";
      ctx.lineWidth = 0.5 / scale;
      const startX = Math.floor(minWorldX / gridSize) * gridSize;
      const endX = Math.ceil(maxWorldX / gridSize) * gridSize;
      for (let wx = startX; wx <= endX; wx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(wx, minWorldY);
        ctx.lineTo(wx, maxWorldY);
        ctx.stroke();
      }
      const startY = Math.floor(minWorldY / gridSize) * gridSize;
      const endY = Math.ceil(maxWorldY / gridSize) * gridSize;
      for (let wy = startY; wy <= endY; wy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(minWorldX, wy);
        ctx.lineTo(maxWorldX, wy);
        ctx.stroke();
      }
    }

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
      } else if (obj.type === "image" && obj.image) {
        ctx.drawImage(obj.image, obj.x, obj.y, obj.width, obj.height);
      }

      if (selectedObjectIndex === index && obj.type !== "pencil") {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2 / scale;
        const handleSize = 10 / scale;
        const halfHandle = handleSize / 2;
        if (obj.type === "circle") {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius + (5 / scale), 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x + obj.radius - halfHandle, obj.y - halfHandle, handleSize, handleSize);
        } else if (obj.type === "line") {
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x1 - halfHandle, obj.y1 - halfHandle, handleSize, handleSize);
          ctx.fillRect(obj.x2 - halfHandle, obj.y2 - halfHandle, handleSize, handleSize);
        } else if (obj.type === "rect" || obj.type === "image") {
          ctx.strokeRect(obj.x - (5 / scale), obj.y - (5 / scale), obj.width + (10 / scale), obj.height + (10 / scale));
          ctx.fillStyle = "#10b981";
          ctx.fillRect(obj.x - halfHandle, obj.y - halfHandle, handleSize, handleSize);
          ctx.fillRect(obj.x + obj.width - halfHandle, obj.y - halfHandle, handleSize, handleSize);
          ctx.fillRect(obj.x - halfHandle, obj.y + obj.height - halfHandle, handleSize, handleSize);
          ctx.fillRect(obj.x + obj.width - halfHandle, obj.y + obj.height - halfHandle, handleSize, handleSize);
        }
      }
    });

    ctx.restore();

    ctx.fillStyle = darkMode ? "#374151" : "#F3F4F6";
    ctx.fillRect(0, 0, canvas.width, 20);
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.strokeStyle = darkMode ? "#9CA3AF" : "#6B7280";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";
    ctx.fillStyle = darkMode ? "#D1D5DB" : "#374151";
    for (let x = 50; x < canvas.width; x += 50) {
      const worldX = (x - viewOffset.x) / scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 10);
      ctx.stroke();
      ctx.fillText(`${(worldX * PIXEL_TO_METER).toFixed(1)}m`, x + 2, 12);
    }
    for (let y = 50; y < canvas.height; y += 50) {
      const worldY = (y - viewOffset.y) / scale;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(10, y);
      ctx.stroke();
      ctx.fillText(`${(worldY * PIXEL_TO_METER).toFixed(1)}m`, 2, y + 12);
    }

    if (currentMeasurement) {
      ctx.fillStyle = darkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)";
      ctx.fillRect(currentMeasurement.x, currentMeasurement.y, 120, 30);
      ctx.fillStyle = darkMode ? "#D1D5DB" : "#374151";
      ctx.font = "12px Arial";
      ctx.fillText(currentMeasurement.text, currentMeasurement.x + 5, currentMeasurement.y + 20);
    }
  }, [objects, selectedObjectIndex, darkMode, brushSize, color, fillColor, showGrid, gridSize, currentMeasurement, viewOffset, scale]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleKeyDown = (e) => {
      if (e.key === " ") {
        setIsSpacePressed(true);
      }
      if (e.key === "Delete" && selectedObjectIndex !== null) {
        setObjects((prev) => prev.filter((_, index) => index !== selectedObjectIndex));
        setSelectedObjectIndex(null);
        saveState();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === " ") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const handleWheel = (e) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
      const oldScale = scale;
      const newScale = Math.max(0.5, Math.min(5, scale * zoomDelta));
      const worldX = (screenX - viewOffset.x) / oldScale;
      const worldY = (screenY - viewOffset.y) / oldScale;
      const newOffsetX = screenX - newScale * worldX;
      const newOffsetY = screenY - newScale * worldY;
      setScale(newScale);
      setViewOffset({ x: newOffsetX, y: newOffsetY });
    };
    canvas.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [redrawCanvas, saveState, selectedObjectIndex, scale, viewOffset]);

  const snapToGrid = (coord) => {
    if (!showGrid) return coord;
    return Math.round(coord / gridSize) * gridSize;
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: (screenX - viewOffset.x) / scale,
      y: (screenY - viewOffset.y) / scale,
    };
  };

  const isPointInObject = (x, y, obj) => {
    if (obj.type === "rect" || obj.type === "image") {
      return (x >= obj.x && x <= obj.x + obj.width && y >= obj.y && y <= obj.y + obj.height);
    } else if (obj.type === "circle") {
      const dx = x - obj.x;
      const dy = y - obj.y;
      return Math.sqrt(dx * dx + dy * dy) <= obj.radius;
    } else if (obj.type === "line") {
      const [x1, y1, x2, y2] = [obj.x1, obj.y1, obj.x2, obj.y2];
      const dist = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      return dist <= (5 / scale);
    } else if (obj.type === "text") {
      const ctx = canvasRef.current.getContext("2d");
      ctx.save();
      ctx.resetTransform();
      ctx.font = `${obj.fontSize || brushSize * 4}px Arial`;
      const metrics = ctx.measureText(obj.text);
      ctx.restore();
      const worldWidth = metrics.width / scale;
      const fontHeight = (obj.fontSize || brushSize * 4) / scale;
      return (x >= obj.x && x <= obj.x + worldWidth && y >= obj.y - fontHeight && y <= obj.y);
    }
    return false;
  };

  const isPointInResizeHandle = (x, y, obj) => {
    const handleSize = 10 / scale;
    const halfHandle = handleSize / 2;
    if (obj.type === "rect" || obj.type === "image") {
      const handles = [
        { x: obj.x, y: obj.y, handle: "top-left" },
        { x: obj.x + obj.width, y: obj.y, handle: "top-right" },
        { x: obj.x, y: obj.y + obj.height, handle: "bottom-left" },
        { x: obj.x + obj.width, y: obj.y + obj.height, handle: "bottom-right" },
      ];
      return handles.find((h) => x >= h.x - halfHandle && x <= h.x + halfHandle && y >= h.y - halfHandle && y <= h.y + halfHandle);
    } else if (obj.type === "circle") {
      const handleX = obj.x + obj.radius;
      const handleY = obj.y;
      return x >= handleX - halfHandle && x <= handleX + halfHandle && y >= handleY - halfHandle && y <= handleY + halfHandle ? { handle: "right", x: handleX, y: handleY } : null;
    } else if (obj.type === "line") {
      const handles = [
        { x: obj.x1, y: obj.y1, handle: "start" },
        { x: obj.x2, y: obj.y2, handle: "end" },
      ];
      return handles.find((h) => x >= h.x - halfHandle && x <= h.x + halfHandle && y >= h.y - halfHandle && y <= h.y + halfHandle);
    }
    return null;
  };

  const startDrawing = (e) => {
    if (isSpacePressed && e.button === 0) {
      setIsPanning(true);
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      return;
    }
    
    const pos = getMousePos(e);
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    setStartPos(snappedPos);

    if (activeTool === "select") {
      let foundIndex = null;
      let detectedResizeHandle = null;
      for (let i = objects.length - 1; i >= 0; i--) {
        detectedResizeHandle = isPointInResizeHandle(pos.x, pos.y, objects[i]);
        if (detectedResizeHandle) {
          foundIndex = i;
          break;
        } else if (isPointInObject(pos.x, pos.y, objects[i])) {
          foundIndex = i;
          break;
        }
      }
      setSelectedObjectIndex(foundIndex);
      if (foundIndex !== null) {
        if (detectedResizeHandle) {
          setIsResizing(true);
          setResizeHandle(detectedResizeHandle.handle);
        } else {
          setIsDragging(true);
          setDragOffset({
            x: pos.x - objects[foundIndex].x,
            y: pos.y - objects[foundIndex].y,
          });
        }
      }
    } else if (activeTool === "pencil") {
      setIsDrawing(true);
      setObjects((prev) => [
        ...prev,
        { type: "pencil", points: [snappedPos], brushSize, color },
      ]);
    } else if (activeTool === "text") {
      setTextPosition(snappedPos);
      setShowTextInput(true);
    } else {
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      setViewOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    if (!isDrawing && !isDragging && !isResizing) return;
    
    const pos = getMousePos(e);
    const screenPos = { x: e.clientX - canvasRef.current.getBoundingClientRect().left, y: e.clientY - canvasRef.current.getBoundingClientRect().top };
    const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };

    if (isDragging && selectedObjectIndex !== null) {
        setObjects((prev) => {
          const newObjects = [...prev];
          const obj = { ...newObjects[selectedObjectIndex] };
          
          if (obj.type === "line") {
              const dx = snappedPos.x - dragOffset.x - obj.x1;
              const dy = snappedPos.y - dragOffset.y - obj.y1;
              obj.x1 += dx;
              obj.y1 += dy;
              obj.x2 += dx;
              obj.y2 += dy;
          } else {
              obj.x = snappedPos.x - dragOffset.x;
              obj.y = snappedPos.y - dragOffset.y;
          }
          newObjects[selectedObjectIndex] = obj;
          return newObjects;
        });
    } else if (isResizing && selectedObjectIndex !== null) {
        setObjects((prev) => {
          const newObjects = [...prev];
          const obj = { ...newObjects[selectedObjectIndex] };
          if (obj.type === "rect" || obj.type === "image") {
              const originalX = obj.x;
              const originalY = obj.y;
              const originalWidth = obj.width;
              const originalHeight = obj.height;

              if (resizeHandle === "bottom-right") {
                  obj.width = snappedPos.x - originalX;
                  obj.height = snappedPos.y - originalY;
              } else if (resizeHandle === "bottom-left") {
                  obj.width = originalX + originalWidth - snappedPos.x;
                  obj.x = snappedPos.x;
                  obj.height = snappedPos.y - originalY;
              } else if (resizeHandle === "top-right") {
                  obj.width = snappedPos.x - originalX;
                  obj.height = originalY + originalHeight - snappedPos.y;
                  obj.y = snappedPos.y;
              } else if (resizeHandle === "top-left") {
                  obj.width = originalX + originalWidth - snappedPos.x;
                  obj.height = originalY + originalHeight - snappedPos.y;
                  obj.x = snappedPos.x;
                  obj.y = snappedPos.y;
              }
              obj.width = Math.max(obj.width, 10);
              obj.height = Math.max(obj.height, 10);
          } else if (obj.type === "circle") {
              obj.radius = Math.max(Math.sqrt(Math.pow(snappedPos.x - obj.x, 2) + Math.pow(snappedPos.y - obj.y, 2)), 10);
          } else if (obj.type === "line") {
              if (resizeHandle === "start") {
                  obj.x1 = snappedPos.x;
                  obj.y1 = snappedPos.y;
              } else if (resizeHandle === "end") {
                  obj.x2 = snappedPos.x;
                  obj.y2 = snappedPos.y;
              }
          }
          newObjects[selectedObjectIndex] = obj;
          return newObjects;
        });
    } else if (isDrawing) {
        redrawCanvas();
        const ctx = canvasRef.current.getContext("2d");
        ctx.save();
        ctx.translate(viewOffset.x, viewOffset.y);
        ctx.scale(scale, scale);
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = color;
        ctx.fillStyle = fillColor;

        let measurementText = "";
        if (activeTool === "pencil") {
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
          measurementText = `W: ${(Math.abs(width) * PIXEL_TO_METER).toFixed(1)}m, H: ${(Math.abs(height) * PIXEL_TO_METER).toFixed(1)}m`;
        } else if (activeTool === "circle") {
          const radius = Math.sqrt(Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2));
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
          const length = Math.sqrt(Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2));
          measurementText = `L: ${(length * PIXEL_TO_METER).toFixed(1)}m`;
        }
        ctx.restore();
        if (measurementText) {
          setCurrentMeasurement({ x: screenPos.x + 15, y: screenPos.y + 15, text: measurementText });
        }
    }
  };

  const stopDrawing = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing) {
        const pos = getMousePos(e);
        const snappedPos = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
        if (activeTool === "rect") {
            const width = snappedPos.x - startPos.x;
            const height = snappedPos.y - startPos.y;
            const finalRect = { type: "rect", brushSize, color, fillColor, 
                x: width > 0 ? startPos.x : snappedPos.x, 
                y: height > 0 ? startPos.y : snappedPos.y, 
                width: Math.abs(width), 
                height: Math.abs(height) 
            };
            if(finalRect.width > 0 && finalRect.height > 0) setObjects(prev => [...prev, finalRect]);
        } else if (activeTool === "circle") {
            const radius = Math.sqrt(Math.pow(snappedPos.x - startPos.x, 2) + Math.pow(snappedPos.y - startPos.y, 2));
            if(radius > 0) setObjects(prev => [...prev, { type: "circle", x: startPos.x, y: startPos.y, radius, brushSize, color, fillColor }]);
        } else if (activeTool === "line") {
            if(snappedPos.x !== startPos.x || snappedPos.y !== startPos.y) setObjects(prev => [...prev, { type: "line", x1: startPos.x, y1: startPos.y, x2: snappedPos.x, y2: snappedPos.y, brushSize, color }]);
        }
    }

    if (isDrawing || isDragging || isResizing) {
        saveState();
    }

    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setCurrentMeasurement(null);
  };
    
  useEffect(() => {
    document.title = "FarmDesigner - Animal Manager";
  }, []);

  const addText = () => {
    if (!textInput.trim()) return;
    setObjects((prev) => [...prev, { type: "text", text: textInput, x: textPosition.x, y: textPosition.y, fontSize: brushSize * 4, color }]);
    setShowTextInput(false);
    saveState();
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const maxScreenWidth = canvas.width * 0.5;
        const maxScreenHeight = canvas.height * 0.5;
        const ratio = Math.min(maxScreenWidth / img.width, maxScreenHeight / img.height);
        const worldWidth = (img.width * ratio) / scale;
        const worldHeight = (img.height * ratio) / scale;
        const worldCenterX = (canvas.width / 2 - viewOffset.x) / scale;
        const worldCenterY = (canvas.height / 2 - viewOffset.y) / scale;
        const x = snapToGrid(worldCenterX - worldWidth / 2);
        const y = snapToGrid(worldCenterY - worldHeight / 2);
        setObjects((prev) => [...prev, { type: "image", image: img, x, y, width: worldWidth, height: worldHeight }]);
        saveState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the farm layout?")) {
      setObjects([]);
      setSelectedObjectIndex(null);
      setViewOffset({ x: 0, y: 0 });
      setScale(1);
      saveState();
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setObjects(history[prevStep]);
      setSelectedObjectIndex(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setObjects(history[nextStep]);
      setSelectedObjectIndex(null);
    }
  };
    
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        designerContainerRef.current?.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    <div ref={designerContainerRef} className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Pencil className="text-blue-600 dark:text-blue-400" size={32} />
              {canvasName}
            </h1>
            <p className={`mt-2 text-md ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Design your layout. Pan with the middle mouse button. Select items to move or resize.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggleFullscreen}
              className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${ darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300" } transition-all`}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
            <button onClick={undo} disabled={historyStep <= 0} className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500" : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"} transition-all`} >
              <Undo size={18} /> Undo
            </button>
            <button onClick={redo} disabled={historyStep >= history.length - 1} className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200 disabled:bg-gray-800 disabled:text-gray-500" : "bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"} transition-all`} >
              <Redo size={18} /> Redo
            </button>
            <button onClick={clearCanvas} className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"} transition-all`} >
              <Trash2 size={18} /> Clear
            </button>
            <button onClick={exportPDF} className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"} transition-all`} >
              <Download size={18} /> Export PDF
            </button>
            <button onClick={saveDesign} disabled={isSaving} className={`px-5 py-2.5 rounded-full flex items-center gap-2 ${darkMode ? "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800 disabled:text-gray-400" : "bg-green-600 hover:bg-green-700 text-white disabled:bg-green-500 disabled:text-gray-300"} transition-all`} >
              <Save size={18} /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        <div className={`flex flex-col gap-3 p-6 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg w-full lg:w-64 h-fit`}>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Brush size={20} /> Tools</h3>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            {tools.map((t) => (
              <button key={t.tool} onClick={() => { setActiveTool(t.tool); setShowTextInput(false); setSelectedObjectIndex(null); }} className={`p-3 flex items-center gap-2 rounded-lg transition-all ${activeTool === t.tool ? (darkMode ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800") : (darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100")}`} title={t.label}>
                <t.icon size={18} />
                <span className="text-sm hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-4 border-t pt-4 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><Paintbrush size={16} /> Stroke Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><Droplet size={16} /> Fill Color</label>
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm"><Brush size={16} /> Size: {brushSize}px</label>
              <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm"><Type size={16} /> Label Text</label>
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Enter shelter label" className={`px-3 py-2.5 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><ImageIcon size={16} /> Add Image</label>
              <input type="file" onChange={addImage} accept="image/*" className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-blue-900 dark:file:text-blue-200 hover:file:bg-blue-800" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm"><Grid size={16} /> Grid Size: {gridSize}px</label>
              <input type="range" min="10" max="100" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm"><Grid size={16} /> Show Grid</label>
              <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(!showGrid)} className="w-5 h-5 rounded" />
            </div>
            <div className="text-sm"><p>Unit: 1px = {PIXEL_TO_METER}m</p></div>
          </div>
        </div>
        <div className={`flex-1 min-h-[600px] rounded-2xl overflow-hidden border ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"} shadow-lg relative`}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full block"
            style={{
              cursor: isPanning ? "grabbing" : (isSpacePressed ? "grab" : (activeTool === "select" ? (isResizing ? "nwse-resize" : "pointer") : activeTool === "text" ? "text" : "crosshair")),
            }}
          />
          {showTextInput && (
            <div
              className={`absolute p-3 rounded-lg shadow-lg border ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}
              style={{
                left: Math.min((textPosition.x * scale + viewOffset.x) + 10, canvasRef.current.width - 200),
                top: Math.min((textPosition.y * scale + viewOffset.y) + 10, canvasRef.current.height - 100),
              }}
            >
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyPress={(e) => {if (e.key === "Enter") addText();}} className={`px-2 py-1.5 rounded border text-sm ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} placeholder="Enter label" autoFocus />
              <div className="flex gap-2 mt-2">
                <button onClick={addText} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Add</button>
                <button onClick={() => setShowTextInput(false)} className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}