import React from 'react';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getLocalDateString = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateTimeMin = () => `${getLocalDateString()}T00:00`;

export const FormHeader = ({ status, formData, user, companies = [] }) => {
  const isOngoing = status === 'Approved' && !!formData?.dateTimeDeparture && (!formData?.dateTimeReturn || formData.dateTimeReturn === "");
  const isCompleted = status === 'Approved' && !!formData?.dateTimeDeparture && !!formData?.dateTimeReturn && formData.dateTimeReturn !== "";
  
  // Determine company to use for logo
  const company = formData?.company || formData?.author?.company || user?.company?.name;
  const selectedCompany = companies.find(c => c.name === company);
  
  let logoSrc = "/HDI Primary Logo .png";
  if (selectedCompany?.logoUrl) {
    logoSrc = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedCompany.logoUrl}`;
  } else if (company?.includes('Adventures')) {
    logoSrc = "/Adventures_Logo.png";
  } else if (company?.includes('Capital')) {
    logoSrc = "/CGI_Logo.png";
  }

  return (
    <div className="form-header">
      <div className="company-info">
        <img 
          src={logoSrc}
          alt={`${company} Logo`}
          className="company-logo"
        />
      </div>
      <div className="form-title-right">
        <p>Trip Ticket Form</p>
        {status && (status !== 'Pending' || formData?.id) && (
          <div className="form-status" style={{ marginTop: '5px' }}>
            {isOngoing || status === 'DEPARTED' ? (
              <span className="status-badge ongoing" style={{ background: 'rgba(15, 23, 42, 0.15)', color: '#0f172a', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 900, border: '1px solid rgba(15, 23, 42, 0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                DEPARTED
              </span>
            ) : (isCompleted || status === 'ARRIVED') ? (
              <span className="status-badge completed" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 900, border: '1px solid rgba(16, 185, 129, 0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ARRIVED
              </span>
            ) : (
              <span className={`status-badge ${status?.toLowerCase()}`} style={{ padding: '6px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {status}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const GeneralInfo = ({ formData, handleChange, isFieldDisabled, isReadOnly }) => (
  <div className="form-section">
    <h3 className="section-title">General Information</h3>
    <div className="grid-2">
      <div className="form-group">
        <label>Date Requested</label>
        <input type="date" name="dateRequested" value={formData.dateRequested} onChange={handleChange} disabled={isFieldDisabled('dateRequested', isReadOnly)} min={getLocalDateString()} />
      </div>
      <div className="form-group">
        <label>Company</label>
        <input 
          type="text" 
          value={formData.company || ''} 
          disabled={true} 
          className="locked-input"
          style={{ background: 'rgba(15, 23, 42, 0.03)', color: '#0f172a', fontWeight: 600 }}
          placeholder="Select company from toolbar"
        />
      </div>
      <div className="form-group">
        <label>Requestor Name</label>
        <input type="text" name="requestorName" value={formData.requestorName} onChange={handleChange} disabled={isFieldDisabled('requestorName', isReadOnly)} placeholder={isFieldDisabled('requestorName', isReadOnly) ? "" : "Enter your name"} />
      </div>
      <div className="form-group">
        <label>Subsidiary/Department</label>
        <input type="text" name="subsidiary" value={formData.subsidiary} onChange={handleChange} disabled={isFieldDisabled('subsidiary', isReadOnly)} placeholder={isFieldDisabled('subsidiary', isReadOnly) ? "" : "e.g. Sales, Operations"} />
      </div>
    </div>
  </div>
);

export const TravelDetails = ({ formData, handleChange, isFieldDisabled, isReadOnly, vehicleCapacityLimit }) => (
  <div className="form-section">
    <h3 className="section-title">Travel Details</h3>
    <div className="grid-2">
      <div className="form-group">
        <label>Destination</label>
        <input type="text" name="destination" value={formData.destination} onChange={handleChange} disabled={isFieldDisabled('destination', isReadOnly)} placeholder={isFieldDisabled('destination', isReadOnly) ? "" : "Target location"} />
      </div>
      <div className="form-group">
        <label>Medium/s</label>
        <input type="text" name="medium" value={formData.medium} onChange={handleChange} disabled={isFieldDisabled('medium', isReadOnly)} />
      </div>
    </div>
    <div className="form-group mt-3">
      <label>Purpose of Trip</label>
      <textarea name="purpose" value={formData.purpose} onChange={handleChange} disabled={isFieldDisabled('purpose', isReadOnly)} placeholder={isFieldDisabled('purpose', isReadOnly) ? "" : "Detail the objective of the travel"} rows="2"></textarea>
    </div>
    <div className="grid-3 mt-3">
      <div className="form-group">
        <label>Number of Passenger</label>
        <input type="number" min="0" name="passengerCount" value={formData.passengerCount} readOnly disabled placeholder="Total passengers" />
      </div>
      <div className="form-group">
        <label>HDI Passengers</label>
        <input type="number" min="0" name="hdiPassengers" value={formData.hdiPassengers} onChange={handleChange} disabled={isFieldDisabled('hdiPassengers', isReadOnly)} placeholder={isFieldDisabled('hdiPassengers', isReadOnly) ? "" : "No. of HDI clients"} />
      </div>
      <div className="form-group">
        <label>Passengers Outside of HDI</label>
        <input type="number" min="0" name="outsidePassengers" value={formData.outsidePassengers} onChange={handleChange} disabled={isFieldDisabled('outsidePassengers', isReadOnly)} placeholder={isFieldDisabled('outsidePassengers', isReadOnly) ? "" : "No. of external clients"} />
      </div>
    </div>
    <p className="field-note" style={{ fontSize: '0.85rem', marginTop: '0.75rem', color: '#475569' }}>
      {vehicleCapacityLimit !== null
        ? `Selected vehicle can carry up to ${vehicleCapacityLimit} passenger(s) excluding the driver.`
        : 'Passenger total is calculated from HDI and external passenger counts.'}
    </p>
    <div className="form-group mt-3">
      <label>Passengers Names</label>
      <textarea name="passengersDetail" value={formData.passengersDetail} onChange={handleChange} disabled={isFieldDisabled('passengersDetail', isReadOnly)} placeholder={isFieldDisabled('passengersDetail', isReadOnly) ? "" : "Names of all passengers"} rows="2"></textarea>
    </div>
  </div>
);

export const FleetAssignment = ({ formData, handleChange, isFieldDisabled, isReadOnly, drivers, vehicles, occupiedDrivers, occupiedVehicles }) => (
  <div className="form-section">
    <h3 className="section-title">Fleet Assignment</h3>
    <div className="grid-3">
      <div className="form-group">
        <label>Assigned Driver</label>
        <select name="driver" value={formData.driver} onChange={handleChange} disabled={isFieldDisabled('driver', isReadOnly)}>
          <option value="">Select Driver</option>
          {drivers.map(d => {
            const isOccupied = occupiedDrivers.includes(d.name);
            const isInactive = d.status?.toLowerCase() === 'inactive';
            const disableOption = isOccupied || isInactive;
            
            let label = d.name;
            if (isInactive) {
                label += ' (INACTIVE)';
            } else if (isOccupied) {
                label += ' (OCCUPIED)';
            }

            return (
              <option key={d.id} value={d.name} disabled={disableOption}>
                {label}
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
            const isInactive = v.status?.toLowerCase() !== 'active';
            const disableOption = isOccupied || isInactive;

            let label = v.name;
            if (isInactive) {
                label += ` (${v.status?.toUpperCase() || 'UNAVAILABLE'})`;
            } else if (isOccupied) {
                label += ' (OCCUPIED)';
            }

            return (
              <option key={v.id} value={v.name} disabled={disableOption}>
                {label}
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
        <input type="text" name="plateNumber" value={formData.plateNumber} onChange={handleChange} disabled={isFieldDisabled('plateNumber', isReadOnly)} placeholder={isFieldDisabled('plateNumber', isReadOnly) ? "" : "ABC-1234"} />
      </div>
    </div>
  </div>
);

export const LogisticsSection = ({ formData, handleChange, isFieldDisabled, isReadOnly }) => (
  <div className="form-section">
    <h3 className="section-title">Schedule & Logistics</h3>
    <div className="grid-2">
      <div className="schedule-box">
        <h4>Planned Schedule</h4>
        <div className="form-group">
          <label>ETD (Estimated Time of Departure)</label>
          <input type="datetime-local" name="etdOffice" value={formatDateTime(formData.etdOffice)} onChange={handleChange} disabled={isFieldDisabled('etdOffice', isReadOnly)} min={getLocalDateTimeMin()} />
        </div>
        <div className="form-group mt-3">
          <label>ETA (Estimated Time of Arrival)</label>
          <input type="datetime-local" name="etaDestination" value={formatDateTime(formData.etaDestination)} onChange={handleChange} disabled={isFieldDisabled('etaDestination', isReadOnly)} min={getLocalDateTimeMin()} />
        </div>
      </div>
      <div className="schedule-box actual-log">
        <h4>Actual Travel Log (Filled by Guard)</h4>
        <div className="form-group">
          <label>Actual Departure</label>
          <input type="datetime-local" name="dateTimeDeparture" value={formatDateTime(formData.dateTimeDeparture)} onChange={handleChange} disabled={isFieldDisabled('dateTimeDeparture', isReadOnly)} />
        </div>
        <div className="form-group mt-3">
          <label>Actual Return</label>
          <input type="datetime-local" name="dateTimeReturn" value={formatDateTime(formData.dateTimeReturn)} onChange={handleChange} disabled={isFieldDisabled('dateTimeReturn', isReadOnly)} />
        </div>
      </div>
    </div>
  </div>
);

export const GuardLogSection = ({ formData, handleChange, isFieldDisabled, isReadOnly, guards }) => (
  <div className="form-section">
    <h3 className="section-title">Guard's Log (Vehicle Mileage)</h3>
    <div className="grid-2">
      <div className="schedule-box">
        <h4>Departure (Out)</h4>
        <div className="form-group">
          <label>KM Reading (Out)</label>
          <input type="text" name="kmOut" value={formData.kmOut} onChange={handleChange} disabled={isFieldDisabled('kmOut', isReadOnly)} placeholder={isFieldDisabled('kmOut', isReadOnly) ? "" : "e.g. 10450"} />
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
          <input type="text" name="kmIn" value={formData.kmIn} onChange={handleChange} disabled={isFieldDisabled('kmIn', isReadOnly)} placeholder={isFieldDisabled('kmIn', isReadOnly) ? "" : "e.g. 10520"} />
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
);

export const SignatureSection = ({ formData, handleChange, isFieldDisabled, isReadOnly, user }) => (
  <div className="form-section signature-section">
    <div className="sig-block">
      <div className="sig-line">
        <input type="text" name="requestedBy" value={formData.requestedBy} readOnly className="read-only-sig" placeholder={isFieldDisabled('requestedBy', isReadOnly) ? "" : "Name"} />
      </div>
      <label>Requested By</label>
    </div>
    <div className="sig-block">
      <div className="sig-line">
        <input type="text" name="endorsedBy" value={formData.endorsedBy} readOnly className="read-only-sig" placeholder="Name" />
      </div>
      <label>Endorsed By</label>
    </div>
    <div className="sig-block">
      <div className="sig-line">
        <input type="text" name="approvedBy" value={formData.approvedBy} readOnly className="read-only-sig" placeholder="Name" />
      </div>
      <label>Approved By</label>
    </div>
  </div>
);
