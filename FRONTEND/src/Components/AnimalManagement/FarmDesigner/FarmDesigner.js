import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from '../contexts/ThemeContext.js';
import {
  Canvas,
  Rect,
  Circle,
  Line,
  Triangle,
  IText,
  Image as FabricImage,
  PencilBrush,
  Object as FabricObject
} from "fabric";
import { jsPDF } from "jspdf";
import "./FarmDesigner.css";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState("select");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState(darkMode ? "#ffffff" : "#000000");
  const [fillColor, setFillColor] = useState(darkMode ? "#34d399" : "#10b981");
  const [textInput, setTextInput] = useState("");

  const drawingObject = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);

  // Initialize canvas and tools
  useEffect(() => {
    document.title = "Farm Design";
    
    if (canvasRef.current && !fabricCanvas.current) {
      // Create canvas
      fabricCanvas.current = new Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: darkMode ? "#222" : "#fff",
        selection: true,
        isDrawingMode: false,
      });

      // Setup drawing brush
      fabricCanvas.current.freeDrawingBrush = new PencilBrush(fabricCanvas.current);
      fabricCanvas.current.freeDrawingBrush.color = color;
      fabricCanvas.current.freeDrawingBrush.width = brushSize;

      // Event listeners
      fabricCanvas.current.on("mouse:down", handleMouseDown);
      fabricCanvas.current.on("mouse:move", handleMouseMove);
      fabricCanvas.current.on("mouse:up", handleMouseUp);
      fabricCanvas.current.on("object:added", handleObjectAdded);
      fabricCanvas.current.on("selection:created", handleSelection);
      fabricCanvas.current.on("selection:updated", handleSelection);
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off("mouse:down", handleMouseDown);
        fabricCanvas.current.off("mouse:move", handleMouseMove);
        fabricCanvas.current.off("mouse:up", handleMouseUp);
        fabricCanvas.current.off("object:added", handleObjectAdded);
        fabricCanvas.current.off("selection:created", handleSelection);
        fabricCanvas.current.off("selection:updated", handleSelection);
        fabricCanvas.current.dispose();
      }
    };
  }, []);

  // Update canvas when theme changes
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.backgroundColor = darkMode ? "#222" : "#fff";
      if (fabricCanvas.current.freeDrawingBrush) {
        fabricCanvas.current.freeDrawingBrush.color = color;
      }
      fabricCanvas.current.renderAll();
    }
  }, [darkMode]);

  // Update tool settings when active tool changes
  useEffect(() => {
    if (!fabricCanvas.current) return;

    fabricCanvas.current.isDrawingMode = activeTool === "pencil";
    fabricCanvas.current.selection = activeTool === "select";
    
    if (fabricCanvas.current.freeDrawingBrush) {
      fabricCanvas.current.freeDrawingBrush.color = color;
      fabricCanvas.current.freeDrawingBrush.width = brushSize;
    }

    fabricCanvas.current.forEachObject(obj => {
      obj.selectable = activeTool === "select";
    });
    
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
  }, [activeTool, color, brushSize]);

  // Mouse event handlers
  const handleMouseDown = (options) => {
    if (!fabricCanvas.current) return;
    
    const pointer = fabricCanvas.current.getPointer(options.e);
    startPos.current = pointer;
    isDrawing.current = true;

    if (activeTool === "select" || activeTool === "pencil" || activeTool === "erase") return;

    let newObject;
    switch (activeTool) {
      case "rect":
        newObject = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false
        });
        break;
      
      case "circle":
        newObject = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 1,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false
        });
        break;
      
      case "line":
        newObject = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth: brushSize,
          selectable: false
        });
        break;
      
      case "triangle":
        newObject = new Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false
        });
        break;
      
      case "text":
        newObject = new IText(textInput || "Click to edit", {
          left: pointer.x,
          top: pointer.y,
          fill: color,
          fontFamily: 'Arial',
          fontSize: 20,
          selectable: true
        });
        isDrawing.current = false;
        break;
      
      default:
        return;
    }

    if (newObject) {
      fabricCanvas.current.add(newObject);
      drawingObject.current = newObject;
      if (activeTool === "text") {
        newObject.enterEditing();
      }
      fabricCanvas.current.renderAll();
    }
  };

  const handleMouseMove = (options) => {
    if (!isDrawing.current || !drawingObject.current || !fabricCanvas.current) return;
    
    const pointer = fabricCanvas.current.getPointer(options.e);
    const shape = drawingObject.current;

    switch (activeTool) {
      case "rect":
      case "triangle":
        shape.set({
          width: pointer.x - startPos.current.x,
          height: pointer.y - startPos.current.y,
          left: pointer.x < startPos.current.x ? pointer.x : startPos.current.x,
          top: pointer.y < startPos.current.y ? pointer.y : startPos.current.y
        });
        break;
      
      case "circle":
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPos.current.x, 2) +
          Math.pow(pointer.y - startPos.current.y, 2)
        ) / 2;
        shape.set({
          radius: radius,
          left: startPos.current.x + (pointer.x - startPos.current.x)/2,
          top: startPos.current.y + (pointer.y - startPos.current.y)/2
        });
        break;
      
      case "line":
        shape.set({ x2: pointer.x, y2: pointer.y });
        break;
      
      default:
        return;
    }
    
    fabricCanvas.current.renderAll();
  };

  const handleMouseUp = () => {
    if (drawingObject.current && isDrawing.current) {
      drawingObject.current.set({ selectable: true });
      fabricCanvas.current.setActiveObject(drawingObject.current);
    }
    drawingObject.current = null;
    isDrawing.current = false;
  };

  const handleObjectAdded = (options) => {
    if (activeTool === "text" && options.target.type === 'i-text') {
      options.target.enterEditing();
    }
  };

  const handleSelection = () => {
    if (activeTool === "erase" && fabricCanvas.current) {
      const activeObj = fabricCanvas.current.getActiveObject();
      if (activeObj) {
        fabricCanvas.current.remove(activeObj);
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.renderAll();
      }
    }
  };

  // Tool actions
  const clearCanvas = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.clear();
      fabricCanvas.current.backgroundColor = darkMode ? "#222" : "#fff";
      fabricCanvas.current.renderAll();
    }
  };

  const exportPDF = () => {
    if (!fabricCanvas.current) return;

    const dataURL = fabricCanvas.current.toDataURL({
      format: "png",
      multiplier: 2,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [fabricCanvas.current.width, fabricCanvas.current.height],
    });

    pdf.addImage(dataURL, "PNG", 0, 0, fabricCanvas.current.width, fabricCanvas.current.height);
    pdf.save(`farm-design-${type || "plan"}.pdf`);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target.result, (img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true
        });
        fabricCanvas.current.add(img);
        fabricCanvas.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`farm-designer-page ${darkMode ? "dark" : ""}`}>
      <Sidebar sidebarOpen={sidebarOpen} type={type} />
      <TopNavbar onMenuClick={handleMenuClick} />

      <main className="main-content">
        <div className="container">
          <div className="toolbox">
            {/* Tools */}
            <button
              className={activeTool === "select" ? "active" : ""}
              onClick={() => setActiveTool("select")}
              title="Select/Move Objects"
            >
              <i className="fas fa-mouse-pointer"></i>
            </button>

            <button
              className={activeTool === "pencil" ? "active" : ""}
              onClick={() => setActiveTool("pencil")}
              title="Free Drawing"
            >
              <i className="fas fa-pencil-alt"></i>
            </button>

            <button
              className={activeTool === "erase" ? "active" : ""}
              onClick={() => setActiveTool("erase")}
              title="Erase Objects"
            >
              <i className="fas fa-eraser"></i>
            </button>

            <button
              className={activeTool === "rect" ? "active" : ""}
              onClick={() => setActiveTool("rect")}
              title="Rectangle"
            >
              <i className="far fa-square"></i>
            </button>

            <button
              className={activeTool === "circle" ? "active" : ""}
              onClick={() => setActiveTool("circle")}
              title="Circle"
            >
              <i className="far fa-circle"></i>
            </button>

            <button
              className={activeTool === "line" ? "active" : ""}
              onClick={() => setActiveTool("line")}
              title="Line"
            >
              <i className="fas fa-minus"></i>
            </button>

            <button
              className={activeTool === "triangle" ? "active" : ""}
              onClick={() => setActiveTool("triangle")}
              title="Triangle"
            >
              <i className="fas fa-play"></i>
            </button>

            <button
              className={activeTool === "text" ? "active" : ""}
              onClick={() => setActiveTool("text")}
              title="Add Text"
            >
              <i className="fas fa-font"></i>
            </button>

            {/* Image Upload */}
            <label htmlFor="image-upload" className="tool-btn" title="Add Image">
              <i className="fas fa-image"></i>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={addImage}
                style={{ display: "none" }}
              />
            </label>

            {/* Color Pickers */}
            <div className="color-picker">
              <label title="Stroke Color">
                <i className="fas fa-paint-brush"></i>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
            </div>

            <div className="color-picker">
              <label title="Fill Color">
                <i className="fas fa-fill-drip"></i>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                />
              </label>
            </div>

            {/* Brush Size */}
            <div className="brush-size">
              <label title="Brush/Line Size">
                <i className="fas fa-brush"></i>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                />
                <span>{brushSize}px</span>
              </label>
            </div>

            {/* Text Input */}
            {activeTool === "text" && (
              <div className="text-input">
                <input
                  type="text"
                  placeholder="Enter text..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </div>
            )}

            {/* Actions */}
            <button onClick={clearCanvas} title="Clear Canvas">
              <i className="fas fa-trash-alt"></i>
            </button>

            <button onClick={exportPDF} title="Export as PDF">
              <i className="fas fa-file-pdf"></i>
            </button>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width="900"
            height="600"
            style={{
              border: "1px solid #999",
              backgroundColor: darkMode ? "#222" : "#fff",
              cursor: 
                activeTool === "select" ? "default" :
                activeTool === "erase" ? "not-allowed" :
                "crosshair"
            }}
          />
        </div>
      </main>
    </div>
  );
}