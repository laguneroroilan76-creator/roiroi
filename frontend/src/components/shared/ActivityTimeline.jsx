import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api, { BASE_URL } from '../../services/api';
import { Clock, CheckCircle, XCircle, FileText, User, Car, Activity, Zap } from 'lucide-react';

export default function ActivityTimeline({ isDashboard = false, limit = 10 }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchActivities = async (currentPage) => {
        setLoading(true);
        try {
            const res = await api.get(`/activity/logs?page=${currentPage}&limit=${limit}`);
            if (res.data.logs) {
                setActivities(res.data.logs);
                setTotalPages(res.data.totalPages);
            } else {
                setActivities(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(page);
    }, [page]);

    useEffect(() => {
        const socket = io(BASE_URL);
        
        socket.on('new_activity', (activity) => {
            setActivities(prev => {
                // Only prepend if we are on page 1
                if (page === 1) {
                    return [activity, ...prev].slice(0, limit);
                }
                return prev;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [page]);

    const getIconInfo = (action, resource) => {
        if (action === 'APPROVE') return { icon: CheckCircle, color: '#22C55E', bg: 'var(--success-light)' };
        if (action === 'ARCHIVE' || action === 'DELETE' || action === 'REJECT') return { icon: XCircle, color: '#EF4444', bg: 'var(--danger-light)' };
        if (action === 'CREATE') {
            if (resource === 'VEHICLE') return { icon: Car, color: '#6366F1', bg: 'var(--accent-indigo-light)' };
            if (resource === 'DRIVER') return { icon: User, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
            return { icon: FileText, color: '#F59E0B', bg: 'var(--warning-light)' };
        }
        if (action === 'UPDATE') return { icon: Activity, color: '#22D3EE', bg: 'var(--accent-cyan-light)' };
        return { icon: Zap, color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' };
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.round((now - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return <div className="loader-line" style={{ marginTop: '2rem' }}></div>;
    }

    return (
        <div style={{ padding: '0.25rem 0' }}>
            {activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity found.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                    {/* Timeline line */}
                    <div style={{ position: 'absolute', left: '15px', top: '16px', bottom: '16px', width: '1px', background: 'var(--glass-border)', zIndex: 0 }}></div>
                    
                    {activities.filter(a => user?.role === 'Admin' ? true : (a.userId === user.id || a.user?.id === user.id || a.user?.name === user.name)).map((activity) => {
                        const { icon: Icon, color, bg } = getIconInfo(activity.action, activity.resource);
                        return (
                            <div key={activity.id} style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
                                <div style={{ 
                                    width: '30px', height: '30px', borderRadius: '50%', background: bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    color: color, flexShrink: 0, border: '2px solid var(--card-bg)',
                                    overflow: 'hidden', position: 'relative'
                                }}>
                                    {activity.user?.avatarUrl ? (
                                        <img 
                                            src={activity.user.avatarUrl.startsWith('http') ? activity.user.avatarUrl : `${BASE_URL}${activity.user.avatarUrl}`}
                                            alt={activity.user?.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <Icon size={13} />
                                    )}
                                </div>
                                <div style={{ flex: 1, paddingTop: '2px' }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500, lineHeight: 1.4 }}>
                                        {activity.details || `${activity.user?.name || 'User'} performed ${activity.action} on ${activity.resource}`}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {activity.user?.name || 'System'}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={10} /> {formatTimeAgo(activity.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Pagination Controls */}
                    {!isDashboard && totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ 
                                    padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    border: '1px solid var(--glass-border)', background: 'var(--card-bg)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-main)',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ 
                                    padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                    border: '1px solid var(--glass-border)', background: 'var(--card-bg)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
