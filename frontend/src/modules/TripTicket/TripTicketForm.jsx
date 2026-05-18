import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import './TripTicketForm.css';
import TripTicketCoreForm from './TripTicketCoreForm';
import PrintTripTicket from './PrintTripTicket';

export default function TripTicketForm() {
  const { showToast, confirm } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state?.initialData;
  const isReviewMode = !!initialData;
  const isReadOnly = location.state?.readOnly;

  const user = JSON.parse(localStorage.getItem('user'));
  const isGuard = user?.role === 'Guard';

  const [status, setStatus] = useState(initialData?.status || 'Pending');
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guards, setGuards] = useState([]);
  const [occupiedDrivers, setOccupiedDrivers] = useState([]);
  const [occupiedVehicles, setOccupiedVehicles] = useState([]);

  const getDefaultFormData = () => ({
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
    medium: '',
    requestedBy: user?.name || '',
    endorsedBy: '',
    approvedBy: '',
    kmOut: '',
    kmIn: '',
    guardOut: '',
    guardIn: '',
    ...location.state?.initialData
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  useEffect(() => {
    setFormData(getDefaultFormData());
    setStatus(location.state?.initialData?.status || 'Pending');
  }, [location.state]);

  const isCompleted = !!(formData.dateTimeDeparture && formData.dateTimeReturn);

  const isFieldDisabled = (fieldName) => {
    // Signature fields should always be locked for non-authorities
    if (fieldName === 'endorsedBy' || fieldName === 'approvedBy') {
      if (status === 'Pending Endorsement' && fieldName === 'endorsedBy') {
        return !(user?.role === 'Admin' || user?.canApprove || user?.canEndorse);
      }
      if (status === 'Pending Approval' && fieldName === 'approvedBy') {
        return !(user?.role === 'Admin' || user?.canApprove || user?.canApproveTripTicket);
      }
      return true;
    }

    const isDeparted = !!formData.dateTimeDeparture;

    const isArrived = !!(formData.dateTimeDeparture && formData.dateTimeReturn);

    if (isArrived || status === 'ARRIVED') return true;

    if (status === 'Approved' || status === 'DEPARTED') {
      const departureFields = ['kmOut', 'guardOut', 'dateTimeDeparture'];
      const returnFields = ['kmIn', 'guardIn', 'dateTimeReturn'];

      if (isGuard) {
        if (isDeparted && departureFields.includes(fieldName)) return true;
        if ([...departureFields, ...returnFields].includes(fieldName)) return false;
      }
      return true;
    }
    if (status === 'Archived' || status === 'Disapproved') return true;
    if (status === 'Pending' && isReviewMode) {
      return true;
    }

    const guardOnlyFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'];
    if (isGuard && !guardOnlyFields.includes(fieldName)) return true;
    if (!isGuard && guardOnlyFields.includes(fieldName)) return true;
    return isReadOnly;
  };

  useEffect(() => {
    if (isGuard && !initialData) navigate('/guard-dashboard', { replace: true });
  }, [isGuard, initialData, navigate]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        if (isGuard) {
          const [guardsRes, vehiclesRes] = await Promise.all([api.get('/users/guards'), api.get('/vehicles')]);
          setGuards(guardsRes.data || []);
          setVehicles(vehiclesRes.data);
        } else {
          const [usersRes, vehiclesRes] = await Promise.all([api.get('/users'), api.get('/vehicles')]);
          setDrivers(usersRes.data.filter(u => u.role === 'Driver'));
          setVehicles(vehiclesRes.data);
        }
      } catch (err) { console.error("Failed to fetch options", err); }
    };
    if (!isReadOnly || isGuard) fetchOptions();
  }, [isReadOnly, isGuard]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.etdOffice && formData.etaDestination && !isReadOnly) {
        try {
          const res = await api.get(`/trip-tickets/check-occupancy?start=${formData.etdOffice}&end=${formData.etaDestination}`);
          const filtered = res.data.filter(t => t.id !== initialData?.id);
          setOccupiedDrivers(filtered.map(t => t.driver));
          setOccupiedVehicles(filtered.map(t => t.vehicle));
        } catch (err) { console.error("Availability check failed", err); }
      }
    };
    checkAvailability();
  }, [formData.etdOffice, formData.etaDestination, isReadOnly, initialData?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'vehicle') {
      const selectedVehicle = vehicles.find(v => v.name === value);
      setFormData(prev => ({ ...prev, vehicle: value, plateNumber: selectedVehicle ? selectedVehicle.plateNumber : prev.plateNumber }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const now = new Date().toLocaleString('sv').replace(' ', 'T').slice(0, 16);
      let payload = { ...formData, status: status === 'Pending' ? 'Pending Endorsement' : status };

      if (isGuard) {
        // Departure phase
        if (!formData.dateTimeDeparture) {
          if (!formData.kmOut || !formData.guardOut) {
            showToast('KM Reading and Guard on Duty are required for departure', 'error');
            return;
          }
          payload.dateTimeDeparture = now;
          payload.status = 'DEPARTED';
        }
        // Return phase
        else if (formData.dateTimeDeparture && !formData.dateTimeReturn) {
          if (!formData.kmIn || !formData.guardIn) {
            showToast('KM Reading and Guard on Duty are required for return', 'error');
            return;
          }
          payload.dateTimeReturn = now;
          payload.status = 'ARRIVED';
        }
      }

      if (!isGuard) {
        ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'].forEach(f => delete payload[f]);
      } else if (isGuard && isReviewMode && initialData?.id) {
        // Extract only guard-log fields for update
        const guardPayload = {};
        ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn', 'status'].forEach(k => {
          if (payload[k] !== undefined) guardPayload[k] = payload[k];
        });
        payload = guardPayload;
      }

      if (isReviewMode && initialData?.id) {
        await api.put(`/trip-tickets/${initialData.id}`, payload);
        showToast(`Trip Ticket ${payload.status || 'Updated'} Successfully!`, 'success');
      } else {
        await api.post('/trip-tickets', payload);
        showToast('Trip Ticket Created Successfully!', 'success');
      }
      navigate(isGuard ? '/guard-dashboard' : '/dashboard');
    } catch (err) { showToast(err.response?.data?.error || 'Error saving Trip Ticket', 'error'); }
  };

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [disReason, setDisReason] = useState('');

  const handleEndorse = async () => {
    if (!await confirm('Endorse this Trip Ticket?')) return;
    try {
      await api.put(`/trip-tickets/${initialData.id}`, { ...formData, status: 'Pending Approval', endorsedBy: user.name });
      showToast('Trip Ticket Endorsed!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error endorsing', 'error');
    }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this Trip Ticket?')) return;
    try {
      await api.put(`/trip-tickets/${initialData.id}`, { ...formData, status: 'Approved', approvedBy: user.name });
      showToast('Trip Ticket Approved!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error approving', 'error');
    }
  };

  const handleDisapprove = async () => {
    setShowReasonModal(true);
  };

  const confirmDisapprove = async () => {
    try {
      await api.put(`/trip-tickets/${initialData.id}`, { status: 'Disapproved', disapprovalReason: disReason });
      showToast('Trip Ticket Disapproved', 'info');
      navigate('/pending');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error disapproving', 'error');
    }
  };

  const handleCancelRequest = async () => {
    if (!await confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.put(`/trip-tickets/${initialData.id}`, { status: 'Cancelled' });
      showToast('Request Cancelled', 'info');
      navigate('/dashboard');
    } catch (err) {
      showToast('Error cancelling request', 'error');
    }
  };

  const isOwner = initialData?.authorId === user?.id || initialData?.requestorName === user?.name;

  return (
    <div className="custom-form-page">
      <div className="no-print sticky-toolbar office-toolbar">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => navigate(-1)}>Back</button>
        </div>
        <div className="tool-group">
          {!isGuard && ['Approved', 'DEPARTED', 'ARRIVED', 'Completed'].includes(status) && (
            <button className="tool-btn print-btn" onClick={() => window.print()} style={{ background: '#334155', color: 'white' }}>Print</button>
          )}
          {!isReviewMode && status === 'Pending' && (
            <button className="tool-btn save" onClick={handleSave} style={{ background: 'var(--primary)', color: 'white' }}>Submit Request</button>
          )}

          {/* Endorsement Stage */}
          {isReviewMode && status === 'Pending Endorsement' && (user?.role === 'Admin' || user?.canApprove || user?.canEndorse) && (
            <>
              <button className="tool-btn approve" onClick={handleEndorse}>Endorse</button>
              <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>Disapprove</button>
            </>
          )}

          {/* Approval Stage */}
          {isReviewMode && status === 'Pending Approval' && (user?.role === 'Admin' || user?.canApprove || user?.canApproveTripTicket) && (
            <>
              <button className="tool-btn approve" onClick={handleApprove}>Approve</button>
              <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>Disapprove</button>
            </>
          )}

          {isReviewMode && status.startsWith('Pending') && isOwner && (
            <button className="tool-btn cancel" onClick={handleCancelRequest}>Cancel Request</button>
          )}

          {isGuard && (status === 'Approved' || status === 'DEPARTED') && (
            <button className="tool-btn save" onClick={handleSave} style={{ background: 'var(--primary)', color: '#ffffff' }}>
              {!formData.dateTimeDeparture ? 'DEPARTURE' : 'ARRIVED'}
            </button>
          )}
          {status === 'Approved' && !formData.dateTimeDeparture && (
            <div className="status-badge approved" style={{ marginLeft: '10px' }}>APPROVED</div>
          )}
          {(status === 'Approved' || status === 'DEPARTED') && formData.dateTimeDeparture && !formData.dateTimeReturn && (
            <div className="status-badge ongoing" style={{
              marginLeft: '10px',
              background: 'rgba(15, 23, 42, 0.15)',
              color: '#0f172a',
              padding: '6px 16px',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 900,
              border: '1px solid rgba(15, 23, 42, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>DEPARTED</div>
          )}
          {(status === 'Approved' || status === 'ARRIVED') && formData.dateTimeDeparture && formData.dateTimeReturn && (
            <div className="status-badge completed" style={{
              marginLeft: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '6px 16px',
              borderRadius: '100px',
              fontSize: '0.85rem',
              fontWeight: 900,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>ARRIVED</div>
          )}
          {/* Status badges removed from toolbar for cleaner UI */}
        </div>
      </div>

      <div className="form-main-content no-print">
        <TripTicketCoreForm
          formData={formData}
          status={status}
          handleChange={handleChange}
          isFieldDisabled={isFieldDisabled}
          isReadOnly={isReadOnly}
          drivers={drivers}
          vehicles={vehicles}
          occupiedDrivers={occupiedDrivers}
          occupiedVehicles={occupiedVehicles}
          guards={guards}
          user={user}
        />
      </div>

      <PrintTripTicket ticket={formData} />

      {showReasonModal && (
        <div className="reason-modal-overlay">
          <div className="reason-modal glass">
            <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Disapproval Reason
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1.2rem' }}>Please provide a reason for rejecting this request.</p>
            <textarea
              value={disReason}
              onChange={(e) => setDisReason(e.target.value)}
              placeholder="Enter reason here..."
              style={{
                width: '100%',
                minHeight: '120px',
                marginBottom: '1.5rem',
                padding: '1.2rem',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
                fontSize: '1rem',
                resize: 'none',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="tool-btn disapprove-btn"
                onClick={confirmDisapprove}
                disabled={!disReason.trim()}
                style={{ flex: 1, background: disReason.trim() ? '#ef4444' : '#666' }}
              >
                Confirm Disapprove
              </button>
              <button
                className="tool-btn back"
                onClick={() => setShowReasonModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
