import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api, { BASE_URL } from '../../services/api';
import './NotificationBell.css';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const socket = io(BASE_URL);
    socket.on('new_notification', (notif) => {
      let hasAccess = false;
      if (!notif.targetRole) hasAccess = true;
      else if (notif.targetUserId === user.id) hasAccess = true;
      else if (user.role === 'Admin' && notif.targetRole === 'Admin') hasAccess = true;
      else if (user.role === 'IT' && notif.targetRole === 'IT') hasAccess = true;
      else if (user.canApprove && notif.targetRole === 'Approver') hasAccess = true;
      else if (user.canApprovePRF && notif.targetRole === 'PRF_Approver') hasAccess = true;
      else if (user.canApproveRFP && notif.targetRole === 'RFP_Approver') hasAccess = true;
      else if (user.canApproveTripTicket && notif.targetRole === 'TripTicket_Approver') hasAccess = true;
      else if (user.canApproveDeptHead && notif.targetRole === 'DeptHead') hasAccess = true;

      if (hasAccess) {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error fetching bell notifications:', err);
    }
  };

  const handleMarkAsRead = async (id, link) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setIsOpen(false);
      if (link) navigate(link);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button className="bell-trigger" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bell-dropdown">
          <div className="bell-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                <Check size={16} /> Mark all read
              </button>
            )}
          </div>
          
            <div className="bell-list">
              {notifications.length === 0 ? (
                <div className="bell-empty">
                  <Bell size={32} />
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`bell-item ${!notif.isRead ? 'unread' : ''}`}
                  >
                    <div className="bell-item-header" onClick={() => handleMarkAsRead(notif.id, notif.link)} style={{ cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ marginTop: '5px', width: '8px', flexShrink: 0 }}>
                        {!notif.isRead && <div className="unread-dot"></div>}
                      </div>
                      <div className="bell-content" style={{ flex: 1 }}>
                        <p style={{ fontWeight: !notif.isRead ? '700' : '400', marginBottom: '4px' }}>{notif.message}</p>
                        <span className="bell-time">
                          {new Date(notif.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Quick Actions Footer */}
                    {notif.type && notif.type.startsWith('NEW_') && !notif.isRead && (
                      <div className="bell-actions" style={{ display: 'flex', gap: '8px', paddingLeft: '20px', marginTop: '12px' }}>
                        <button 
                          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id, '/pending'); }}
                          onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                          onMouseOut={(e) => e.target.style.background = '#2563eb'}
                        >
                          Review Request
                        </button>
                        <button 
                          style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', borderRadius: '8px', background: 'transparent', color: 'var(--text-dim)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                          onMouseOver={(e) => { e.target.style.background = 'var(--primary-light)'; e.target.style.color = 'var(--text-main)'; }}
                          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-dim)'; }}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
        </div>
      )}
    </div>
  );
}
