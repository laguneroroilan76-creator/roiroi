import React from 'react';

const PrintTripTicket = ({ ticket }) => {
  if (!ticket) return null;

  // Utility to handle long text in single-line fields
  const singleLineStyle = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  // Standard data weight (normal)
  const dataWeight = { fontWeight: 500 };
  
  // Highlighted bold weight (extra bold)
  const boldWeight = { fontWeight: 900 };

  // Helper to format date and time in 12-hour format (AM/PM)
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return as is if invalid
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="trip-ticket-print-wrapper print-only" style={{ 
      width: '100%', 
      maxWidth: '850px', 
      margin: '0 auto', 
      background: 'white', 
      padding: '30px 25px',
      color: 'black',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '22px' }}>
        <img src="/HDI Primary Logo .png" alt="HDI Logo" style={{ height: '55px' }} />
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Trip Ticket Form</h1>
        </div>
      </div>

      {/* MAIN BODY BOX */}
      <div style={{ border: '2.5px solid #000', padding: '28px' }}>
        
        {/* GENERAL INFO SECTION */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1.5px solid #000', paddingBottom: '5px' }}>General Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Date Requested</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.dateRequested || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Requestor Name</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.requestorName || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Dept / Subsidiary</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.subsidiary || ''}</div>
            </div>
          </div>
        </div>

        {/* TRAVEL DETAILS */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1.5px solid #000', paddingBottom: '5px' }}>Travel Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Destination</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.destination || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Medium/s</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.medium || ''}</div>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Purpose of Trip</label>
            <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...singleLineStyle, ...dataWeight }}>{ticket.purpose || ''}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Total Passengers</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...dataWeight }}>{ticket.passengerCount || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>HDI Passengers</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...dataWeight }}>{ticket.hdiPassengers || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>External Passengers</label>
              <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', width: '100%', ...dataWeight }}>{ticket.outsidePassengers || ''}</div>
            </div>
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Passenger Details</label>
            <div style={{ fontSize: '1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '2rem', width: '100%', overflow: 'hidden', ...dataWeight }}>{ticket.passengersDetail || ''}</div>
          </div>
        </div>

        {/* FLEET ASSIGNMENT */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1.5px solid #000', paddingBottom: '5px' }}>Fleet Assignment</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '25px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Assigned Driver</label>
              <div style={{ fontSize: '1.1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', ...singleLineStyle, ...dataWeight }}>{ticket.driver || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Vehicle</label>
              <div style={{ fontSize: '1.1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', ...singleLineStyle, ...dataWeight }}>{ticket.vehicle || ''}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#000', display: 'block', textTransform: 'uppercase' }}>Plate Number</label>
              <div style={{ fontSize: '1.1rem', borderBottom: '1.5px solid #000', paddingBottom: '3px', marginTop: '4px', height: '1.4rem', ...singleLineStyle, ...dataWeight }}>{ticket.plateNumber || ''}</div>
            </div>
          </div>
        </div>

        {/* SCHEDULES & LOGS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
          <div style={{ border: '1.5px solid #000', padding: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 900, borderBottom: '1.2px solid #000', paddingBottom: '5px' }}>PLANNED SCHEDULE</h5>
            <div style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex' }}>
              <span style={{ fontWeight: 900, width: '50px' }}>ETD:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{formatDateTime(ticket.etdOffice)}</span>
            </div>
            <div style={{ fontSize: '0.9rem', display: 'flex' }}>
              <span style={{ fontWeight: 900, width: '50px' }}>ETA:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{formatDateTime(ticket.etaDestination)}</span>
            </div>
          </div>
          <div style={{ border: '1.5px solid #000', padding: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 900, borderBottom: '1.2px solid #000', paddingBottom: '5px' }}>ACTUAL TRAVEL LOG (GUARD)</h5>
            <div style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex' }}>
              <span style={{ fontWeight: 900, width: '100px' }}>DEPARTURE:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{formatDateTime(ticket.dateTimeDeparture)}</span>
            </div>
            <div style={{ fontSize: '0.9rem', display: 'flex' }}>
              <span style={{ fontWeight: 900, width: '100px' }}>RETURN:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{formatDateTime(ticket.dateTimeReturn)}</span>
            </div>
          </div>
        </div>

        {/* MILEAGE LOG */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '35px' }}>
          <div style={{ border: '1.5px solid #000', padding: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 900, borderBottom: '1.2px solid #000', paddingBottom: '5px' }}>MILEAGE OUT</h5>
            <div style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex' }}>
              <span style={{ fontWeight: 900 }}>KM OUT:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, marginLeft: '10px', paddingBottom: '1px', ...dataWeight }}>{ticket.kmOut || ''}</span>
            </div>
            <div style={{ fontSize: '1rem', display: 'flex' }}>
              <span style={{ fontWeight: 900 }}>GUARD:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, marginLeft: '10px', paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{ticket.guardOut || ''}</span>
            </div>
          </div>
          <div style={{ border: '1.5px solid #000', padding: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '0.75rem', fontWeight: 900, borderBottom: '1.2px solid #000', paddingBottom: '5px' }}>MILEAGE IN</h5>
            <div style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex' }}>
              <span style={{ fontWeight: 900 }}>KM IN:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, marginLeft: '10px', paddingBottom: '1px', ...dataWeight }}>{ticket.kmIn || ''}</span>
            </div>
            <div style={{ fontSize: '1rem', display: 'flex' }}>
              <span style={{ fontWeight: 900 }}>GUARD:</span> 
              <span style={{ borderBottom: '1.2px solid #000', flex: 1, marginLeft: '10px', paddingBottom: '1px', ...singleLineStyle, ...dataWeight }}>{ticket.guardIn || ''}</span>
            </div>
          </div>
        </div>

        {/* SIGNATURES SECTION - BOLD NAMES & LABELS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', textAlign: 'center', marginTop: '35px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ borderBottom: '2.5px solid #000', paddingBottom: '5px', height: '1.5rem', fontSize: '1rem', ...singleLineStyle, ...boldWeight, textTransform: 'uppercase' }}>
              {ticket.requestedBy || ''}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, marginTop: '8px', color: '#000' }}>REQUESTED BY</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ borderBottom: '2.5px solid #000', paddingBottom: '5px', height: '1.5rem', fontSize: '1rem', ...singleLineStyle, ...dataWeight, textTransform: 'uppercase' }}>
              {ticket.endorsedBy || ''}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, marginTop: '8px', color: '#444' }}>ENDORSED BY</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ borderBottom: '2.5px solid #000', paddingBottom: '5px', height: '1.5rem', fontSize: '1rem', ...singleLineStyle, ...boldWeight, textTransform: 'uppercase' }}>
              {ticket.approvedBy || ''}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, marginTop: '8px', color: '#000' }}>APPROVED BY</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintTripTicket;
