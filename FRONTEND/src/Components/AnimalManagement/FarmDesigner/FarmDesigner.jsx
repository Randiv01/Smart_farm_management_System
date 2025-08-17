import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import { useTheme } from "../contexts/ThemeContext.js";
import {
  Canvas,
  Rect,
  Circle,
  Line,
  Triangle,
  IText,
  Image as FabricImage,
  PencilBrush,
} from "fabric";
import { jsPDF } from "jspdf";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState("select");
  const [brushSize, setBrushSize] = useState(3);
  const [color, setColor] = useState(darkMode ? "#ffffff" : "#000000");
  const [fillColor, setFillColor] = useState(darkMode ? "#34d399" : "#10b981");
  const [textInput, setTextInput] = useState("");

  const drawingObject = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);

  // Initialize Fabric canvas
  useEffect(() => {
    document.title = "Farm Design";
    if (canvasRef.current && !fabricCanvas.current) {
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;

      fabricCanvas.current = new Canvas(canvasRef.current, {
        width,
        height,
        backgroundColor: darkMode ? "#111827" : "#f7e9cb",
        selection: true,
        isDrawingMode: false,
      });

      fabricCanvas.current.freeDrawingBrush = new PencilBrush(fabricCanvas.current);
      fabricCanvas.current.freeDrawingBrush.color = color;
      fabricCanvas.current.freeDrawingBrush.width = brushSize;

      fabricCanvas.current.on("mouse:down", handleMouseDown);
      fabricCanvas.current.on("mouse:move", handleMouseMove);
      fabricCanvas.current.on("mouse:up", handleMouseUp);
      fabricCanvas.current.on("object:added", handleObjectAdded);
      fabricCanvas.current.on("selection:created", handleSelection);
      fabricCanvas.current.on("selection:updated", handleSelection);
    }

    return () => {
      if (fabricCanvas.current) fabricCanvas.current.dispose();
    };
  }, []);

  // Update canvas on theme change
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.backgroundColor = darkMode ? "#111827" : "#f7e9cb";
      if (fabricCanvas.current.freeDrawingBrush) {
        fabricCanvas.current.freeDrawingBrush.color = color;
      }
      fabricCanvas.current.renderAll();
    }
  }, [darkMode, color]);

  // Update tools
  useEffect(() => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.isDrawingMode = activeTool === "pencil";
    fabricCanvas.current.selection = activeTool === "select";
    fabricCanvas.current.freeDrawingBrush.width = brushSize;
    fabricCanvas.current.forEachObject((obj) => (obj.selectable = activeTool === "select"));
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
  }, [activeTool, color, brushSize]);

  // Mouse Handlers
  const handleMouseDown = (opt) => {
    if (!fabricCanvas.current) return;
    const pointer = fabricCanvas.current.getPointer(opt.e);
    startPos.current = pointer;
    isDrawing.current = true;

    if (["select", "pencil", "erase"].includes(activeTool)) return;

    let obj;
    switch (activeTool) {
      case "rect":
        obj = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false,
        });
        break;
      case "circle":
        obj = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 1,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false,
        });
        break;
      case "line":
        obj = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: color,
          strokeWidth: brushSize,
          selectable: false,
        });
        break;
      case "triangle":
        obj = new Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: color,
          strokeWidth: brushSize,
          selectable: false,
        });
        break;
      case "text":
        obj = new IText(textInput || "Click to edit", {
          left: pointer.x,
          top: pointer.y,
          fill: color,
          fontFamily: "Arial",
          fontSize: 20,
          selectable: true,
        });
        isDrawing.current = false;
        break;
      default:
        return;
    }

    if (obj) {
      fabricCanvas.current.add(obj);
      drawingObject.current = obj;
      if (activeTool === "text") obj.enterEditing();
      fabricCanvas.current.renderAll();
    }
  };

  const handleMouseMove = (opt) => {
    if (!isDrawing.current || !drawingObject.current || !fabricCanvas.current) return;
    const pointer = fabricCanvas.current.getPointer(opt.e);
    const obj = drawingObject.current;

    switch (activeTool) {
      case "rect":
      case "triangle":
        obj.set({
          width: pointer.x - startPos.current.x,
          height: pointer.y - startPos.current.y,
          left: pointer.x < startPos.current.x ? pointer.x : startPos.current.x,
          top: pointer.y < startPos.current.y ? pointer.y : startPos.current.y,
        });
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPos.current.x, 2) +
          Math.pow(pointer.y - startPos.current.y, 2)
        ) / 2;
        obj.set({
          radius,
          left: startPos.current.x + (pointer.x - startPos.current.x) / 2,
          top: startPos.current.y + (pointer.y - startPos.current.y) / 2,
        });
        break;
      case "line":
        obj.set({ x2: pointer.x, y2: pointer.y });
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

  const handleObjectAdded = (opt) => {
    if (activeTool === "text" && opt.target.type === "i-text") opt.target.enterEditing();
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

  const clearCanvas = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.clear();
      fabricCanvas.current.backgroundColor = darkMode ? "#111827" : "#f7e9cb";
      fabricCanvas.current.renderAll();
    }
  };

  const exportPDF = () => {
    if (!fabricCanvas.current) return;
    const dataURL = fabricCanvas.current.toDataURL({ format: "png", multiplier: 2 });
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [fabricCanvas.current.width, fabricCanvas.current.height] });
    pdf.addImage(dataURL, "PNG", 0, 0, fabricCanvas.current.width, fabricCanvas.current.height);
    pdf.save(`farm-design-${type || "plan"}.pdf`);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      FabricImage.fromURL(event.target.result, (img) => {
        img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5, selectable: true });
        fabricCanvas.current.add(img);
        fabricCanvas.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`${darkMode ? "dark bg-dark-bg text-dark-text" : "bg-light-beige text-gray-800"} flex min-h-screen flex-col`}>
      <TopNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} type={type} />

        {/* Main content */}
        <main className="flex-1 pt-[80px] p-3 md:p-5 overflow-auto">
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Toolbox */}
            <div className={`flex flex-row lg:flex-col flex-wrap gap-2 p-3 rounded-xl shadow-card ${darkMode ? "bg-dark-card shadow-cardDark" : "bg-dark-green shadow-card"} w-full lg:w-16`}>
              {[
                { tool: "select", icon: "fas fa-mouse-pointer" },
                { tool: "pencil", icon: "fas fa-pencil-alt" },
                { tool: "erase", icon: "fas fa-eraser" },
                { tool: "rect", icon: "far fa-square" },
                { tool: "circle", icon: "far fa-circle" },
                { tool: "line", icon: "fas fa-minus" },
                { tool: "triangle", icon: "fas fa-play" },
                { tool: "text", icon: "fas fa-font" },
              ].map((t) => (
                <button
                  key={t.tool}
                  onClick={() => setActiveTool(t.tool)}
                  className={`w-10 h-10 flex items-center justify-center rounded-md transition transform ${activeTool === t.tool ? "bg-white/20 scale-105" : "hover:bg-white/10"}`}
                  title={t.tool}
                >
                  <i className={t.icon}></i>
                </button>
              ))}

              <label className="w-10 h-10 flex items-center justify-center rounded-md cursor-pointer hover:bg-white/10 mt-2" title="Add Image">
                <i className="fas fa-image"></i>
                <input type="file" accept="image/*" className="hidden" onChange={addImage} />
              </label>

              {/* Color pickers */}
              <div className="flex flex-col items-center gap-1 mt-2">
                <label className="flex flex-col items-center text-xs">
                  <i className="fas fa-paint-brush"></i>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer p-0" />
                </label>
                <label className="flex flex-col items-center text-xs">
                  <i className="fas fa-fill-drip"></i>
                  <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer p-0" />
                </label>
              </div>

              {/* Brush size */}
              <div className="flex flex-col items-center gap-1 mt-2 text-xs">
                <i className="fas fa-brush"></i>
                <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full cursor-pointer" />
                <span>{brushSize}px</span>
              </div>

              {/* Text input */}
              {activeTool === "text" && (
                <div className={`${darkMode ? "bg-dark-card border-dark-gray text-dark-text" : "bg-white border-gray-400 text-gray-800"} w-full mt-2 rounded-md border p-1`}>
                  <input type="text" placeholder="Enter text..." value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full bg-transparent focus:outline-none" />
                </div>
              )}

              {/* Actions */}
              <button onClick={clearCanvas} className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 mt-2" title="Clear Canvas"><i className="fas fa-trash-alt"></i></button>
              <button onClick={exportPDF} className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/10 mt-1" title="Export PDF"><i className="fas fa-file-pdf"></i></button>
            </div>

            {/* Canvas container */}
            <div className="flex-1 flex justify-center items-start mt-2 lg:mt-0">
              <div className="w-full max-w-[900px] h-[500px] md:h-[550px] lg:h-[600px] bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-gray rounded-xl shadow-card overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={500}
                  className="w-full h-full"
                  style={{
                    cursor: activeTool === "select" ? "default" : activeTool === "erase" ? "not-allowed" : "crosshair",
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
