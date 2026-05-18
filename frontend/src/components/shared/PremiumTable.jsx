import React from 'react';

const PremiumTable = ({ headers, children, emptyMessage = "No records found." }) => {
  return (
    <div className="premium-table-container glass">
      <table className="premium-table">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} style={header.style}>{header.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {React.Children.count(children) > 0 ? (
            children
          ) : (
            <tr>
              <td colSpan={headers.length} className="empty-row">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style>{`
        .premium-table-container { 
          background: var(--card-bg); 
          border-radius: 24px; 
          border: 1px solid var(--glass-border); 
          overflow: hidden; 
          transition: var(--transition-smooth); 
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        }
        .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
        .premium-table th { 
            background: var(--primary-light); 
            padding: 1.5rem; 
            font-size: 0.8rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            color: var(--primary); 
            letter-spacing: 1.5px; 
            border-bottom: 2px solid var(--glass-border); 
        }
        .premium-table td { 
          padding: 1.5rem; 
          border-bottom: 1px solid var(--glass-border); 
          vertical-align: middle; 
          color: var(--text-main); 
          font-weight: 500;
        }
        .premium-table tr:last-child td { border-bottom: none; }
        .premium-table tr:hover td { background: var(--primary-light); }
        .empty-row { padding: 5rem !important; text-align: center; color: var(--text-dim); font-style: italic; font-size: 1.1rem; }

        .dark-mode .premium-table th { background: rgba(255,255,255,0.03); color: var(--text-dim); }
        .dark-mode .premium-table tr:hover td { background: rgba(255,255,255,0.03); }
      `}</style>
    </div>
  );
};

export default PremiumTable;
