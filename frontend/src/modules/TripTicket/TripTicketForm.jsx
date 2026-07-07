import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
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
  const [users, setUsers] = useState([]);
  const [occupiedDrivers, setOccupiedDrivers] = useState([]);
  const [occupiedVehicles, setOccupiedVehicles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workflowTargets, setWorkflowTargets] = useState({ expectedEndorser: null, expectedApprover: null });

  const getDefaultFormData = () => {
    const requestedBy = initialData?.requestedBy?.name || initialData?.requestedBy || user?.name || '';
    const endorsedBy = initialData?.endorsedBy?.name || initialData?.endorsedBy || '';
    const approvedBy = initialData?.approvedBy?.name || initialData?.approvedBy || '';
    const guardOut = initialData?.guardOutUser?.name || initialData?.guardOut || '';
    const guardIn = initialData?.guardInUser?.name || initialData?.guardIn || '';

    const defaults = {
      dateRequested: new Date().toISOString().split('T')[0],
      requestorName: user?.name || '',
      company: initialData?.company || user?.company?.name || '',
      subsidiary: '',
      driver: '',
      vehicle: '',
      vehicleId: null,
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
      guardIn: ''
    };

    const merged = initialData ? { ...defaults, ...initialData } : defaults;

    if (initialData?.vehicleId !== undefined) {
      merged.vehicleId = initialData.vehicleId || null;
    }

    merged.requestedBy = requestedBy;
    merged.endorsedBy = endorsedBy;
    merged.approvedBy = approvedBy;
    merged.guardOut = guardOut;
    merged.guardIn = guardIn;

    return merged;
  };

  const [formData, setFormData] = useState(getDefaultFormData());

  useEffect(() => {
    setFormData(getDefaultFormData());
    setStatus(location.state?.initialData?.status || 'Pending');
  }, [location.state]);

  const parsePassengerValue = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicleId));
  const vehicleCapacityLimit = selectedVehicle && Number.isInteger(selectedVehicle.capacity)
    ? Math.max(0, selectedVehicle.capacity - 1)
    : null;

  const resolveRequestorUser = () => {
    const requestedByName = formData.requestorName || user?.name || '';
    if (!requestedByName) return user || null;
    const matchedUser = users.find((u) => u.name === requestedByName);
    return matchedUser || user || null;
  };

  const findDepartmentHead = (departmentId) => {
    if (!departmentId) return null;
    return users.find((u) => Number(u.departmentId) === Number(departmentId) && u.departmentRole === 'DepartmentHead');
  };

  const findPresident = () => users.find((u) => u.departmentRole === 'President');
  const findAdminDepartmentHead = () => users.find((u) => u.role === 'Admin' && u.departmentRole === 'DepartmentHead');

  const requestorUser = resolveRequestorUser();
  const vehicleDepartmentId = selectedVehicle?.departmentId ?? selectedVehicle?.department?.id ?? null;
  const vehicleCompanyId = selectedVehicle?.companyId ?? selectedVehicle?.company?.id ?? null;
  const requestorDepartmentId = requestorUser?.departmentId ?? null;
  const requestorCompanyId = requestorUser?.companyId ?? requestorUser?.company?.id ?? null;
  const departmentHeadForRequestor = findDepartmentHead(requestorDepartmentId);
  const departmentHeadForVehicle = findDepartmentHead(vehicleDepartmentId);
  const presidentUser = findPresident();
  const adminDepartmentHead = findAdminDepartmentHead();

  let previewEndorser = 'Not yet assigned';
  let previewApprover = 'Not yet assigned';
  let previewValidationMessage = '';

  if (requestorUser?.departmentRole === 'Staff' || !requestorUser?.departmentRole) {
    previewEndorser = departmentHeadForRequestor?.name || 'Not yet assigned';
    previewApprover = departmentHeadForVehicle?.name || 'Not yet assigned';
  } else if (requestorUser?.departmentRole === 'DepartmentHead') {
    previewEndorser = presidentUser?.name || 'Not yet assigned';
    previewApprover = departmentHeadForVehicle?.name || 'Not yet assigned';
  } else if (requestorUser?.departmentRole === 'President') {
    previewEndorser = adminDepartmentHead?.name || 'Not yet assigned';
    previewApprover = Number(requestorCompanyId) === Number(vehicleCompanyId)
      ? adminDepartmentHead?.name || 'Not yet assigned'
      : departmentHeadForVehicle?.name || 'Not yet assigned';
  }

  if (requestorUser?.departmentRole === 'DepartmentHead' && selectedVehicle && vehicleDepartmentId && Number(vehicleDepartmentId) === Number(requestorDepartmentId)) {
    previewValidationMessage = 'A Department Head cannot request a vehicle from their own department.';
  }

  useEffect(() => {
    const hdi = parsePassengerValue(formData.hdiPassengers);
    const outside = parsePassengerValue(formData.outsidePassengers);
    const total = hdi + outside;

    setFormData((prev) => {
      if (prev.passengerCount === String(total)) return prev;
      return { ...prev, passengerCount: String(total) };
    });
  }, [formData.hdiPassengers, formData.outsidePassengers]);

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

    // Timestamp fields should NEVER be editable by guards - they auto-populate
    if ((fieldName === 'dateTimeDeparture' || fieldName === 'dateTimeReturn') && isGuard) {
      return true;
    }

    const isDeparted = !!formData.dateTimeDeparture;
    const isArrived = !!(formData.dateTimeDeparture && formData.dateTimeReturn);

    if (isArrived || status === 'ARRIVED') return true;

    if (status === 'Approved' || status === 'DEPARTED') {
      const departureFields = ['kmOut', 'guardOut'];
      const returnFields = ['kmIn', 'guardIn'];

      if (isGuard) {
        // Disable return fields until departure is recorded
        if (!isDeparted && returnFields.includes(fieldName)) return true;
        // Can't edit departure fields once departed
        if (isDeparted && departureFields.includes(fieldName)) return true;
        // Can edit relevant fields based on phase
        if ([...departureFields, ...returnFields].includes(fieldName)) return false;
      }
      return true;
    }
    if (status === 'Archived' || status === 'Disapproved') return true;
    if (status === 'Pending' && isReviewMode) {
      return true;
    }

    const guardOnlyFields = ['kmOut', 'kmIn', 'guardOut', 'guardIn'];
    if (isGuard && !guardOnlyFields.includes(fieldName)) return true;
    if (!isGuard && [...guardOnlyFields, 'dateTimeDeparture', 'dateTimeReturn'].includes(fieldName)) return true;
    return isReadOnly;
  };

  useEffect(() => {
    if (isGuard && !initialData) navigate('/guard-dashboard', { replace: true });
  }, [isGuard, initialData, navigate]);

  useEffect(() => {
    if (isReviewMode && formData.id) {
      api.get(`/trip-tickets/${formData.id}/workflow-targets`)
        .then(res => setWorkflowTargets(res.data))
        .catch(err => console.error('Failed to fetch workflow targets', err));
    }
  }, [isReviewMode, formData.id, status]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const usersRes = await api.get(`/users?_t=${Date.now()}`);
        setUsers(usersRes.data || []);

        if (isGuard) {
          const [guardsRes, vehiclesRes, companiesRes] = await Promise.all([api.get('/users/guards'), api.get('/vehicles'), api.get('/companies')]);
          setGuards(guardsRes.data || []);
          setVehicles(vehiclesRes.data);
          setCompanies(companiesRes.data || []);
        } else {
          const [vehiclesRes, companiesRes] = await Promise.all([api.get('/vehicles'), api.get('/companies')]);
          setDrivers((usersRes.data || []).filter(u => u.isDriver === true));
          setVehicles(vehiclesRes.data);
          setCompanies(companiesRes.data || []);
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
      const selectedVehicle = vehicles.find(v => v.id === Number(value));
      setFormData(prev => ({
        ...prev,
        vehicle: selectedVehicle ? selectedVehicle.name : prev.vehicle,
        vehicleId: selectedVehicle ? selectedVehicle.id : null,
        plateNumber: selectedVehicle ? selectedVehicle.plateNumber || '' : prev.plateNumber
      }));
      return;
    }

    if (name === 'hdiPassengers' || name === 'outsidePassengers') {
      const normalized = value === '' ? '' : String(Math.max(0, parseInt(value, 10) || 0));
      setFormData(prev => ({ ...prev, [name]: normalized }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isDateInPast = (dateTimeValue) => {
    if (!dateTimeValue) return false;
    const localDate = dateTimeValue.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return localDate < today;
  };

  const handleSave = async () => {
    try {
      if (!isGuard) {
        if (isDateInPast(formData.dateRequested)) {
          showToast('You cannot select a past date for Date Requested.', 'error');
          return;
        }
        if (isDateInPast(formData.etdOffice)) {
          showToast('You cannot select a past date for ETD.', 'error');
          return;
        }
        if (isDateInPast(formData.etaDestination)) {
          showToast('You cannot select a past date for ETA.', 'error');
          return;
        }
      }

      const hdi = parsePassengerValue(formData.hdiPassengers);
      const outside = parsePassengerValue(formData.outsidePassengers);
      const totalPassengers = hdi + outside;
      if (selectedVehicle && Number.isInteger(selectedVehicle.capacity)) {
        const maxAllowed = Math.max(0, selectedVehicle.capacity - 1);
        if (totalPassengers > maxAllowed) {
          showToast(`Selected vehicle can carry at most ${maxAllowed} passengers excluding driver.`, 'error');
          return;
        }
      }

      const now = new Date().toLocaleString('sv').replace(' ', 'T').slice(0, 16);
      let payload = { ...formData };

      if (requestorUser?.departmentRole === 'DepartmentHead' && selectedVehicle && vehicleDepartmentId && Number(vehicleDepartmentId) === Number(requestorDepartmentId)) {
        showToast('A Department Head cannot request a vehicle from their own department.', 'error');
        return;
      }
      payload.passengerCount = String(totalPassengers);
      payload.vehicleId = formData.vehicleId ? Number(formData.vehicleId) : null;
      delete payload.status;

      if (isGuard) {
        // Departure phase
        if (!formData.dateTimeDeparture) {
          if (!formData.kmOut || !formData.guardOut) {
            showToast('KM Reading and Guard on Duty are required for departure', 'error');
            return;
          }
          payload.dateTimeDeparture = now;
        }
        // Return phase
        else if (formData.dateTimeDeparture && !formData.dateTimeReturn) {
          if (!formData.kmIn || !formData.guardIn) {
            showToast('KM Reading and Guard on Duty are required for return', 'error');
            return;
          }
          payload.dateTimeReturn = now;
        }
      }

      if (!isGuard) {
        ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'].forEach(f => delete payload[f]);
      } else if (isGuard && isReviewMode && initialData?.id) {
        // Extract only guard-log fields for update
        const guardPayload = {};
        ['kmOut', 'kmIn', 'guardOut', 'guardIn', 'dateTimeDeparture', 'dateTimeReturn'].forEach(k => {
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
      const payload = { ...formData, endorsedBy: formData.endorsedBy || user.name };
      await api.post(`/trip-tickets/${initialData.id}/endorse`, payload);
      setStatus('Endorsed');
      showToast('Trip Ticket Endorsed!', 'success');
      navigate('/pending');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error endorsing', 'error');
    }
  };

  const handleApprove = async () => {
    if (!await confirm('Approve this Trip Ticket?')) return;
    try {
      const payload = { ...formData, approvedBy: formData.approvedBy || user.name };
      await api.post(`/trip-tickets/${initialData.id}/approve`, payload);
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
      const payload = { ...formData, disapprovalReason: disReason };
      await api.post(`/trip-tickets/${initialData.id}/reject`, payload);
      showToast('Trip Ticket Disapproved', 'info');
      navigate('/pending');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error disapproving', 'error');
    }
  };

  const handleCancelRequest = async () => {
    if (!await confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.post(`/trip-tickets/${initialData.id}/cancel`);
      showToast('Request Cancelled', 'info');
      initialData ? navigate(-1) : navigate('/dashboard');
    } catch (err) {
      showToast('Error cancelling request', 'error');
    }
  };

  const isOwner = initialData?.authorId === user?.id || initialData?.requestorName === user?.name;

  return (
    <div className="custom-form-page">
      <div className="no-print sticky-toolbar office-toolbar">
        <div className="tool-group">
          <button className="tool-btn back" onClick={() => initialData ? navigate(-1) : navigate('/dashboard')}>Back</button>
        </div>
        <div className="tool-group">
          {!isReadOnly && !isReviewMode && !isGuard && (
            <div className="toolbar-company-select" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '0 16px', borderRadius: '12px', border: '1px solid #cbd5e1', height: '44px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company:</span>
              <select 
                name="company" 
                value={formData.company || ''} 
                onChange={handleChange}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <option value="">Select Company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {!isGuard && ['ARRIVED', 'Completed'].includes(status) && (
            <button className="tool-btn print-btn" onClick={() => window.print()} style={{ background: '#334155', color: 'white' }}>Print</button>
          )}
          {!isReviewMode && status === 'Pending' && (
            <button className="action-btn-premium primary" onClick={handleSave} style={{ borderRadius: '16px', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={20} />
              <span>Submit Request</span>
            </button>
          )}

          {/* Endorsement Stage */}
          {isReviewMode && status === 'Pending Endorsement' && Number(workflowTargets.expectedEndorser?.id) === Number(user?.id) && (
            <>
              <button className="tool-btn approve" onClick={handleEndorse}>Endorse</button>
              <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>Disapprove</button>
            </>
          )}

          {/* Approval Stage */}
          {isReviewMode && (status === 'Pending Approval' || status === 'Endorsed') && Number(workflowTargets.expectedApprover?.id) === Number(user?.id) && (
            <>
              <button className="tool-btn approve" onClick={handleApprove}>Approve</button>
              <button className="tool-btn disapprove-btn" onClick={handleDisapprove}>Disapprove</button>
            </>
          )}

          {isReviewMode && status.startsWith('Pending') && isOwner && (
            <button className="tool-btn cancel" onClick={handleCancelRequest}>Cancel Request</button>
          )}

          {isGuard && (status === 'Approved' || status === 'DEPARTED') && (
            <button className="tool-btn save" onClick={handleSave} style={{ background: '#2563eb', color: '#ffffff' }}>
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
          companies={companies}
          user={user}
          vehicleCapacityLimit={vehicleCapacityLimit}
          previewEndorser={previewEndorser}
          previewApprover={previewApprover}
          previewValidationMessage={previewValidationMessage}
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
