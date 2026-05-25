import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
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

    const socket = io('http://localhost:5000');
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
        <Bell size={24} />
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
                  onClick={() => handleMarkAsRead(notif.id, notif.link)}
                >
                  {!notif.isRead && <div className="unread-dot"></div>}
                  <div className="bell-content">
                    <p>{notif.message}</p>
                    <span className="bell-time">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
