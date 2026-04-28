import React, { useState } from 'react';

const CalendarView = ({ tickets, onTicketClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const days = [];
  const startDay = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);

  const getTicketsForDay = (day) => {
    if (!day) return [];
    return tickets.filter(t => {
      const d = new Date(t.createdAt);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  return (
    <div className="calendar-section fade-in">
      <div className="calendar-header">
        <div className="controls">
          <button className="nav-btn" onClick={handlePrevMonth}>‹</button>
          <h2>{monthName} {year}</h2>
          <button className="nav-btn" onClick={handleNextMonth}>›</button>
        </div>
        <div className="legend">
          <div className="legend-item"><span className="dot pending" /> Pending</div>
          <div className="legend-item"><span className="dot approved" /> Approved</div>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="day-name">{d}</div>
        ))}
        {days.map((day, idx) => (
          <div key={idx} className={`calendar-day ${!day ? 'empty' : ''}`}>
            {day && <span className="day-number">{day}</span>}
            <div className="day-content">
              {getTicketsForDay(day).map(t => (
                <div 
                  key={t.id} 
                  className={`ticket-chip ${t.status.toLowerCase()}`}
                  onClick={() => onTicketClick(t)}
                  title={t.requestorName}
                >
                  {t.requestorName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .calendar-section { background: var(--card-bg); padding: 2.5rem; border-radius: 30px; border: 1px solid var(--glass-border); transition: all 0.3s; }
        .calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .calendar-header .controls { display: flex; align-items: center; gap: 1.5rem; }
        .calendar-header h2 { font-size: 1.8rem; font-weight: 800; min-width: 250px; text-align: center; color: var(--text-main); }
        .nav-btn { width: 44px; height: 44px; border-radius: 14px; border: 1px solid var(--glass-border); background: var(--card-bg); color: var(--text-main); font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .nav-btn:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }

        .legend { display: flex; gap: 1.5rem; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.pending { background: #f97316; }
        .dot.approved { background: #22c55e; }

        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--glass-border); border: 1px solid var(--glass-border); border-radius: 20px; overflow: hidden; }
        .day-name { background: rgba(0,0,0,0.02); padding: 1.2rem; text-align: center; font-size: 0.8rem; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .calendar-day { background: var(--card-bg); height: 130px; padding: 1rem; position: relative; transition: all 0.2s; color: var(--text-main); }
        .calendar-day.empty { opacity: 0.5; }
        .day-number { font-weight: 800; font-size: 0.9rem; color: var(--text-dim); }
        .day-content { margin-top: 0.8rem; display: flex; flex-direction: column; gap: 4px; }
        
        .ticket-chip { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ticket-chip.pending { background: rgba(249, 115, 22, 0.1); color: #f97316; border-left: 3px solid #f97316; }
        .ticket-chip.approved { background: rgba(34, 197, 94, 0.1); color: #22c55e; border-left: 3px solid #22c55e; }
        .ticket-chip:hover { transform: scale(1.05); z-index: 10; }
      `}</style>
    </div>
  );
};

export default CalendarView;
