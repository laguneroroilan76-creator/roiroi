import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function TripTicketForm() {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const isReadOnly = location.state?.readOnly;

  const user = JSON.parse(localStorage.getItem('user'));
  const isGuard = user?.role === 'Guard';
  const guardEditableFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn'];

  const isFieldDisabled = (fieldName, baseDisabled = false) => {
    const guardOnlyFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
    // Guard-only fields should be editable only by Guard
    if (guardOnlyFields.includes(fieldName)) {
      return baseDisabled || !isGuard;
    }

    if (isGuard) {
      // Guards can only edit checkpoint-related fields in the form
      return baseDisabled || !guardEditableFields.includes(fieldName);
    }

    return baseDisabled;
  };

  const [formData, setFormData] = useState({
    dateRequested: new Date().toISOString().split('T')[0],
    requestorName: user?.name || '',
    subsidiary: '',
    driver: '',
    vehicle: '',
    plateNumber: '',
    etdOffice: '',
    etaDestination: '',
    dateTimeDeparture: '',
    dateTimeReturn: '',
    passengerCount: '',
    hdiPassengers: '',
    outsidePassengers: '',
    passengersDetail: '',
    destination: '',
    purpose: '',
    medium: 'Land',
    requestedBy: user?.name || '',
    endorsedBy: '',
    approvedBy: '',
    kmOut: '',
    kmIn: '',
    guardOut: '',
    guardIn: '',
    ...initialData
  });

  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guards, setGuards] = useState([]);

  useEffect(() => {
    if (isGuard && !initialData) {
      navigate('/guard-dashboard', { replace: true });
    }
  }, [isGuard, initialData, navigate]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (isGuard) {
          const [guardsRes, vehiclesRes] = await Promise.all([
            api.get('/users/guards'),
            api.get('/vehicles')
          ]);
          setGuards(guardsRes.data || []);
          setDrivers([]);
          setVehicles(vehiclesRes.data);
          return;
        }

        const [usersRes, vehiclesRes] = await Promise.all([
          api.get('/users'),
          api.get('/vehicles')
        ]);
        setDrivers(usersRes.data.filter(u => u.role === 'Driver'));
        setVehicles(vehiclesRes.data);
      } catch (err) {
        console.error("Failed to fetch options", err);
      }
    };
    if (!isReadOnly) fetchOptions();
  }, [isReadOnly, isGuard]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vehicle') {
      const selectedVehicle = vehicles.find(v => v.name === value);
      setFormData(prev => ({
        ...prev,
        vehicle: value,
        plateNumber: selectedVehicle ? selectedVehicle.plateNumber : prev.plateNumber
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const guardedFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
      let payload = { ...formData, status };

      if (!isGuard) {
        // remove guard-only fields from payload for non-guards
        guardedFields.forEach((f) => delete payload[f]);
      } else if (isGuard && isReviewMode && initialData?.id) {
        // when Guard updates a ticket, only send the guard/actual-travel fields
        payload = {};
        ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'].forEach(k => {
          if (formData[k] !== undefined) payload[k] = formData[k];
        });
      }

      if (isReviewMode && initialData?.id) {
        await api.put(`/trip-tickets/${initialData.id}`, payload);
        showToast('Trip Ticket Updated Successfully!', 'success');
      } else {
        await api.post('/trip-tickets', payload);
        showToast('Trip Ticket Created Successfully!', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('TripTicket save error:', err, err.response?.data);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error saving Trip Ticket';
      showToast(msg, 'error');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this Trip Ticket?')) return;
    try {
      const payload = { ...formData, status: 'Approved', approvedBy: user.name };
      await api.put(`/trip-tickets/${initialData.id}`, payload);
      showToast('Trip Ticket Approved!', 'success');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Error approving Trip Ticket', 'error');
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this document?')) return;
    try {
      const payload = { ...formData, status: 'Archived' };
      await api.put(`/trip-tickets/${initialData.id}`, payload);
      showToast('Document Archived successfully!', 'success');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      showToast('Error archiving document', 'error');
    }
  };

  const handleDisapprove = async () => {
    if (!window.confirm('Are you sure you want to disapprove this Trip Ticket?')) return;
    try {
      const payload = { ...formData, status: 'Disapproved' };
      await api.put(`/trip-tickets/${initialData.id}`, payload);
      showToast('Trip Ticket Disapproved and moved to Archive', 'info');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      showToast('Error disapproving Trip Ticket', 'error');
    }
  };

  return (
    <div className="custom-form-page">
      <div className="no-print sticky-toolbar glass">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate(-1)}>← Back</button>
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
              💾 Submit Request
            </button>
          )}
          {status === 'Approved' && user?.canApprove && !isReadOnly && (
            <button className="tool-btn archive-btn" onClick={handleArchive}>
              📥 Archive
            </button>
          )}
        </div>
      </div>

      <div className="form-container glass">
        <div className="form-header">
          <div className="company-info">
            <h2>HDI ADVENTURES INC.</h2>
            <p>Trip Ticket Form</p>
          </div>
          {initialData?.id && (
            <div className="form-status">
              <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>
              <p>Ticket #{initialData.id.toString().padStart(4, '0')}</p>
            </div>
          )}
        </div>

        <div className="form-body">
          {/* SECTION 1: General Info */}
          <div className="form-section">
            <h3 className="section-title">General Information</h3>
            <div className="grid-3">
              <div className="form-group">
                <label>Date Requested</label>
                <input type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} disabled={isFieldDisabled('dateRequested', isReadOnly)} />
              </div>
              <div className="form-group">
                <label>Requestor Name</label>
                <input type="text" name="requestorName" value={formData.requestorName} onChange={handleChange} disabled={isFieldDisabled('requestorName', isReadOnly)} placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label>Subsidiary/Department</label>
                <input type="text" name="subsidiary" value={formData.subsidiary} onChange={handleChange} disabled={isFieldDisabled('subsidiary', isReadOnly)} placeholder="e.g. Sales, Operations" />
              </div>
            </div>
          </div>

          {/* SECTION 2: Travel Details */}
          <div className="form-section">
            <h3 className="section-title">Travel Details</h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Destination</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} disabled={isFieldDisabled('destination', isReadOnly)} placeholder="Target location" />
              </div>
              <div className="form-group">
                <label>Transportation Medium/s</label>
                <input
                  type="text"
                  name="medium"
                  value="Land"
                  readOnly
                  disabled
                />
              </div>
            </div>
            <div className="form-group mt-3">
              <label>Purpose of Trip</label>
              <textarea name="purpose" value={formData.purpose} onChange={handleChange} disabled={isFieldDisabled('purpose', isReadOnly)} placeholder="Detail the objective of the travel" rows="2"></textarea>
            </div>
            <div className="grid-3 mt-3">
              <div className="form-group">
                <label>Number of Passenger</label>
                <input type="number" min="0" name="passengerCount" value={formData.passengerCount} onChange={handleChange} disabled={isFieldDisabled('passengerCount', isReadOnly)} placeholder="Total passengers" />
              </div>
              <div className="form-group">
                <label>HDI Passengers</label>
                <input type="number" min="0" name="hdiPassengers" value={formData.hdiPassengers} onChange={handleChange} disabled={isFieldDisabled('hdiPassengers', isReadOnly)} placeholder="No. of HDI clients" />
              </div>
              <div className="form-group">
                <label>Passengers Outside of HDI</label>
                <input type="number" min="0" name="outsidePassengers" value={formData.outsidePassengers} onChange={handleChange} disabled={isFieldDisabled('outsidePassengers', isReadOnly)} placeholder="No. of external clients" />
              </div>
            </div>
            <div className="form-group mt-3">
              <label>Passengers Details</label>
              <textarea name="passengersDetail" value={formData.passengersDetail} onChange={handleChange} disabled={isFieldDisabled('passengersDetail', isReadOnly)} placeholder="Names of all passengers" rows="2"></textarea>
            </div>
          </div>

          {/* SECTION 3: Fleet Assignment */}
          <div className="form-section">
            <h3 className="section-title">Fleet Assignment</h3>
            <div className="grid-3">
              <div className="form-group">
                <label>Assigned Driver</label>
                <select name="driver" value={formData.driver} onChange={handleChange} disabled={isFieldDisabled('driver', isReadOnly)}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  {isReadOnly && !drivers.find(d => d.name === formData.driver) && formData.driver && (
                    <option value={formData.driver}>{formData.driver}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Vehicle</label>
                <select name="vehicle" value={formData.vehicle} onChange={handleChange} disabled={isFieldDisabled('vehicle', isReadOnly)}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  {isReadOnly && !vehicles.find(v => v.name === formData.vehicle) && formData.vehicle && (
                    <option value={formData.vehicle}>{formData.vehicle}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Plate Number</label>
                <input type="text" name="plateNumber" value={formData.plateNumber} onChange={handleChange} disabled={isFieldDisabled('plateNumber', isReadOnly)} placeholder="ABC-1234" />
              </div>
            </div>
          </div>

          {/* SECTION 4: Schedule & Logging */}
          <div className="form-section">
            <h3 className="section-title">Schedule & Logistics</h3>
            <div className="grid-2">
              <div className="schedule-box">
                <h4>Planned Schedule</h4>
                <div className="form-group">
                  <label>ETD (Estimated Time of Departure)</label>
                  <input type="datetime-local" name="etdOffice" value={formData.etdOffice} onChange={handleChange} disabled={isFieldDisabled('etdOffice', isReadOnly)} />
                </div>
                <div className="form-group mt-3">
                  <label>ETA (Estimated Time of Arrival)</label>
                  <input type="datetime-local" name="etaDestination" value={formData.etaDestination} onChange={handleChange} disabled={isFieldDisabled('etaDestination', isReadOnly)} />
                </div>
              </div>
              <div className="schedule-box actual-log">
                <h4>Actual Travel Log (Filled by Guard)</h4>
                <div className="form-group">
                  <label>Actual Departure</label>
                  <input type="datetime-local" name="dateTimeDeparture" value={formData.dateTimeDeparture} onChange={handleChange} disabled={isFieldDisabled('dateTimeDeparture', isReadOnly)} />
                </div>
                <div className="form-group mt-3">
                  <label>Actual Return</label>
                  <input type="datetime-local" name="dateTimeReturn" value={formData.dateTimeReturn} onChange={handleChange} disabled={isFieldDisabled('dateTimeReturn', isReadOnly)} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: Guard's Log */}
          <div className="form-section">
            <h3 className="section-title">Guard's Log (Vehicle Mileage)</h3>
            <div className="grid-2">
              <div className="schedule-box">
                <h4>Departure (Out)</h4>
                <div className="form-group">
                  <label>KM Reading (Out)</label>
                  <input type="text" name="kmOut" value={formData.kmOut} onChange={handleChange} disabled={isFieldDisabled('kmOut', isReadOnly)} placeholder="e.g. 10450" />
                </div>
                <div className="form-group mt-3">
                  <label>Guard on Duty (Out)</label>
                  <select name="guardOut" value={formData.guardOut} onChange={handleChange} disabled={isFieldDisabled('guardOut', isReadOnly)}>
                    <option value="">Select Guard</option>
                    {guards.map((guard) => (
                      <option key={guard.id} value={guard.name}>{guard.name}</option>
                    ))}
                    {formData.guardOut && !guards.find((guard) => guard.name === formData.guardOut) && (
                      <option value={formData.guardOut}>{formData.guardOut}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="schedule-box actual-log">
                <h4>Return (In)</h4>
                <div className="form-group">
                  <label>KM Reading (In)</label>
                  <input type="text" name="kmIn" value={formData.kmIn} onChange={handleChange} disabled={isFieldDisabled('kmIn', isReadOnly)} placeholder="e.g. 10520" />
                </div>
                <div className="form-group mt-3">
                  <label>Guard on Duty (In)</label>
                  <select name="guardIn" value={formData.guardIn} onChange={handleChange} disabled={isFieldDisabled('guardIn', isReadOnly)}>
                    <option value="">Select Guard</option>
                    {guards.map((guard) => (
                      <option key={guard.id} value={guard.name}>{guard.name}</option>
                    ))}
                    {formData.guardIn && !guards.find((guard) => guard.name === formData.guardIn) && (
                      <option value={formData.guardIn}>{formData.guardIn}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Signatures */}
          <div className="form-section signature-section">
            <div className="sig-block">
              <div className="sig-line">
                <input type="text" name="requestedBy" value={formData.requestedBy} onChange={handleChange} disabled={isFieldDisabled('requestedBy', isReadOnly)} placeholder="Name" />
              </div>
              <label>Requested By</label>
            </div>
            <div className="sig-block">
              <div className="sig-line">
                <input type="text" name="endorsedBy" value={formData.endorsedBy} onChange={handleChange} disabled={isFieldDisabled('endorsedBy', isReadOnly)} placeholder="Name" />
              </div>
              <label>Endorsed By</label>
            </div>
            <div className="sig-block">
              <div className="sig-line">
                <input type="text" name="approvedBy" value={formData.approvedBy} onChange={handleChange} disabled={isFieldDisabled('approvedBy', isReadOnly || !user?.canApprove)} placeholder="Name" />
              </div>
              <label>Approved By</label>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-form-page {
          background: var(--bg-gradient);
          min-height: 100vh;
          padding: 100px 20px 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          color: var(--text-main);
        }

        .sticky-toolbar {
          position: fixed; top: 0; left: 280px; right: 0;
          padding: 1rem 3rem; display: flex; justify-content: space-between; align-items: center;
          z-index: 900; border-bottom: 1px solid var(--glass-border);
          box-shadow: 0 4px 30px rgba(0,0,0,0.03);
          transition: var(--transition-smooth);
        }

        .tool-group { display: flex; gap: 12px; align-items: center; }
        .tool-btn { padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; font-weight: 700; transition: var(--transition-smooth); font-size: 0.95rem; }
        .tool-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .tool-btn.back { background: var(--primary-light); color: var(--primary); }
        .tool-btn.save { background: var(--primary); color: white; }
        .tool-btn.approve { background: #10b981; color: white; border: 2px solid transparent; }
        .tool-btn.disapprove-btn { background: #ef4444; color: white; }
        .tool-btn.archive-btn { background: #f59e0b; color: white; }

        .form-container {
          width: 100%;
          max-width: 900px;
          background: var(--card-bg);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border: 1px solid var(--glass-border);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid var(--primary);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        .company-info h2 { margin: 0; font-size: 1.8rem; font-weight: 800; color: var(--primary); }
        .company-info p { margin: 0; font-size: 1.2rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; }

        .form-status { text-align: right; }
        .form-status p { margin: 5px 0 0; font-weight: 700; color: var(--text-dim); }
        .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
        .status-badge.approved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.archived { background: rgba(100, 116, 139, 0.1); color: #94a3b8; }
        .status-badge.disapproved { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .form-section { margin-bottom: 2.5rem; }
        .section-title { 
          font-size: 1.1rem; 
          font-weight: 700; 
          color: var(--primary); 
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .mt-3 { margin-top: 1.5rem; }

        .form-group label {
          display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-dim); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: rgba(0,0,0,0.2);
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none; border-color: var(--primary); background: rgba(37, 99, 235, 0.05);
        }

        .form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled {
          opacity: 0.7; cursor: not-allowed; background: rgba(0,0,0,0.4);
        }

        .schedule-box {
          background: rgba(0,0,0,0.1);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .schedule-box h4 { margin: 0 0 1.2rem 0; color: var(--primary-light); font-size: 1rem; }
        .actual-log { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); }
        .actual-log h4 { color: #10b981; }

        .signature-section {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          margin-top: 4rem;
        }

        .sig-block { flex: 1; text-align: center; }
        .sig-line {
          border-bottom: 2px solid var(--text-dim);
          margin-bottom: 0.5rem;
        }
        .sig-line input {
          width: 100%; text-align: center; background: transparent; border: none; color: var(--text-main);
          font-size: 1.1rem; font-weight: 700; padding: 5px; outline: none;
        }
        .sig-block label { font-size: 0.85rem; color: var(--text-dim); font-weight: 600; text-transform: uppercase; }

        @media (max-width: 1024px) {
          .sticky-toolbar { left: 0; padding: 1rem; }
        }
        
        @media (max-width: 768px) {
          .grid-3, .grid-2 { grid-template-columns: 1fr; }
          .signature-section { flex-direction: column; gap: 3rem; }
          .form-container { padding: 1.5rem; }
        }

        @media print {
          @page { size: A4; margin: 1.5cm; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .custom-form-page { background: white !important; padding: 0 !important; color: black !important; }
          .form-container {
            box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; background: white !important;
          }
          
          .company-info h2 { color: black !important; }
          .company-info p { color: #555 !important; }
          .section-title { color: black !important; border-bottom: 1px solid #ccc !important; }
          .form-group label { color: #555 !important; }
          .status-badge { display: none !important; }
          
          .form-group input, .form-group select, .form-group textarea {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px solid #ccc !important;
            border-radius: 0 !important;
            color: black !important;
            padding: 4px 0 !important;
          }

          .schedule-box { border: 1px solid #ccc !important; background: transparent !important; }
          .schedule-box h4 { color: black !important; }
          
          .sig-line input { color: black !important; }
          .sig-block label { color: #555 !important; }
        }
      `}</style>
    </div>
  );
}
