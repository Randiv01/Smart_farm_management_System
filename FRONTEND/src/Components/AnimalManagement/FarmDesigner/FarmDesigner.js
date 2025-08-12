import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "../TopNavbar/TopNavbar.js";
import Sidebar from "../Sidebar/Sidebar.js";
import {
  Canvas,
  Rect,
  Circle,
  Line,
  Triangle,
  PencilBrush,
} from "fabric";
import { jsPDF } from "jspdf";
import "./FarmDesigner.css";

export default function FarmDesigner() {
  const { type } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTool, setActiveTool] = useState("select"); // select, rect, circle, line, triangle, pencil, erase

  // For drawing shapes interactively
  const drawingObject = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      fabricCanvas.current = new Canvas(canvasRef.current, {
        width: 900,
        height: 600,
        backgroundColor: darkMode ? "#222" : "#fff",
        selection: true,
        isDrawingMode: false,
      });

      // Setup free drawing brush
      fabricCanvas.current.freeDrawingBrush = new PencilBrush(fabricCanvas.current);
      fabricCanvas.current.freeDrawingBrush.color = darkMode ? "white" : "black";
      fabricCanvas.current.freeDrawingBrush.width = 3;

      // Mouse events for interactive drawing
      fabricCanvas.current.on("mouse:down", onMouseDown);
      fabricCanvas.current.on("mouse:move", onMouseMove);
      fabricCanvas.current.on("mouse:up", onMouseUp);
    }

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off("mouse:down", onMouseDown);
        fabricCanvas.current.off("mouse:move", onMouseMove);
        fabricCanvas.current.off("mouse:up", onMouseUp);
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  // Update background & brush color on dark mode toggle
  useEffect(() => {
    if (fabricCanvas.current) {
      fabricCanvas.current.backgroundColor = darkMode ? "#222" : "#fff";
      fabricCanvas.current.renderAll();

      if (fabricCanvas.current.freeDrawingBrush) {
        fabricCanvas.current.freeDrawingBrush.color = darkMode ? "white" : "black";
      }
    }
  }, [darkMode]);

  // Update canvas mode based on active tool
  useEffect(() => {
    if (!fabricCanvas.current) return;

    fabricCanvas.current.isDrawingMode = activeTool === "pencil";

    if (activeTool === "pencil") {
      fabricCanvas.current.freeDrawingBrush.color = darkMode ? "white" : "black";
      fabricCanvas.current.freeDrawingBrush.width = 3;
    } else {
      fabricCanvas.current.isDrawingMode = false;
    }

    fabricCanvas.current.selection = activeTool === "select";
    fabricCanvas.current.forEachObject(obj => {
      obj.selectable = activeTool === "select";
    });
    fabricCanvas.current.discardActiveObject();
    fabricCanvas.current.renderAll();
  }, [activeTool, darkMode]);

  // Mouse handlers for interactive shape drawing
  function onMouseDown(opt) {
    if (!fabricCanvas.current) return;
    if (activeTool === "select" || activeTool === "pencil" || activeTool === "erase") return;

    const pointer = fabricCanvas.current.getPointer(opt.e);
    startPos.current = pointer;

    let obj;
    const fillColor = darkMode ? "#34d399" : "green";
    const strokeColor = darkMode ? "#86efac" : "darkgreen";

    switch (activeTool) {
      case "rect":
        obj = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: 2,
          selectable: false,
          originX: "left",
          originY: "top",
        });
        break;

      case "circle":
        obj = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 1,
          fill: darkMode ? "#3b82f6" : "blue",
          stroke: darkMode ? "#93c5fd" : "darkblue",
          strokeWidth: 2,
          selectable: false,
          originX: "center",
          originY: "center",
        });
        break;

      case "line":
        obj = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: darkMode ? "#f87171" : "red",
          strokeWidth: 3,
          selectable: false,
        });
        break;

      case "triangle":
        obj = new Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: darkMode ? "#fbbf24" : "orange",
          stroke: darkMode ? "#fde68a" : "darkorange",
          strokeWidth: 2,
          selectable: false,
          originX: "left",
          originY: "top",
        });
        break;

      default:
        obj = null;
    }

    if (obj) {
      fabricCanvas.current.add(obj);
      drawingObject.current = obj;
    }
  }

  function onMouseMove(opt) {
    if (!drawingObject.current || !fabricCanvas.current) return;
    const pointer = fabricCanvas.current.getPointer(opt.e);
    const obj = drawingObject.current;

    switch (activeTool) {
      case "rect":
      case "triangle":
        const width = pointer.x - startPos.current.x;
        const height = pointer.y - startPos.current.y;

        obj.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startPos.current.x,
          top: height < 0 ? pointer.y : startPos.current.y,
        });
        break;

      case "circle":
        const radius = Math.sqrt(
          Math.pow(pointer.x - startPos.current.x, 2) +
          Math.pow(pointer.y - startPos.current.y, 2)
        ) / 2;

        obj.set({
          radius: radius,
          left: (startPos.current.x + pointer.x) / 2,
          top: (startPos.current.y + pointer.y) / 2,
        });
        break;

      case "line":
        obj.set({ x2: pointer.x, y2: pointer.y });
        break;

      default:
        break;
    }

    fabricCanvas.current.renderAll();
  }

  function onMouseUp() {
    if (drawingObject.current) {
      drawingObject.current.set({ selectable: true });
      fabricCanvas.current.setActiveObject(drawingObject.current);
      drawingObject.current = null;
    }
  }

  // Erase mode: remove selected object on selection
  useEffect(() => {
    if (!fabricCanvas.current) return;

    function onObjectSelected() {
      if (activeTool === "erase") {
        const activeObj = fabricCanvas.current.getActiveObject();
        if (activeObj) {
          fabricCanvas.current.remove(activeObj);
          fabricCanvas.current.discardActiveObject();
          fabricCanvas.current.renderAll();
        }
      }
    }

    fabricCanvas.current.on("selection:created", onObjectSelected);
    fabricCanvas.current.on("selection:updated", onObjectSelected);

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.off("selection:created", onObjectSelected);
        fabricCanvas.current.off("selection:updated", onObjectSelected);
      }
    };
  }, [activeTool]);

  // Clear canvas helper
  const clearCanvas = () => {
    if (fabricCanvas.current) {
      fabricCanvas.current.clear();
      fabricCanvas.current.backgroundColor = darkMode ? "#222" : "#fff";
      fabricCanvas.current.renderAll();
    }
  };

  // Export PDF
  const exportPDF = () => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const dataURL = canvas.toDataURL({
      format: "png",
      multiplier: 2,
    });

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(dataURL, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`farm-plan-${type || "design"}.pdf`);
  };

  return (
    <div className={`farm-designer-page ${darkMode ? "dark" : ""}`}>
      <Sidebar darkMode={darkMode} sidebarOpen={sidebarOpen} />
      <TopNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onMenuClick={handleMenuClick}
      />

      <main className="main-content">
        <h2 style={{ marginBottom: "1rem" }}>
          Designing Farm Plan for: <em>{type || "Unknown"}</em>
        </h2>

        <div className="container">
          <div className="toolbox">
            <button
              className={activeTool === "select" ? "active" : ""}
              title="Select/Move"
              onClick={() => setActiveTool("select")}
            >
              🖱️
            </button>
            <button
              className={activeTool === "rect" ? "active" : ""}
              title="Rectangle"
              onClick={() => setActiveTool("rect")}
            >
              ▭
            </button>
            <button
              className={activeTool === "circle" ? "active" : ""}
              title="Circle"
              onClick={() => setActiveTool("circle")}
            >
              ◯
            </button>
            <button
              className={activeTool === "line" ? "active" : ""}
              title="Line"
              onClick={() => setActiveTool("line")}
            >
              ➖
            </button>
            <button
              className={activeTool === "triangle" ? "active" : ""}
              title="Triangle"
              onClick={() => setActiveTool("triangle")}
            >
              🔺
            </button>
            <button
              className={activeTool === "pencil" ? "active" : ""}
              title="Free Draw"
              onClick={() => setActiveTool("pencil")}
            >
              ✏️
            </button>
            <button
              className={activeTool === "erase" ? "active" : ""}
              title="Erase (Select object to delete)"
              onClick={() => setActiveTool("erase")}
            >
              🩹
            </button>
            <button onClick={clearCanvas} title="Clear Canvas">
              🗑️
            </button>
            <button onClick={exportPDF} title="Export as PDF">
              📄
            </button>
          </div>

          <canvas
            ref={canvasRef}
            id="farm-canvas"
            width="900"
            height="600"
            style={{
              border: "1px solid #999",
              backgroundColor: darkMode ? "#222" : "#fff",
              cursor:
                activeTool === "select"
                  ? "default"
                  : activeTool === "pencil"
                  ? "crosshair"
                  : "crosshair",
              borderRadius: "0.5rem",
            }}
          />
        </div>
      </main>
    </div>
  );
}
