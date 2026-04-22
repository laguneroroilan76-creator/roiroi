import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const INITIAL_FIELDS = {};

export default function TripTicketForm() {
  const location = useLocation();
  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;

  const [fields, setFields] = useState(() => {
    if (initialData) {
      const savedLayout = typeof initialData.layout === 'string' ? JSON.parse(initialData.layout) : initialData.layout;
      const base = savedLayout || { ...INITIAL_FIELDS };
      // Ensure all initialData fields are mapped to layout values
      Object.keys(base).forEach(key => {
        if (initialData[key] !== undefined && !base[key].isExtra) {
          base[key].value = initialData[key];
        }
      });
      return base;
    }
    const saved = localStorage.getItem('tripTicketLayoutClean');
    const base = saved ? JSON.parse(saved) : { ...INITIAL_FIELDS };
    Object.keys(base).forEach(key => { if (!base[key].value) base[key].value = ''; });
    return base;
  });

  const [appMode, setAppMode] = useState('view');
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [isAddingField, setIsAddingField] = useState(false);
  const [draggingField, setDraggingField] = useState(null);
  const [resizingField, setResizingField] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizingStart, setResizingStart] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1.2);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleDragStart = (e, key) => {
    if (appMode !== 'layout') return;
    setDraggingField(key);
  };

  const handleResizeStart = (e, key, handle) => {
    if (appMode !== 'layout') return;
    e.stopPropagation();
    const field = fields[key];
    setResizingField(key);
    setResizeHandle(handle);
    setResizingStart({
      x: e.clientX,
      y: e.clientY,
      width: field.width || 15,
      height: field.height || 3, // New % height
      crop: field.crop || { top: 0, right: 0, bottom: 0, left: 0 },
      fieldX: field.x,
      fieldY: field.y
    });
  };

  const handleMouseMove = (e) => {
    if (appMode !== 'layout') return;
    const rect = containerRef.current.getBoundingClientRect();

    if (draggingField) {
      const x = ((e.clientX - rect.left) / (rect.width)) * 100;
      const y = ((e.clientY - rect.top) / (rect.height)) * 100;

      setFields(prev => ({
        ...prev,
        [draggingField]: { ...prev[draggingField], x, y }
      }));
    } else if (resizingField && resizingStart) {
      const deltaX = ((e.clientX - resizingStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - resizingStart.y) / rect.height) * 100;
      const isSignature = fields[resizingField].isSignature;

      setFields(prev => {
        const field = prev[resizingField];
        const newField = { ...field };

        // Handle Side Handles (Resize Container)
        if (['right', 'bottom', 'left', 'top'].includes(resizeHandle)) {
          if (resizeHandle === 'right') newField.width = Math.max(1, resizingStart.width + deltaX);
          if (resizeHandle === 'bottom') newField.height = Math.max(0.5, resizingStart.height + deltaY);
          if (resizeHandle === 'left') {
            newField.x = resizingStart.fieldX + deltaX;
            newField.width = Math.max(1, resizingStart.width - deltaX);
          }
          if (resizeHandle === 'top') {
            newField.y = resizingStart.fieldY + deltaY;
            newField.height = Math.max(0.5, resizingStart.height - deltaY);
          }
          
          if (isSignature) {
            const newCrop = { ...(field.crop || { top: 0, right: 0, bottom: 0, left: 0 }) };
            // Optional: add slide-to-crop logic here if desired, 
            // but first priority is functional resizing.
          }
        } 
        
        // Handle Corner Resizing (Standard Canva Scaling)
        if (['se', 'sw', 'ne', 'nw'].includes(resizeHandle)) {
          if (['se', 'ne'].includes(resizeHandle)) {
            newField.width = Math.max(1, resizingStart.width + deltaX);
          } else {
            newField.x = resizingStart.fieldX + deltaX;
            newField.width = Math.max(1, resizingStart.width - deltaX);
          }

          if (['se', 'sw'].includes(resizeHandle)) {
            newField.height = Math.max(0.5, resizingStart.height + deltaY);
          } else {
            newField.y = resizingStart.fieldY + deltaY;
            newField.height = Math.max(0.5, resizingStart.height - deltaY);
          }
        }

        return { ...prev, [resizingField]: newField };
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingField(null);
    setResizingField(null);
    setResizeHandle(null);
    setResizingStart(null);
  };

  const handleValueChange = (key, val) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], value: val }
    }));
  };

  const handleClickCanvas = (e) => {
    if (!isAddingField) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / (rect.width)) * 100;
    const y = ((e.clientY - rect.top) / (rect.height)) * 100;
    const id = `extra_${Date.now()}`;

    setFields(prev => ({
      ...prev,
      [id]: { label: 'New Text', x, y, width: 15, height: 2.2, value: '', isExtra: true }
    }));
    setIsAddingField(false);
  };

  const handleAddSignature = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return alert('Please log in first');
    const user = JSON.parse(userStr);
    
    if (!user.signatureUrl) {
      return alert('You have not uploaded an E-Signature yet. Please go to your Profile to upload one.');
    }

    const id = `sig_${Date.now()}`;
    setFields(prev => ({
      ...prev,
      [id]: { 
        label: 'Signature', 
        x: 40, y: 80, width: 15, height: 6.5,
        isSignature: true, 
        signatureUrl: user.signatureUrl,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        isExtra: true 
      }
    }));
    setAppMode('layout');
  };


  const handleFontSize = (key, val) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], fontSize: parseFloat(val) || 10.5 }
    }));
  };

  const handleSelectField = (key) => {
    if (appMode !== 'layout') return;
    setSelectedField(key);
  };

  const handleToggleStyle = (key, prop) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], [prop]: !prev[key][prop] }
    }));
  };

  const handleColorChange = (key, color) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], color }
    }));
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('tripTicketLayoutClean', JSON.stringify(fields));
      const payload = {
        layout: fields,
        status,
        ...Object.keys(fields).reduce((acc, key) => {
          if (!fields[key].isExtra) acc[key] = fields[key].value;
          return { ...acc };
        }, {})
      };

      if (isReviewMode && initialData?.id) {
        await axios.put(`http://localhost:5000/api/trip-tickets/${initialData.id}`, payload);
        alert('Updated Successfully!');
      } else {
        await axios.post('http://localhost:5000/api/trip-tickets', payload);
        alert('Saved Successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error saving data');
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingField, resizingField, resizingStart, resizeHandle, appMode]);

  return (
    <div className="smart-canvas-page">
      <div className="no-print sticky-toolbar">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate('/dashboard')}>← Back</button>

           <button className={`tool-btn ${appMode === 'view' ? 'active-mode' : ''}`} onClick={() => { setAppMode('view'); setIsAddingField(false); setSelectedField(null); }}>
            📄 View Mode
          </button>
          <button className={`tool-btn ${appMode === 'layout' ? 'active-mode' : ''}`} onClick={() => setAppMode('layout')}>
            🛠️ Layout & Edit
          </button>

          {appMode === 'layout' && (
            <div className="layout-tools">
              <button className={`tool-btn ${isAddingField ? 'active-tool' : 'inactive-tool'}`} onClick={() => setIsAddingField(!isAddingField)}>
                {isAddingField ? '🎯 Click on Map' : '➕ Add Field'}
              </button>
              <button className="tool-btn sig-tool" onClick={handleAddSignature}>
                ✍️ Add My Signature
              </button>

              {selectedField && (
                <div className="styling-bar">
                  <div className="divider-v"></div>
                  <button className={`style-btn ${fields[selectedField]?.isBold ? 'active' : ''}`} onClick={() => handleToggleStyle(selectedField, 'isBold')}>B</button>
                  <button className={`style-btn ${fields[selectedField]?.isUnderline ? 'active' : ''}`} onClick={() => handleToggleStyle(selectedField, 'isUnderline')}>U</button>

                  <input
                    type="color"
                    className="color-picker-mini"
                    value={fields[selectedField]?.color || '#000000'}
                    onChange={(e) => handleColorChange(selectedField, e.target.value)}
                  />

                  <div className="divider-v"></div>

                  <div className="size-group">
                    <span className="small-label">PX:</span>
                    <input
                      type="number"
                      className="font-size-input"
                      value={fields[selectedField]?.fontSize || 10.5}
                      onChange={(e) => handleFontSize(selectedField, e.target.value)}
                    />
                  </div>

                  <button className="tool-btn delete" onClick={() => {
                    const newFields = { ...fields };
                    delete newFields[selectedField];
                    setFields(newFields);
                    setSelectedField(null);
                  }}>🗑️ Delete</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tool-group zoom-control">
          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>ZOOM: {Math.round(zoom * 100)}%</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
          />
        </div>

        <div className="tool-group">
          <button className="tool-btn save" onClick={handleSave}>
            {isReviewMode ? 'Update Record' : 'Finalize & Save'}
          </button>
          <button className="tool-btn print" onClick={() => window.print()}>🖨️ Print</button>
        </div>
      </div>

      <div
        className={`canvas-wrapper ${isAddingField ? 'adding-cursor' : ''}`}
        ref={containerRef}
        onClick={handleClickCanvas}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          marginBottom: `${(zoom - 1) * 300}mm` // Provide space for scaled content
        }}
      >
        <img 
          src="/tripticket.jpg" 
          className="form-image" 
          alt="form" 
          style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} 
        />

        {Object.entries(fields).map(([key, field]) => (
          <div
            key={key}
            className={`draggable-field ${draggingField === key ? 'dragging' : ''} ${selectedField === key ? 'selected' : ''} ${appMode}`}
            style={{
              left: `${field.x}%`,
              top: `${field.y}%`,
              width: `${field.width}%`,
              height: `${field.height}%`
            }}
            onClick={(e) => { e.stopPropagation(); handleSelectField(key); }}
          >
            {appMode === 'layout' && (
              <div className="drag-handle" onMouseDown={(e) => handleDragStart(e, key)}>☩</div>
            )}
            
            {/* Signature Rendering (Consolidated) */}
            {field.isSignature ? (
                <div 
                  className="signature-container"
                  style={{
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                    <img 
                      src={field.signatureUrl.startsWith('http') ? field.signatureUrl : `http://localhost:5000${field.signatureUrl}`} 
                      alt="Signature"
                      className="sig-img"
                      style={{
                        clipPath: `inset(${field.crop?.top || 0}% ${field.crop?.right || 0}% ${field.crop?.bottom || 0}% ${field.crop?.left || 0}%)`,
                        height: '100%', 
                        objectFit: 'contain'
                      }}
                    />
                </div>
            ) : (
                <>
                {/* Always render text for printing */}
                <div 
                  className={`view-text ${appMode === 'view' ? '' : 'print-only'}`} 
                  style={{ 
                    fontSize: `${field.fontSize || 10.5}pt`,
                    fontWeight: field.isBold ? 'bold' : 'normal',
                    textDecoration: field.isUnderline ? 'underline' : 'none',
                    color: field.color || '#000000',
                    height: '100%'
                  }}
                >
                  {field.value || " "}
                </div>
                </>
            )}

            {/* Resize Handles (Layout Mode Only) */}
            {appMode === 'layout' && selectedField === key && (
              <>
                <div className="resizer ne" onMouseDown={(e) => handleResizeStart(e, key, 'ne')}></div>
                <div className="resizer nw" onMouseDown={(e) => handleResizeStart(e, key, 'nw')}></div>
                <div className="resizer sw" onMouseDown={(e) => handleResizeStart(e, key, 'sw')}></div>
                <div className="resizer se" onMouseDown={(e) => handleResizeStart(e, key, 'se')}></div>
                
                {/* Side Handles for Cropping/Sizing */}
                <div className="resizer-side r" onMouseDown={(e) => handleResizeStart(e, key, 'right')}></div>
                <div className="resizer-side b" onMouseDown={(e) => handleResizeStart(e, key, 'bottom')}></div>
                <div className="resizer-side l" onMouseDown={(e) => handleResizeStart(e, key, 'left')}></div>
                <div className="resizer-side t" onMouseDown={(e) => handleResizeStart(e, key, 'top')}></div>
              </>
            )}

            {/* Inputs only for screen and when not in view mode */}
            {(appMode !== 'view' && !field.isSignature) && (
              field.isTextarea ? (
                <textarea 
                  value={field.value}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder={field.label}
                  className="no-print"
                  style={{ 
                    height: '100%',
                    fontSize: `${field.fontSize || 10.5}pt`,
                    fontWeight: field.isBold ? 'bold' : 'normal',
                    textDecoration: field.isUnderline ? 'underline' : 'none',
                    color: field.color || '#000000'
                  }}
                />
              ) : (
                <input 
                  value={field.value}
                  onChange={(e) => handleValueChange(key, e.target.value)}
                  placeholder={field.label}
                  className={`no-print ${field.isSignature ? 'sig-input' : ''}`}
                  style={{ 
                    height: '100%',
                    fontSize: `${field.fontSize || 10.5}pt`,
                    fontWeight: field.isBold ? 'bold' : 'normal',
                    textDecoration: field.isUnderline ? 'underline' : 'none',
                    color: field.color || '#000000'
                  }}
                />
              )
            )}
          </div>
        ))}
      </div>

      <style>{`
        @page { size: A4; margin: 0; }
        .smart-canvas-page { background: #0f172a; min-height: 100vh; padding: 100px 20px 40px; display: flex; flex-direction: column; align-items: center; font-family: 'Outfit', sans-serif; overflow-x: auto; }
        
        .sticky-toolbar { 
          position: fixed; top: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); 
          padding: 12px 40px; display: flex; justify-content: space-between; align-items: center; z-index: 1000; border-bottom: 1px solid #1e293b;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .tool-group { display: flex; gap: 10px; align-items: center; }
        .tool-btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; font-size: 0.9rem; }
        .tool-btn.back { background: #334155; color: white; }
        .tool-btn.active-mode { background: #6366f1; color: white; border: 2px solid #fff; }
        .tool-btn.active-tool { background: #ef4444; color: white; animation: pulse 1.5s infinite; }
        .tool-btn.inactive-tool { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
        .tool-btn.reset { background: #475569; color: white; }
        .tool-btn.save { background: #10b981; color: white; }
        .tool-btn.print { background: #06b6d4; color: white; }

        .zoom-control { background: rgba(30, 41, 59, 0.5); padding: 6px 15px; border-radius: 30px; border: 1px solid #334155; }
        .zoom-slider { cursor: pointer; accent-color: #6366f1; width: 100px; }

        .layout-tools { display: flex; align-items: center; gap: 10px; }
        .styling-bar { display: flex; align-items: center; gap: 8px; background: rgba(30, 41, 59, 0.7); padding: 4px 12px; border-radius: 30px; border: 1px solid #334155; }
        
        .font-size-input { 
          width: 50px; background: #0f172a; border: 1px solid #475569; color: white; padding: 4px 6px; border-radius: 4px; 
          font-weight: bold; font-family: 'monospace'; outline: none; text-align: center;
        }
        .font-size-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
        .small-label { font-size: 0.65rem; color: #94a3b8; font-weight: 800; }
        .size-group { display: flex; align-items: center; gap: 5px; }

        .canvas-wrapper { 
          position: relative; width: 210mm; height: fit-content; background: white; 
          box-shadow: 0 30px 60px rgba(0,0,0,0.6); 
          user-select: none; -webkit-user-select: none; 
        }
        .form-image { width: 100%; display: block; pointer-events: none; }

        .drag-handle { 
          position: absolute; top: -18px; left: 50%; transform: translateX(-50%);
          background: #6366f1; color: white; width: 22px; height: 22px; display: flex; 
          align-items: center; justify-content: center; cursor: move; border-radius: 50%; font-size: 14px; 
          opacity: 0; transition: opacity 0.2s; z-index: 110;
        }
        .draggable-field:hover .drag-handle { opacity: 1; }
        
        .style-btn { 
          width: 28px; height: 28px; border-radius: 4px; border: none; cursor: pointer; font-size: 12px; font-weight: bold; 
          display: flex; align-items: center; justify-content: center; color: white; transition: all 0.1s; background: #475569;
        }
        .style-btn.active { background: #6366f1; box-shadow: 0 0 0 1px white; }
        .style-btn:hover { transform: scale(1.1); }
        
        .tool-btn.delete { background: #ef4444; color: white; font-size: 0.75rem; padding: 4px 10px; }
        .tool-btn.delete:hover { background: #dc2626; }

        .color-picker-mini { width: 28px; height: 28px; border: 1px solid #475569; padding: 0; background: none; cursor: pointer; border-radius: 4px; overflow: hidden; }
        .divider-v { width: 1px; height: 18px; background: #334155; margin: 0 5px; }

        .draggable-field { 
          position: absolute; display: flex; flex-direction: column; z-index: 100; border: 2px solid transparent; transition: border-color 0.2s; 
          user-select: none; -webkit-user-select: none;
        }
        .draggable-field.selected { border-color: #6366f1; border-radius: 4px; background: rgba(99, 102, 241, 0.05); }

        .draggable-field input, .draggable-field textarea {
          width: 100%; border: none; background: transparent; outline: none; font-family: Arial, sans-serif;
          padding: 2px 4px; transition: all 0.2s; color: #000;
        }
        
        .draggable-field.layout input, .draggable-field.layout textarea { 
          background: rgba(99, 102, 241, 0.03); border: 1px dashed rgba(99, 102, 241, 0.25); cursor: text;
        }
        .draggable-field.layout:hover input, .draggable-field.layout:hover textarea { 
          border: 1px dashed rgba(99, 102, 241, 0.6); background: rgba(99, 102, 241, 0.05);
        }
        
        .view-text {
          font-family: Arial, sans-serif; min-height: 1.2em; white-space: pre-wrap; pointer-events: none;
        }
        
        .sig-input { font-weight: bold; text-align: center; }
        .sig-tool { background: #10b981 !important; color: white; }
        .signature-container { width: 100%; display: flex; align-items: center; justify-content: center; }
        .sig-img { 
            width: 100%; 
            display: block; 
            mix-blend-mode: multiply; 
            filter: contrast(120%) brightness(105%);
            pointer-events: none;
            transition: none;
        }

        .resizer {
          position: absolute; width: 8px; height: 8px; background: white; border: 2px solid #6366f1;
          border-radius: 50%; z-index: 120;
        }
        .resizer.nw { top: -4px; left: -4px; cursor: nwse-resize; }
        .resizer.ne { top: -4px; right: -4px; cursor: nesw-resize; }
        .resizer.sw { bottom: -4px; left: -4px; cursor: nesw-resize; }
        .resizer.se { bottom: -4px; right: -4px; cursor: nwse-resize; }

        .resizer-side {
          position: absolute; z-index: 115;
        }
        .resizer-side.r { top: 0; right: -2px; width: 4px; height: 100%; cursor: ew-resize; }
        .resizer-side.l { top: 0; left: -2px; width: 4px; height: 100%; cursor: ew-resize; }
        .resizer-side.b { bottom: -2px; left: 0; width: 100%; height: 4px; cursor: ns-resize; }
        .resizer-side.t { top: -2px; left: 0; width: 100%; height: 4px; cursor: ns-resize; }

        .resizer-side:hover { background: rgba(99, 102, 241, 0.3); }

        .status-selector { display: flex; flex-direction: column; gap: 2px; }
        .status-select { 
            background: #0f172a; border: 1px solid #475569; color: white; padding: 4px 8px; border-radius: 6px; 
            font-size: 0.8rem; font-weight: bold; outline: none; transition: border-color 0.2s;
        }
        .status-select.pending { border-color: #facc15; color: #facc15; }
        .status-select.approved { border-color: #4ade80; color: #4ade80; }
        .status-select.rejected { border-color: #fb7185; color: #fb7185; }

        .print-only { display: none; }

        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .smart-canvas-page { padding: 0 !important; background: white !important; min-height: auto !important; display: block !important; }
          .canvas-wrapper { 
            box-shadow: none !important; width: 210mm !important; height: auto !important; 
            transform: none !important; margin: 0 auto !important; overflow: visible !important;
          }
          .view-text { background: transparent !important; border: none !important; }
          .draggable-field { pointer-events: none; background: transparent !important; border: none !important; }
          .draggable-field.layout { border: none !important; background: transparent !important; }
          .draggable-field.layout input, .draggable-field.layout textarea { border: none !important; background: transparent !important; }
          .drag-handle { display: none !important; }
        }
      `}</style>
    </div>
  );
}
