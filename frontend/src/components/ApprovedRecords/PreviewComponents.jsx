import React from 'react';

export function PreviewSection({ title, children }) {
  return (
    <section className="ticket-preview-section">
      <h3>{title}</h3>
      <div className="ticket-preview-section-grid">{children}</div>
    </section>
  );
}

export function PreviewCard({ title, accent, children }) {
  return (
    <div className={`ticket-preview-card ${accent === 'green' ? 'accent-green' : ''}`}>
      <h4>{title}</h4>
      <div className="ticket-preview-card-body">{children}</div>
    </div>
  );
}

export function PreviewField({ label, value, fullWidth = false, editable = false, type = 'text', name, onChange, options = [] }) {
  return (
    <div className={`ticket-preview-field ${fullWidth ? 'full-width' : ''}`}>
      <label>{label}</label>
      {editable ? (
        type === 'select' ? (
          <select 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            className="ticket-preview-value"
            style={{ width: '100%', outline: 'none', cursor: 'pointer' }}
          >
            <option value="">Select Guard...</option>
            {options.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
        ) : (
          <input 
            type={type} 
            name={name} 
            value={value || ''} 
            onChange={onChange} 
            className="ticket-preview-value" 
            style={{ width: '100%', outline: 'none' }}
          />
        )
      ) : (
        <div className={`ticket-preview-value ${!value ? 'empty' : ''}`}>
          {(() => {
            if (!value) return 'N/A';
            if (type === 'datetime-local' || (typeof value === 'string' && value.includes('T') && !isNaN(Date.parse(value)))) {
              try {
                return new Date(value).toLocaleString('en-US', {
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              } catch (e) {
                return value;
              }
            }
            return value;
          })()}
        </div>
      )}
    </div>
  );
}

export function SignatureBlock({ label, value }) {
  return (
    <div className="ticket-preview-signature">
      <div className="signature-line">{value || ' '}</div>
      <span>{label}</span>
    </div>
  );
}

export function Detail({ label, value, fullWidth = false }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto', padding: '0.9rem 1rem', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
        {label}
      </div>
      <div style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}
