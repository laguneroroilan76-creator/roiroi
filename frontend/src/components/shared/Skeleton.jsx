import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ variant = 'text', width, height, style, className = '' }) => {
  return (
    <div 
      className={`skeleton-loader ${variant} ${className}`} 
      style={{ width, height, ...style }} 
    />
  );
};

export const PageSkeleton = ({ type = 'table' }) => {
  return (
    <div className="page-skeleton" style={{ padding: '2rem 3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <Skeleton variant="text" width="300px" height="40px" style={{ marginBottom: '1rem' }} />
        <Skeleton variant="text" width="200px" height="20px" />
      </div>

      {type === 'dashboard' && (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
             <Skeleton variant="rectangular" width="120px" height="40px" style={{ borderRadius: '12px' }} />
             <Skeleton variant="rectangular" width="120px" height="40px" style={{ borderRadius: '12px' }} />
             <Skeleton variant="rectangular" width="120px" height="40px" style={{ borderRadius: '12px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
             {Array(8).fill(0).map((_, i) => (
               <Skeleton key={i} variant="rectangular" height="140px" style={{ borderRadius: '24px' }} />
             ))}
          </div>
        </>
      )}

      {type === 'table' && (
        <div style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <Skeleton variant="rectangular" width="300px" height="40px" style={{ borderRadius: '12px' }} />
            <Skeleton variant="rectangular" width="150px" height="40px" style={{ borderRadius: '12px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <Skeleton variant="rectangular" height="50px" style={{ borderRadius: '8px' }} />
             <Skeleton variant="rectangular" height="50px" style={{ borderRadius: '8px' }} />
             <Skeleton variant="rectangular" height="50px" style={{ borderRadius: '8px' }} />
             <Skeleton variant="rectangular" height="50px" style={{ borderRadius: '8px' }} />
             <Skeleton variant="rectangular" height="50px" style={{ borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
};
