import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, CheckCircle, Bell, ChevronRight, XCircle, Activity, Calendar, Users, Car, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const DynamicKPICard = ({ title, value, icon: Icon, color, bg, onClick, trend, sparklineData, dataKey }) => {
    const isPositive = trend && !trend.startsWith('-');
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
        <div className="stat-card glass" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-icon-box" style={{ background: bg, color: color }}>
                        <Icon size={24} strokeWidth={2.5} />
                    </div>
                    {trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isPositive ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                            <TrendIcon size={14} strokeWidth={3} />
                            {trend}
                        </div>
                    )}
                </div>
                
                <div className="stat-info" style={{ marginTop: '0.5rem' }}>
                    <h3>{value}</h3>
                    <p>{title}</p>
                </div>

                {sparklineData && sparklineData.length > 0 && dataKey && (
                    <div style={{ height: '40px', width: '100%', marginTop: 'auto', marginLeft: '-10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} isAnimationActive={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            {onClick && <div className="arrow-hint"><ChevronRight /></div>}
        </div>
    );
};
import { io } from 'socket.io-client';

export default function Dashboard() {
    const [stats, setStats] = useState({ 
        approved: 0, pending: 0, rejected: 0, ongoing: 0, 
        today: 0, totalForms: 0, activeUsers: 0, availableVehicles: 0, activeDrivers: 0 
    });
    const [tripData, setTripData] = useState([]);
    const [prfData, setPrfData] = useState([]);
    const [rrfData, setRrfData] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isDarkMode } = useTheme();

    const COLORS = ['#1e293b', '#10b981', '#334155', '#0f172a', '#ef4444', '#06b6d4', '#f43f5e', '#14b8a6'];

    const processChartData = (dataArray, requestorKey) => {
        const counts = {};
        dataArray.forEach(item => {
            const name = item[requestorKey] || 'Unknown';
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.keys(counts).map(name => ({
            name,
            value: counts[name]
        })).sort((a, b) => b.value - a.value);
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const notifsRes = await api.get('/notifications');
                setNotifications(notifsRes.data);
            } catch (err) {
                console.error('Failed to load notifications', err);
            }
        };
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
                showToast(notif.message, 'info');
            }
        });

        const fetchData = async () => {
            setLoading(true);
            try {
                const [ticketsRes, prfsRes, rrfsRes, statsRes] = await Promise.all([
                    api.get('/trip-tickets'),
                    api.get('/prfs'),
                    api.get('/rfps'),
                    api.get('/stats')
                ]);


                const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data.filter(d => d.status !== 'Archived') : [];
                const prfs = Array.isArray(prfsRes.data) ? prfsRes.data.filter(d => d.status !== 'Archived') : [];
                const rrfs = Array.isArray(rrfsRes.data) ? rrfsRes.data.filter(d => d.status !== 'Archived') : [];
                const allDocs = [...tickets, ...prfs, ...rrfs];

                const parseRecord = (record) => {
                    if (!record.layout) return record;
                    try {
                        const parsed = JSON.parse(record.layout);
                        return {
                            ...parsed, ...record,
                            status: record.status || parsed.status || 'Pending'
                        };
                    } catch (e) { return record; }
                };

                const parsedTickets = tickets.map(t => ({ ...parseRecord(t), docType: 'TRIP_TICKET' }));
                const parsedPrfs = prfs.map(p => ({ ...parseRecord(p), docType: 'PRF' }));
                const parsedRrfs = rrfs.map(r => ({ ...parseRecord(r), docType: 'RFP' }));

                const allPending = [
                    ...parsedTickets.filter(t => t.status === 'Pending' || t.status === 'Pending Endorsement' || t.status === 'Pending Approval' || !t.status),
                    ...parsedPrfs.filter(p => p.status === 'Pending' || p.status === 'Pending Verification' || p.status === 'Pending Approval' || !p.status),
                    ...parsedRrfs.filter(r => r.status === 'Pending' || r.status === 'Pending Dept Head Approval' || r.status === 'Pending Final Approval' || (r.status === 'Approved' && !r.receivedBy) || !r.status)
                ];

                const allParsedDocs = [...parsedTickets, ...parsedPrfs, ...parsedRrfs];

                const isAdmin = user?.role === 'Admin' || user?.canApprove;
                const actualPending = allPending.filter(record => {
                    if (record.docType === 'TRIP_TICKET') {
                        const isTTApprover = isAdmin || user?.canApproveTripTicket;
                        const isTTEndorser = isAdmin || user?.canEndorse;
                        if (record.status === 'Pending Endorsement') return isTTEndorser || isTTApprover || record.authorId === user.id;
                        return isTTApprover || record.authorId === user.id;
                    }
                    if (record.docType === 'PRF') {
                        const isPRFApprover = isAdmin || user?.canApprovePRF || user?.role === 'Accounting';
                        const isPRFVerifier = isAdmin || user?.canVerify;
                        if (record.status === 'Pending Verification') return isPRFVerifier || isPRFApprover || record.authorId === user.id;
                        return isPRFApprover || record.authorId === user.id;
                    }
                    if (record.docType === 'RFP') {
                        const isRFPApprover = isAdmin || user?.canApproveRFP || user?.role === 'Accounting';
                        const isRFPDeptHead = isAdmin || user?.canApproveDeptHead;
                        if (record.status === 'Pending Dept Head Approval') return isRFPDeptHead || isRFPApprover || record.authorId === user.id;
                        return isRFPApprover || record.authorId === user.id;
                    }
                    return record.authorId === user.id || isAdmin;
                });

                setStats({
                    ...statsRes.data,
                    approved: allParsedDocs.filter(d => {
                        if (user?.role === 'Accounting' && d.docType === 'RFP' && d.status === 'Approved' && !d.receivedBy) return false;
                        return d.status === 'Approved' || d.status === 'Completed' || d.status === 'DEPARTED' || d.status === 'ARRIVED';
                    }).length,
                    pending: statsRes.data.pending
                });

                setTripData(processChartData(tickets.filter(d => d.status === 'Approved' || d.status === 'Completed' || d.status === 'DEPARTED' || d.status === 'ARRIVED'), 'requestorName'));
                setPrfData(processChartData(prfs.filter(d => d.status === 'Approved' || d.status === 'Completed'), 'requestor'));
                setRrfData(processChartData(rrfs.filter(d => d.status === 'Approved' || d.status === 'Completed'), 'requestor'));

            } catch (err) {
                console.error('Dashboard Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip glass">
                    <p className="label" style={{ fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{`${payload[0].name}`}</p>
                    <p className="intro" style={{ margin: 0, color: 'var(--text-dim)' }}>{`Requested: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`dashboard-view ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="dashboard-content-wrapper">
                <header className="dashboard-header">
                    <div className="header-text">
                        <h1>Dashboard Overview</h1>
                        <p>Welcome back, <span>{user?.name || 'User'}</span></p>
                    </div>
                    {loading && <div className="loader-line" />}
                </header>

                <div className="stats-grid expanded">
                    <DynamicKPICard title="Pending" value={stats.pending} icon={Clock} color="#f59e0b" bg="#fffbeb" onClick={() => navigate('/pending')} trend={stats.trends?.pending} sparklineData={stats.sparklines} dataKey="pending" />
                    <DynamicKPICard title="Completed" value={stats.approved} icon={CheckCircle} color="#10b981" bg="#ecfdf5" onClick={() => navigate('/approved')} trend={stats.trends?.approved} sparklineData={stats.sparklines} dataKey="approved" />
                    <DynamicKPICard title="Rejected" value={stats.rejected} icon={XCircle} color="#ef4444" bg="#fef2f2" onClick={() => navigate('/archived')} trend={stats.trends?.rejected} sparklineData={stats.sparklines} dataKey="rejected" />
                    <DynamicKPICard title="Ongoing" value={stats.ongoing} icon={Activity} color="#3b82f6" bg="#eff6ff" onClick={() => navigate('/history')} trend={stats.trends?.ongoing} sparklineData={stats.sparklines} dataKey="ongoing" />
                    <DynamicKPICard title="Today's Requests" value={stats.today} icon={Calendar} color="#d946ef" bg="#fdf4ff" onClick={() => navigate('/history')} />
                    <DynamicKPICard title="Available Vehicles" value={stats.availableVehicles} icon={Car} color="#f97316" bg="#fff7ed" onClick={() => navigate('/vehicles')} />
                    <DynamicKPICard title="Active Drivers" value={stats.activeDrivers} icon={Users} color="#64748b" bg="#f8fafc" onClick={() => navigate('/active-drivers')} />
                    <DynamicKPICard title="Total Forms" value={stats.totalForms} icon={FileText} color="#22c55e" bg="#f0fdf4" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                    <div className="charts-section">
                        <h2 className="section-title">Form Request Analytics</h2>
                        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>

                            {/* Trip Tickets Chart */}
                            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`} style={{ padding: '1rem' }}>
                                <div className="section-header">
                                    <h3 style={{ fontSize: '1rem' }}>Trip Tickets</h3>
                                </div>
                                <div className="chart-container" style={{ height: '200px' }}>
                                    {tripData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={tripData} cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={80}
                                                    paddingAngle={5} dataKey="value" stroke="none"
                                                >
                                                    {tripData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="empty-chart">No Trip Ticket Data</div>
                                    )}
                                </div>
                            </div>

                            {/* PRF Chart */}
                            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`} style={{ padding: '1rem' }}>
                                <div className="section-header">
                                    <h3 style={{ fontSize: '1rem' }}>Purchase Requisition</h3>
                                </div>
                                <div className="chart-container" style={{ height: '200px' }}>
                                    {prfData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={prfData} cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={80}
                                                    paddingAngle={5} dataKey="value" stroke="none"
                                                >
                                                    {prfData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="empty-chart">No PRF Data</div>
                                    )}
                                </div>
                            </div>

                            {/* RRF Chart */}
                            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`} style={{ gridColumn: '1 / -1', padding: '1rem' }}>
                                <div className="section-header">
                                    <h3 style={{ fontSize: '1rem' }}>Request For Payment</h3>
                                </div>
                                <div className="chart-container" style={{ height: '200px' }}>
                                    {rrfData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={rrfData} cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={80}
                                                    paddingAngle={5} dataKey="value" stroke="none"
                                                >
                                                    {rrfData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="empty-chart">No RRF Data</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="notifications-section">
                        <h2 className="section-title">Live Notifications</h2>
                        <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`} style={{ padding: '1rem', height: '100%', maxHeight: '550px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>No recent notifications.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {notifications.map(notif => (
                                        <div key={notif.id} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', padding: '0.75rem', background: notif.isRead ? 'transparent' : 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', border: `1px solid ${notif.isRead ? 'var(--glass-border)' : 'rgba(16, 185, 129, 0.2)'}`, cursor: 'pointer', transition: '0.2s' }} onClick={async () => {
                                            if (!notif.isRead) {
                                                try {
                                                    await api.put(`/notifications/${notif.id}/read`);
                                                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                                } catch (e) { console.error(e); }
                                            }
                                            if (notif.link) navigate(notif.link);
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                                    <Bell size={16} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px', fontSize: '0.85rem' }}>{notif.message}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{new Date(notif.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .dashboard-view { padding: 3rem; min-height: 100vh; animation: fadeIn 0.8s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .dashboard-content-wrapper { max-width: 1400px; margin: 0 auto; }
        
        .dashboard-header { margin-bottom: 3rem; }
        .header-text h1 { font-size: 2.8rem; font-weight: 800; margin-bottom: 4px; color: var(--text-main); letter-spacing: -1.5px; }
        .header-text p { font-size: 1.1rem; color: var(--text-dim); font-weight: 500; }
        .header-text p span { color: var(--primary); font-weight: 800; position: relative; }
        .header-text p span::after { content: ''; position: absolute; bottom: 2px; left: 0; width: 100%; height: 6px; background: var(--primary-light); z-index: -1; border-radius: 4px; }
        
        .loader-line { height: 4px; width: 100%; background: var(--primary-light); overflow: hidden; border-radius: 10px; margin-top: 1.5rem; }
        .loader-line::after { content: ''; display: block; height: 100%; width: 40%; background: var(--primary); animation: slide 1.2s infinite ease-in-out; }
        @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }

        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 3rem; }
        .stats-grid.expanded { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        @media (max-width: 1024px) {
            .stats-grid.expanded { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            .stats-grid.expanded { grid-template-columns: 1fr; }
        }

        .stat-card { 
            background: var(--card-bg); padding: 2rem; border-radius: 30px; border: 1px solid var(--glass-border); 
            display: flex; align-items: center; gap: 2rem; transition: var(--transition-smooth); 
            cursor: pointer; position: relative; overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,0,0,0.03);
        }
        .stat-card:hover { transform: translateY(-10px); box-shadow: 0 25px 50px rgba(0,0,0,0.08); border-color: var(--primary); }
        .stat-card::after { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: var(--primary-light); filter: blur(40px); border-radius: 50%; opacity: 0; transition: 0.5s; }
        .stat-card:hover::after { opacity: 1; }
        
        .stat-icon-box { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; transition: 0.3s; }
        .stat-card:hover .stat-icon-box { transform: scale(1.1) rotate(5deg); }
        .stat-icon-box.pending { background: #fffbeb; color: #334155; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15); }
        .stat-icon-box.approved { background: #ecfdf5; color: #10b981; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.15); }
        
        .stat-info h3 { font-size: 2.5rem; font-weight: 800; line-height: 1; color: var(--text-main); }
        .stat-info p { font-size: 0.85rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
        
        .arrow-hint { position: absolute; right: 2rem; font-size: 1.8rem; color: var(--text-dim); opacity: 0.2; transition: all 0.4s; }
        .stat-card:hover .arrow-hint { opacity: 1; transform: translateX(8px); color: var(--primary); }

        .section-title { font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 1.5rem; letter-spacing: -0.5px; }
        
        .charts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
        
        .section-card { border-radius: 32px; padding: 2rem; background: var(--card-bg); border: 1px solid var(--glass-border); box-shadow: 0 20px 40px rgba(0,0,0,0.02); position: relative; }
        
        .section-header { display: flex; justify-content: center; align-items: center; margin-bottom: 1rem; }
        .section-header h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-main); letter-spacing: 0.5px; text-transform: uppercase; opacity: 0.8;}

        .chart-container { height: 320px; width: 100%; display: flex; align-items: center; justify-content: center; }
        .empty-chart { color: var(--text-dim); font-weight: 600; text-align: center; font-size: 0.9rem; }
        
        .custom-tooltip { padding: 12px 16px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }

        /* DARK MODE SPECIFICS */
        .dark-mode .stat-card { background: var(--card-bg); color: white; }
        .dark-mode .stat-info h3 { color: white; }
        .dark-mode .section-card { background: var(--card-bg); color: white; }
        .dark-mode .header-text h1 { color: white; }
        .dark-mode .section-title { color: white; }
      `}</style>
        </div>
    );
}
