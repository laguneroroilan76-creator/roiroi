import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import {
  PlusCircle, Search, Trash2, Edit3, CheckCircle2,
  Clock, CheckSquare, LifeBuoy, Filter, AlertCircle,
  MoreVertical, ChevronRight, User, Hash, Tag,
  Eye, Settings2
} from 'lucide-react';

export default function SupportLog() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'Medium', category: 'Others' });

  const { showToast } = useToast();
  const { isDarkMode } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isIT = user.role === 'IT' || user.role === 'Admin';

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support');
      setTickets(res.data);
    } catch (err) {
      showToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ticket = null) => {
    if (ticket) {
      setEditingTicket(ticket);
      setFormData({
        subject: ticket.subject,
        description: ticket.description || '',
        priority: ticket.priority,
        category: ticket.category,
        status: ticket.status
      });
    } else {
      setEditingTicket(null);
      setFormData({ subject: '', description: '', priority: 'Medium', category: 'Others' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTicket) {
        await api.put(`/support/${editingTicket.id}`, formData);
        showToast('Ticket updated successfully', 'success');
      } else {
        await api.post('/support', formData);
        showToast('Ticket submitted successfully', 'success');
      }
      setIsModalOpen(false);
      fetchTickets();
    } catch (err) {
      showToast(err.response?.data?.error || 'Error saving ticket', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.delete(`/support/${id}`);
      showToast('Ticket deleted successfully', 'success');
      fetchTickets();
    } catch (err) {
      showToast('Error deleting ticket', 'error');
    }
  };

  const handleResolve = async (ticket) => {
    if (!window.confirm('Mark this ticket as resolved?')) return;
    try {
      await api.put(`/support/${ticket.id}`, { status: 'Resolved' });
      showToast('Ticket marked as resolved', 'success');
      fetchTickets();
    } catch (err) {
      showToast('Error resolving ticket', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#10b981';
      case 'In Progress': return '#3b82f6';
      default: return '#f59e0b';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isIT && ticket.author?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className={`support-log-page ${isDarkMode ? 'dark-mode' : ''}`} style={{ padding: '2rem 3rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="header-left">
          <div className="title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div className="icon-box" style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
              <LifeBuoy size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Support Log</h1>
              <p className="subtitle" style={{ color: 'var(--text-dim)', margin: 0, fontWeight: 500 }}>{isIT ? 'Manage system-wide help requests' : 'Track your help requests to IT'}</p>
            </div>
          </div>
        </div>
        <button className="action-btn-premium primary" onClick={() => handleOpenModal()} style={{ borderRadius: '16px', padding: '12px 24px' }}>
          <PlusCircle size={20} />
          <span>Submit New Request</span>
        </button>
      </header>

      <div className="toolbar-glass">
        <div className="search-box-premium">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search by subject or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group-premium">
          <div className="filter-item-premium">
            <Filter size={16} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="filter-item-premium">
            <AlertCircle size={16} />
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem', gap: '1.5rem' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontWeight: 600, color: 'var(--text-dim)' }}>Loading tickets...</p>
        </div>
      ) : (
        <div className="table-container-glass">
          <table className="corporate-table">
            <thead>
              <tr>
                <th><Hash size={14} style={{ marginRight: 8 }} />Subject</th>
                <th><Tag size={14} style={{ marginRight: 8 }} />Category</th>
                <th>Priority</th>
                <th>Status</th>
                {isIT && <th><User size={14} style={{ marginRight: 8 }} />Requested By</th>}
                <th><Clock size={14} style={{ marginRight: 8 }} />Time Issued</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                <tr key={ticket.id} style={{ opacity: ticket.status === 'Resolved' ? 0.7 : 1 }}>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '4px' }}>{ticket.subject}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ticket.description}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.7rem', fontStyle: 'normal', fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary)', padding: '5px 12px', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                      {ticket.category}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill-premium" style={{ 
                      background: ticket.priority === 'Urgent' ? '#fef2f2' : (ticket.priority === 'High' ? '#fff7ed' : (ticket.priority === 'Medium' ? '#fffbeb' : '#f0fdf4')),
                      color: ticket.priority === 'Urgent' ? '#ef4444' : (ticket.priority === 'High' ? '#f97316' : (ticket.priority === 'Medium' ? '#f59e0b' : '#10b981')),
                      border: '1px solid currentColor'
                    }}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td>
                    <div className="status-pill-premium" style={{ background: `${getStatusColor(ticket.status)}15`, color: getStatusColor(ticket.status) }}>
                      <span className="status-dot-premium" style={{ background: getStatusColor(ticket.status) }}></span>
                      {ticket.status}
                    </div>
                  </td>
                  {isIT && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.95rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{ticket.author?.name?.charAt(0)}</div>
                        <span>{ticket.author?.name}</span>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '2px' }}>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>{formatTime(ticket.createdAt)}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                      {isIT && ticket.status !== 'Resolved' && (
                        <button className="action-btn-premium" onClick={() => handleResolve(ticket)} style={{ background: '#10b981', color: 'white', border: 'none' }}>
                          <CheckCircle2 size={16} />
                          <span>Resolve</span>
                        </button>
                      )}
                      <button className="action-btn-premium" onClick={() => handleOpenModal(ticket)}>
                        {ticket.status === 'Resolved' ? <Eye size={16} /> : <Edit3 size={16} />}
                        <span>{ticket.status === 'Resolved' ? 'View' : 'Manage'}</span>
                      </button>
                      {(isIT || ticket.status === 'Pending') && (
                        <button className="action-btn-premium" onClick={() => handleDelete(ticket.id)} style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isIT ? 7 : 6}>
                    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                      <div style={{ margin: '0 auto 1.5rem', width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                        <LifeBuoy size={64} strokeWidth={1} />
                      </div>
                      <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No support requests found</h3>
                      <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.5 }}>Try adjusting your search or filters, or create a new request if you're experiencing issues.</p>
                      <button className="action-btn-premium" onClick={() => { setSearchTerm(''); setFilterStatus('All'); setFilterPriority('All'); }} style={{ margin: '0 auto' }}>
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}


      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass premium">
            <div className="modal-header">
              <div className="modal-title">
                {editingTicket ? (editingTicket.status === 'Resolved' ? <Eye size={24} /> : <Settings2 size={24} />) : <PlusCircle size={24} />}
                <h2>{editingTicket ? (editingTicket.status === 'Resolved' ? 'View Request' : 'Update Request') : 'New Support Request'}</h2>
              </div>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="support-form">
              <div className="form-body">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Briefly describe the issue"
                    required
                    disabled={editingTicket && (editingTicket.status === 'Resolved' || (!isIT && editingTicket.status !== 'Pending'))}
                  />
                </div>
                <div className="grid-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={editingTicket && (editingTicket.status === 'Resolved' || (!isIT && editingTicket.status !== 'Pending'))}
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Access/Permissions">Access/Permissions</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      disabled={editingTicket && (editingTicket.status === 'Resolved' || (!isIT && editingTicket.status !== 'Pending'))}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your request in detail..."
                    rows="5"
                    disabled={editingTicket && (editingTicket.status === 'Resolved' || (!isIT && editingTicket.status !== 'Pending'))}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                {(!editingTicket || (editingTicket.status !== 'Resolved' && (isIT || editingTicket.status === 'Pending'))) && (
                  <button type="submit" className="btn-submit">
                    {editingTicket ? 'Update Ticket' : 'Submit Request'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}

