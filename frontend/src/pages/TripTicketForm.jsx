import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export default function TripTicketForm() {
  const { showToast, confirm } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const isReadOnly = location.state?.readOnly;

  const user = JSON.parse(localStorage.getItem('user'));
  const isGuard = user?.role === 'Guard';
  const guardEditableFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn'];

  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [disReason, setDisReason] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guards, setGuards] = useState([]);
  const [occupiedDrivers, setOccupiedDrivers] = useState([]);
  const [occupiedVehicles, setOccupiedVehicles] = useState([]);

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

  const isCompleted = !!(formData.dateTimeDeparture && formData.dateTimeReturn);

  const isFieldDisabled = (fieldName, baseDisabled = false) => {
    // 1. If both actual dates are filled, it's DONE. Lock everything for everyone.
    if (isCompleted) return true;

    // 2. If it's Approved, lock core info and signatures for everyone (Only logs for Guard)
    if (status === 'Approved') {
       const guardLogFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
       if (isGuard && guardLogFields.includes(fieldName)) return false;
       return true;
    }

    // 3. If Archived or Disapproved, everything is locked
    if (status === 'Archived' || status === 'Disapproved') return true;

    // 4. If status is Pending and in Review Mode (Approver View)
    if (status === 'Pending' && isReviewMode) {
      // Approvers should be able to fill their names
      if (fieldName === 'approvedBy' || fieldName === 'endorsedBy') return false;
      return true;
    }

    // 5. Default behavior for new forms / Guard restriction
    const guardOnlyFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
    if (isGuard && !guardOnlyFields.includes(fieldName)) return true;
    if (!isGuard && guardOnlyFields.includes(fieldName)) return true;

    return baseDisabled || isReadOnly;
  };


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

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.etdOffice && formData.etaDestination && !isReadOnly) {
        try {
          const res = await api.get(`/trip-tickets/check-occupancy?start=${formData.etdOffice}&end=${formData.etaDestination}`);
          // If we are editing, we should filter out our own record's usage
          const filtered = res.data.filter(t => t.id !== initialData?.id);
          setOccupiedDrivers(filtered.map(t => t.driver));
          setOccupiedVehicles(filtered.map(t => t.vehicle));
        } catch (err) {
          console.error("Availability check failed", err);
        }
      }
    };
    checkAvailability();
  }, [formData.etdOffice, formData.etaDestination, isReadOnly, initialData?.id]);

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

      // Check for occupancy conflicts before submitting
      if (formData.etdOffice && formData.etaDestination && !isGuard) {
        if (formData.driver && occupiedDrivers.includes(formData.driver)) {
          showToast(`Driver ${formData.driver} is already booked for this schedule.`, 'error');
          return;
        }
        if (formData.vehicle && occupiedVehicles.includes(formData.vehicle)) {
          showToast(`Vehicle ${formData.vehicle} is already booked for this schedule.`, 'error');
          return;
        }
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
    const confirmed = await confirm('Are you sure you want to approve this Trip Ticket?');
    if (!confirmed) return;
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
    const confirmed = await confirm('Are you sure you want to archive this document?');
    if (!confirmed) return;
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

  const handleDisapprove = () => {
    setShowReasonModal(true);
  };

  const confirmDisapprove = async () => {
    const confirmed = await confirm('Are you sure you want to disapprove this Trip Ticket?');
    if (!confirmed) return;
    try {
      const payload = { ...formData, status: 'Disapproved', disapprovalReason: disReason };
      await api.put(`/trip-tickets/${initialData.id}`, payload);
      showToast('Trip Ticket Disapproved and moved to Archive', 'info');
      navigate('/archived');
    } catch (err) {
      console.error(err);
      showToast('Error disapproving Trip Ticket', 'error');
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm('Are you sure you want to CANCEL this approved trip? This will release the driver and vehicle for other bookings.');
    if (!confirmed) return;
    try {
      const payload = { ...formData, status: 'Cancelled' };
      await api.put(`/trip-tickets/${initialData.id}`, payload);
      showToast('Trip Ticket Cancelled!', 'info');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Error cancelling Trip Ticket', 'error');
    }
  };

  const handleDrop = async () => {
    const confirmed = await confirm('Are you sure you want to DROP (delete) this pending request? This cannot be undone.');
    if (!confirmed) return;
    try {
      await api.delete(`/trip-tickets/${initialData.id}`);
      showToast('Trip Ticket Deleted successfully!', 'info');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showToast('Error deleting Trip Ticket', 'error');
    }
  };

  return (
    <div className="custom-form-page">
      {showReasonModal && (
        <div className="reason-modal-overlay no-print">
          <div className="reason-modal glass">
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>❌ Disapproval Reason</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
              Optional: Please provide a reason for disapproving this document.
            </p>
            <textarea 
              value={disReason} 
              onChange={(e) => setDisReason(e.target.value)}
              placeholder="Enter reason for disapproval here..."
              style={{ 
                width: '100%', 
                minHeight: '120px', 
                padding: '1rem', 
                borderRadius: '12px', 
                border: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.02)',
                color: 'var(--text-main)',
                fontSize: '1rem',
                marginBottom: '1.5rem',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowReasonModal(false)}
                style={{ 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: '10px', 
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-dim)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDisapprove}
                style={{ 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: '10px', 
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Disapprove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="no-print sticky-toolbar glass">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate(-1)}>← Back</button>
        </div>

        <div className="tool-group">
          {isReviewMode && status === 'Pending' && (
            <>
              {user?.canApprove && (
                <>
                  <button className="tool-btn approve" onClick={handleApprove}>
                    ✅ Approve
                  </button>
                  <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>
                    ❌ Disapprove
                  </button>
                </>
              )}
              {(user?.canApprove || initialData?.userId === user?.id || formData?.requestedBy === user?.name) && (
                <button className="tool-btn delete" onClick={handleDrop} style={{ background: '#4b5563' }}>
                  🗑️ Drop
                </button>
              )}
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
          {status === 'Approved' && !formData.dateTimeDeparture && (user?.canApprove || initialData?.userId === user?.id || formData?.requestedBy === user?.name) && (
            <button className="tool-btn cancel-btn" onClick={handleCancel} style={{ background: '#f97316' }}>
              🚫 Cancel Trip
            </button>
          )}
          <button className="tool-btn print-btn" onClick={() => window.print()}>
            🖨️ Print Form
          </button>
        </div>
      </div>

      <div className="form-container glass">
        <div className="form-header">
          <div className="company-info">
            <img 
              src="/HDI Primary Logo .png" 
              alt="HDI Logo" 
              className="company-logo"
            />
          </div>
          <div className="form-title-right">
            <p>Trip Ticket Form</p>
          </div>
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
              <label>Passengers Names</label>
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
                  {drivers.map(d => {
                    const isOccupied = occupiedDrivers.includes(d.name);
                    return (
                      <option key={d.id} value={d.name} disabled={isOccupied}>
                        {d.name} {isOccupied ? '(OCCUPIED)' : ''}
                      </option>
                    );
                  })}
                  {isReadOnly && !drivers.find(d => d.name === formData.driver) && formData.driver && (
                    <option value={formData.driver}>{formData.driver}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Vehicle</label>
                <select name="vehicle" value={formData.vehicle} onChange={handleChange} disabled={isFieldDisabled('vehicle', isReadOnly)}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => {
                    const isOccupied = occupiedVehicles.includes(v.name);
                    return (
                      <option key={v.id} value={v.name} disabled={isOccupied}>
                        {v.name} {isOccupied ? '(OCCUPIED)' : ''}
                      </option>
                    );
                  })}
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


          {/* SECTION 6: Signatures */}
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
        .tool-btn.print-btn { background: #334155; color: white; }

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

        .form-title-right p {
          color: #000 !important;
          font-size: 1.2rem;
          font-weight: 800;
          text-transform: uppercase;
          margin: 0;
          letter-spacing: 1px;
        }

        .form-status { text-align: right; }
        .form-status p { margin: 5px 0 0; font-weight: 700; color: var(--text-dim); }
        .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
        .status-badge.approved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.archived { background: rgba(100, 116, 139, 0.1); color: #94a3b8; }
        .status-badge.disapproved { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-badge.cancelled { background: rgba(249, 115, 22, 0.1); color: #f97316; }

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

        .company-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .company-logo {
          height: 60px;
          width: auto;
          object-fit: contain;
        }

        .reason-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 1rem;
        }

        .reason-modal {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          border-radius: 24px;
          background: var(--card-bg);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--glass-border);
          animation: modalAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media print {
          /* Hide all UI elements */
          .glass-sidebar, .mobile-menu-toggle, .sidebar-overlay, .sticky-toolbar, .no-print, .reason-modal-overlay {
            display: none !important;
          }
          
          @page { 
            size: A4; 
            margin: 5mm !important; 
          }
          
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            color: black !important;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          .main-content { padding: 0 !important; margin: 0 !important; width: 100% !important; background: white !important; }
          .custom-form-page { background: white !important; padding: 0 !important; color: black !important; min-height: auto !important; margin: 0 !important; }
          
          .form-container {
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            max-width: 100% !important; 
            width: 100% !important;
            background: white !important;
            margin: 0 !important;
            transform: scale(0.94);
            transform-origin: top center;
          }
          
          .company-logo { height: 40px !important; margin-bottom: 2px; }
          .form-header { 
            margin-bottom: 1.5rem !important; 
            border-bottom: 2px solid #000 !important;
            padding-top: 20px !important;
            padding-bottom: 15px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .form-header h1, .form-title-right p { 
            font-size: 1.2rem !important; 
            margin: 0 !important; 
            text-transform: uppercase; 
            font-weight: 800 !important; 
            color: #000 !important;
          }
          
          .form-section { margin-bottom: 0.8rem !important; }
          .section-title { 
            font-size: 0.8rem !important; 
            font-weight: 900 !important; 
            text-transform: uppercase; 
            border-bottom: 2px solid #000 !important; 
            margin-bottom: 0.5rem !important;
            padding-bottom: 1px !important;
            color: #000 !important;
          }
          
          .grid-3, .grid-2 { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 0.8rem !important; 
          }
          .grid-3 { grid-template-columns: repeat(3, 1fr) !important; }
          
          .form-group { margin-bottom: 0.3rem !important; }
          .form-group label { 
            font-size: 0.6rem !important; 
            font-weight: 800 !important; 
            text-transform: uppercase; 
            margin-bottom: 1px !important; 
            display: block !important;
            color: #333 !important;
          }
          
          .form-group input, .form-group select, .form-group textarea {
            border: 1px solid #ccc !important;
            border-radius: 8px !important;
            padding: 2px 8px !important;
            font-size: 0.8rem !important;
            background: #fff !important;
            width: 100% !important;
            min-height: auto !important;
            color: #000 !important;
            font-weight: 600 !important;
            /* Remove dropdown arrows */
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
          }

          /* Hide placeholders in print */
          input::placeholder, textarea::placeholder {
            color: transparent !important;
            opacity: 0 !important;
          }
          
          .schedule-box {
            border: 1.5px solid #000 !important;
            border-radius: 10px !important;
            padding: 0.6rem !important;
            background: #fff !important;
          }
          .schedule-box.actual-log {
            border-color: #000 !important;
          }
          .schedule-box h4 { 
            font-size: 0.7rem !important; 
            font-weight: 900 !important; 
            text-transform: uppercase; 
            border-bottom: 1px solid #000 !important;
            margin-bottom: 0.3rem !important;
            padding-bottom: 1px !important;
            text-decoration: none !important;
            color: #000 !important; /* Force black instead of green */
          }
          
          .signature-section { 
            margin-top: 1.5rem !important; 
            display: grid !important; 
            grid-template-columns: repeat(3, 1fr) !important; 
            gap: 1.5rem !important;
            text-align: center !important;
          }
          
          .sig-block { border-top: none !important; }
          .sig-line { 
            border-bottom: 2.5px solid #000 !important; 
            margin-bottom: 3px !important; 
          }
          .sig-line input { 
            border: none !important; 
            text-align: center !important; 
            font-size: 1rem !important; 
            font-weight: 900 !important;
            text-transform: uppercase !important;
          }
          .sig-block label { 
            font-size: 0.65rem !important; 
            font-weight: 900 !important; 
            text-transform: uppercase !important;
            color: #000 !important;
          }
          
          /* Force single page */
          .form-section, .signature-section { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
