import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

const INITIAL_FIELDS = {};

export default function RRFForm() {
  const { showToast } = useToast();
  const location = useLocation();
  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;

  const user = JSON.parse(localStorage.getItem('user'));
  const [fields, setFields] = useState(() => {
    if (initialData) {
      const savedLayout = typeof initialData.layout === 'string' ? JSON.parse(initialData.layout) : initialData.layout;
      const base = savedLayout || { ...INITIAL_FIELDS };
      Object.keys(base).forEach(key => {
        if (initialData[key] !== undefined && !base[key].isExtra) {
          base[key].value = initialData[key];
        }
      });
      return base;
    }
    const saved = localStorage.getItem('RRFLayoutClean');
    const base = saved ? JSON.parse(saved) : { ...INITIAL_FIELDS };
    Object.keys(base).forEach(key => { if (!base[key].value) base[key].value = ''; });
    return base;
  });

  const [appMode, setAppMode] = useState('view');
  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [isAddingField, setIsAddingField] = useState(false);
  const [draggingField, setDraggingField] = useState(null);
  const [draggingStart, setDraggingStart] = useState(null);
  const [resizingField, setResizingField] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [resizingStart, setResizingStart] = useState(null);
  const [rotatingField, setRotatingField] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1.2);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const handleDragStart = (e, key) => {
    if (appMode !== 'layout') return;
    const rect = containerRef.current.getBoundingClientRect();
    const field = fields[key];
    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    setDraggingField(key);
    setDraggingStart({
      offsetX: mouseX - field.x,
      offsetY: mouseY - field.y
    });
  };

  const handleRotateStart = (e, key) => {
    if (appMode !== 'layout') return;
    e.stopPropagation();
    setRotatingField(key);
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

    if (draggingField && draggingStart) {
      const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

      setFields(prev => ({
        ...prev,
        [draggingField]: {
          ...prev[draggingField],
          x: mouseX - draggingStart.offsetX,
          y: mouseY - draggingStart.offsetY
        }
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
    } else if (rotatingField) {
      const field = fields[rotatingField];
      const centerX = rect.left + (field.x + field.width / 2) * rect.width / 100;
      const centerY = rect.top + (field.y + field.height / 2) * rect.height / 100;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;

      setFields(prev => ({
        ...prev,
        [rotatingField]: { ...prev[rotatingField], rotate: angle }
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggingField(null);
    setDraggingStart(null);
    setResizingField(null);
    setResizeHandle(null);
    setResizingStart(null);
    setRotatingField(null);
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
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
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
      return showToast('please upload the signature', 'error');
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
      [key]: { ...prev[key], fontSize: parseFloat(val) || 8.5 }
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

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this RRF?')) return;
    try {
      const payload = {
        ...initialData,
        layout: fields,
        status: 'Approved',
        ...Object.keys(fields).reduce((acc, key) => {
          if (!fields[key].isExtra) acc[key] = fields[key].value;
          return acc;
        }, {}),
        items: Array(15).fill().map((_, i) => ({
          qty: fields[`qty_${i}`]?.value || '',
          unit: fields[`unit_${i}`]?.value || '',
          particulars: fields[`part_${i}`]?.value || '',
          estimatedCost: fields[`cost_${i}`]?.value || '',
          availableStocks: fields[`stocks_${i}`]?.value || '',
        })).filter(it => it.particulars.trim() !== '')
      };

      await api.put(`/rrfs/${initialData.id}`, payload);
      showToast('RRF Approved successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Error approving RRF';
      showToast(`Error: ${errMsg}`, 'error');
    }
  };

  const handleDisapprove = async () => {
    if (!window.confirm('Are you sure you want to disapprove this RRF?')) return;
    try {
      const payload = {
        ...initialData,
        layout: fields,
        status: 'Disapproved',
        ...Object.keys(fields).reduce((acc, key) => {
          if (!fields[key].isExtra) acc[key] = fields[key].value;
          return acc;
        }, {}),
        items: Array(15).fill().map((_, i) => ({
          qty: fields[`qty_${i}`]?.value || '',
          unit: fields[`unit_${i}`]?.value || '',
          particulars: fields[`part_${i}`]?.value || '',
          estimatedCost: fields[`cost_${i}`]?.value || '',
          availableStocks: fields[`stocks_${i}`]?.value || '',
        })).filter(it => it.particulars.trim() !== '')
      };

      await api.put(`/rrfs/${initialData.id}`, payload);
      showToast('RRF Disapproved and moved to Archive', 'info');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Error disapproving RRF';
      showToast(`Error: ${errMsg}`, 'error');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this RRF?')) return;
    try {
      const payload = {
        ...initialData,
        layout: fields,
        status: 'Archived',
        ...Object.keys(fields).reduce((acc, key) => {
          if (!fields[key].isExtra) acc[key] = fields[key].value;
          return acc;
        }, {}),
        items: Array(15).fill().map((_, i) => ({
          qty: fields[`qty_${i}`]?.value || '',
          unit: fields[`unit_${i}`]?.value || '',
          particulars: fields[`part_${i}`]?.value || '',
          estimatedCost: fields[`cost_${i}`]?.value || '',
          availableStocks: fields[`stocks_${i}`]?.value || '',
        })).filter(it => it.particulars.trim() !== '')
      };

      await api.put(`/rrfs/${initialData.id}`, payload);
      showToast('RRF Archived successfully!', 'success');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.message || 'Error archiving RRF';
      showToast(`Error: ${errMsg}`, 'error');
    }
  };

  const handleSave = async () => {
    try {
      localStorage.setItem('RRFLayoutClean', JSON.stringify(fields));

      const payload = {
        ...Object.keys(fields).reduce((acc, key) => {
          if (!fields[key].isExtra) acc[key] = fields[key].value;
          return acc;
        }, {}),
        layout: fields,
        status,
        requestor: user?.name || 'Unknown',
        items: Array(15).fill().map((_, i) => ({
          qty: fields[`qty_${i}`]?.value || '',
          unit: fields[`unit_${i}`]?.value || '',
          particulars: fields[`part_${i}`]?.value || '',
          estimatedCost: fields[`cost_${i}`]?.value || '',
          availableStocks: fields[`stocks_${i}`]?.value || '',
        })).filter(it => it.particulars.trim() !== '')
      };

      if (isReviewMode && initialData?.id) {
        await api.put(`/rrfs/${initialData.id}`, payload);
        alert('Updated Successfully!');
      } else {
        await api.post('/rrfs', payload);
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
  }, [draggingField, draggingStart, resizingField, resizingStart, resizeHandle, rotatingField, appMode]);

  return (
    <div className="smart-canvas-page">
      <div className="no-print sticky-toolbar">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate('/dashboard')}>← Back</button>

          <button className={`tool-btn ${appMode === 'view' ? 'active-mode' : ''}`} onClick={() => { setAppMode('view'); setIsAddingField(false); setSelectedField(null); }}>
            📄 View Mode
          </button>
          {status !== 'Approved' && status !== 'Archived' && (
            <button className={`tool-btn ${appMode === 'layout' ? 'active-mode' : ''}`} onClick={() => setAppMode('layout')}>
              🛠️ Layout & Edit
            </button>
          )}

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
                      value={fields[selectedField]?.fontSize || 8.5}
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
          {isReviewMode && user?.canApprove && status === 'Pending' && (
            <>
              <button className="tool-btn approve" onClick={handleApprove}>
                ✅ Approve
              </button>
              <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>
                ❌ Disapprove
              </button>
            </>
          )}
          {!isReviewMode && status !== 'Approved' && status !== 'Archived' && (
            <button className="tool-btn save" onClick={handleSave}>
              Finalize & Save
            </button>
          )}
          {status === 'Approved' && user?.canApprove && (
            <button className="tool-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={handleArchive}>
              📥 Archive
            </button>
          )}
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
          src="/Purchase Requisition Form.jpg"
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
              height: `${field.height}%`,
              transform: `rotate(${field.rotate || 0}deg)`
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
                    fontSize: `${field.fontSize || 8.5}pt`,
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

                {/* Rotation Handle */}
                <div className="rotate-handle" onMouseDown={(e) => handleRotateStart(e, key)}>
                  <div className="rotate-line"></div>
                  <div className="rotate-circle">🔄</div>
                </div>
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
                    fontSize: `${field.fontSize || 8.5}pt`,
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
                    fontSize: `${field.fontSize || 8.5}pt`,
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
        .smart-canvas-page { background: var(--bg-gradient); min-height: 100vh; padding: 100px 20px 40px; display: flex; flex-direction: column; align-items: center; font-family: 'Outfit', sans-serif; overflow-x: auto; }
        
        .sticky-toolbar { 
          position: fixed; top: 0; left: 280px; right: 0; background: var(--glass); backdrop-filter: blur(20px); 
          padding: 1rem 3rem; display: flex; justify-content: space-between; align-items: center; z-index: 900; border-bottom: 1px solid var(--glass-border);
          box-shadow: 0 4px 30px rgba(0,0,0,0.03);
          transition: var(--transition-smooth);
        }
        .tool-group { display: flex; gap: 12px; align-items: center; }
        .tool-btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 700; transition: var(--transition-smooth); font-size: 0.95rem; display: flex; align-items: center; gap: 8px; }
        .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .tool-btn.back { background: var(--primary-light); color: var(--primary); }
        .tool-btn.active-mode { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .tool-btn.active-tool { background: #ef4444; color: white; animation: pulse 1.5s infinite; }
        .tool-btn.inactive-tool { background: var(--card-bg); color: var(--text-dim); border: 1px solid var(--glass-border); }
        .tool-btn.reset { background: #475569; color: white; }
        .tool-btn.save { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        
        @media (max-width: 1024px) {
            .sticky-toolbar { left: 0; padding: 1rem; }
        }
        .tool-btn.approve { background: #10b981; color: white; border: 2px solid #fff; }
        .tool-btn.disapprove-btn { background: #ef4444; color: white; }

        .zoom-control { background: rgba(0,0,0,0.03); padding: 6px 15px; border-radius: 30px; border: 1px solid var(--glass-border); }
        .zoom-slider { cursor: pointer; accent-color: var(--primary); width: 100px; }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

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
        
        .sig-input { font-weight: bold; text-align: center; font-size: 9.5pt !important; }
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
          .rotate-handle { display: none !important; }
        }

        .rotate-handle {
          position: absolute;
          top: 50%;
          right: -50px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          cursor: grab;
          z-index: 130;
        }
        .rotate-handle:active { cursor: grabbing; }
        .rotate-line {
          width: 25px;
          height: 2px;
          background: #6366f1;
        }
        .rotate-circle {
          width: 26px;
          height: 26px;
          background: white;
          border: 2px solid #6366f1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
