import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { X, Send, Minus } from 'lucide-react';

export default function FloatingChat({ ticket, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    socketRef.current = io(BASE_URL);

    socketRef.current.on('new_message', (msg) => {
      if (ticket && msg.ticketId === ticket.id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (!isMinimized) scrollToBottom();
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [ticket, isMinimized]);

  useEffect(() => {
    if (ticket) {
      fetchMessages();
      setIsMinimized(false);
    }
  }, [ticket]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/support/${ticket.id}/messages`);
      setMessages(res.data);
      scrollToBottom();
    } catch (err) {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket || ticket.status === 'Resolved') return;
    
    try {
      const res = await api.post(`/support/${ticket.id}/messages`, { message: newMessage });
      setMessages((prev) => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      showToast('Failed to send message', 'error');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!ticket) return null;

  return (
    <div 
      className={`floating-chat ${isDarkMode ? 'dark-mode' : ''}`} 
      style={{
        position: 'fixed',
        bottom: isMinimized ? '20px' : '20px',
        right: '20px',
        width: '350px',
        height: isMinimized ? '60px' : '450px',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        transition: 'height 0.3s ease, bottom 0.3s ease',
        border: `1px solid ${isDarkMode ? '#334155' : 'rgba(0,0,0,0.1)'}`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        style={{
          padding: '12px 16px',
          background: 'var(--primary)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
            #{ticket.subject}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            {ticket.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <Minus size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: isDarkMode ? '#0f172a' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Loading...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                No messages yet. Send a message to start!
              </div>
            ) : (
              messages.map(msg => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '4px', padding: '0 4px' }}>
                      {msg.sender?.name} • {formatTime(msg.createdAt)}
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '16px',
                      background: isOwn ? 'var(--primary)' : (isDarkMode ? '#334155' : '#ffffff'),
                      color: isOwn ? '#ffffff' : 'var(--text-main)',
                      border: isOwn ? 'none' : '1px solid rgba(0,0,0,0.1)',
                      maxWidth: '85%',
                      borderBottomRightRadius: isOwn ? '4px' : '16px',
                      borderBottomLeftRadius: isOwn ? '16px' : '4px',
                      fontSize: '0.9rem',
                      wordBreak: 'break-word'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {ticket.status !== 'Resolved' && (
            <div style={{ padding: '12px', borderTop: `1px solid ${isDarkMode ? '#334155' : 'rgba(0,0,0,0.1)'}`, background: isDarkMode ? '#1e293b' : '#ffffff' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${isDarkMode ? '#475569' : 'rgba(0,0,0,0.1)'}`,
                    background: isDarkMode ? '#0f172a' : '#f1f5f9',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{
                    background: newMessage.trim() ? 'var(--primary)' : (isDarkMode ? '#475569' : '#cbd5e1'),
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: newMessage.trim() ? 'pointer' : 'default',
                    transition: 'background 0.2s'
                  }}
                >
                  <Send size={16} style={{ marginLeft: '2px' }} />
                </button>
              </form>
            </div>
          )}
          
          {ticket.status === 'Resolved' && (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: `1px solid ${isDarkMode ? '#334155' : 'rgba(0,0,0,0.1)'}` }}>
              This ticket is resolved. Chat is closed.
            </div>
          )}
        </>
      )}
    </div>
  );
}
