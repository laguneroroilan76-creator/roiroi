import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle, XCircle, Activity, Calendar, Users, Car, FileText, ArrowUpRight, ArrowDownRight, ChevronRight, Zap, Settings, X } from 'lucide-react';

const DynamicKPICard = ({ title, value, icon: Icon, color, onClick, trend, sparklineData, dataKey }) => {
    const isPositive = trend && !trend.startsWith('-');
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="kpi-card-inner">
                <div className="kpi-top">
                    <div className="kpi-icon" data-color={color} style={{ background: `${color}15`, color: color }}>
                        <Icon size={20} strokeWidth={2} />
                    </div>
                    {trend && (
                        <div className={`kpi-trend ${isPositive ? 'positive' : 'negative'}`}>
                            <TrendIcon size={14} strokeWidth={2.5} />
                            {trend}
                        </div>
                    )}
                </div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-label">{title}</div>
                {sparklineData && sparklineData.length > 0 && dataKey && (
                    <div className="kpi-sparkline">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={true} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            {onClick && <ChevronRight size={16} className="kpi-arrow" />}
        </div>
    );
};

import AnalyticsCharts from '../components/shared/AnalyticsCharts';
import ActivityTimeline from '../components/shared/ActivityTimeline';
import { io } from 'socket.io-client';
import { PageSkeleton } from '../components/shared/Skeleton';

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
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [kpiPrefs, setKpiPrefs] = useState(() => {
        const defaultPrefs = {
            pending: true, approved: true, rejected: true, ongoing: true,
            today: true, availableVehicles: true, activeDrivers: true, totalForms: true,
            analytics: true, recentActivity: true
        };
        const saved = localStorage.getItem('kpiPrefs');
        if (saved) {
            return { ...defaultPrefs, ...JSON.parse(saved) };
        }
        return defaultPrefs;
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isDarkMode } = useTheme();

    const isAdmin = user?.role === 'Admin';
    const isGuard = user?.role === 'Guard';
    const isAccounting = user?.role === 'Accounting';
    const hasPendingAccess = !isGuard && (
        isAdmin || 
        user?.canApprove || 
        user?.canApprovePRF || 
        user?.canApproveTripTicket || 
        user?.canApproveRFP || 
        user?.canEndorse || 
        user?.canVerify || 
        user?.canApproveDeptHead || 
        isAccounting
    );

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

        const socket = io('/');
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

                let tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data.filter(d => d.status !== 'Archived') : [];
                let prfs = Array.isArray(prfsRes.data) ? prfsRes.data.filter(d => d.status !== 'Archived') : [];
                let rrfs = Array.isArray(rrfsRes.data) ? rrfsRes.data.filter(d => d.status !== 'Archived') : [];

                if (user?.role !== 'Admin' && !user?.canApprove) {
                    const isMyDoc = (d) => String(d.userId) === String(user?.id) || d.requestorName === user?.name || d.requestor === user?.name;
                    
                    const canSeeAllTT = user?.canApproveTripTicket || user?.canEndorse;
                    const canSeeAllPRF = user?.canApprovePRF || user?.canVerify || user?.role === 'Accounting';
                    const canSeeAllRFP = user?.canApproveRFP || user?.canApproveDeptHead || user?.role === 'Accounting';

                    tickets = tickets.filter(d => canSeeAllTT || isMyDoc(d));
                    prfs = prfs.filter(d => canSeeAllPRF || isMyDoc(d));
                    rrfs = rrfs.filter(d => canSeeAllRFP || isMyDoc(d));
                }

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

                const allParsedDocs = [...parsedTickets, ...parsedPrfs, ...parsedRrfs];

                let pending = 0;
                let rejected = 0;
                let ongoing = 0;
                let today = 0;
                const totalForms = allParsedDocs.length;
                const todayDate = new Date().toDateString();

                if (user?.role !== 'Admin' && !user?.canApprove) {
                    allParsedDocs.forEach(d => {
                        if (d.status && d.status.includes('Pending')) {
                            const isAdminUser = user?.role === 'Admin' || user?.canApprove;
                            let canApproveThis = false;
                            const isMyDocObj = String(d.userId) === String(user?.id) || d.requestorName === user?.name || d.requestor === user?.name;
                            
                            if (d.docType === 'TRIP_TICKET') {
                                const isTTApprover = isAdminUser || user?.canApproveTripTicket;
                                const isTTEndorser = isAdminUser || user?.canEndorse;
                                if (d.status === 'Pending Endorsement') canApproveThis = isTTEndorser || isMyDocObj;
                                else if (d.status === 'Pending Approval') canApproveThis = isTTApprover || isMyDocObj;
                                else canApproveThis = isTTApprover || isMyDocObj;
                            } else if (d.docType === 'PRF') {
                                const isPRFApprover = isAdminUser || user?.canApprovePRF || user?.role === 'Accounting';
                                const isPRFVerifier = isAdminUser || user?.canVerify;
                                if (d.status === 'Pending Verification') canApproveThis = isPRFVerifier || isMyDocObj;
                                else if (d.status === 'Pending Approval') canApproveThis = isPRFApprover || isMyDocObj;
                                else canApproveThis = isPRFApprover || isMyDocObj;
                            } else if (d.docType === 'RFP') {
                                const isRFPApprover = isAdminUser || user?.canApproveRFP || user?.role === 'Accounting';
                                const isRFPDeptHead = isAdminUser || user?.canApproveDeptHead;
                                if (d.status === 'Pending Dept Head Approval') canApproveThis = isRFPDeptHead || isMyDocObj;
                                else if (d.status === 'Pending Final Approval' || d.status === 'Pending Accounting') canApproveThis = isRFPApprover || isMyDocObj;
                                else canApproveThis = isRFPApprover || isMyDocObj;
                            }
                            
                            if (canApproveThis) pending++;
                        }
                        
                        if (d.status === 'Disapproved' || d.status === 'Rejected') rejected++;
                        if (d.status === 'Ongoing' || d.status === 'DEPARTED') ongoing++;
                        
                        const dDate = new Date(d.createdAt).toDateString();
                        if (dDate === todayDate) today++;
                    });
                } else {
                    pending = statsRes.data.pending;
                    rejected = statsRes.data.rejected;
                    ongoing = statsRes.data.ongoing;
                    today = statsRes.data.today;
                }

                setStats({
                    ...statsRes.data,
                    approved: allParsedDocs.filter(d => {
                        if (user?.role === 'Accounting' && d.docType === 'RFP' && d.status === 'Approved' && !d.receivedBy) return false;
                        if (d.docType === 'TRIP_TICKET' && (d.status === 'DEPARTED' || ((d.status === 'Approved' || d.status === 'Completed' || d.status === 'ARRIVED') && !d.guardIn))) return false;
                        return d.status === 'Approved' || d.status === 'Completed' || d.status === 'DEPARTED' || d.status === 'ARRIVED' || d.status === 'Resolved';
                    }).length,
                    pending,
                    rejected,
                    ongoing,
                    today,
                    totalForms: (user?.role === 'Admin' || user?.canApprove) ? statsRes.data.totalForms : totalForms
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

    if (loading) return <PageSkeleton type="dashboard" />;

    return (
        <div className="dashboard-view">
            <div className="dashboard-content">
                <header className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Dashboard</h1>
                        <p className="dashboard-subtitle">Welcome back, <span className="dashboard-user">{user?.name || 'User'}</span></p>
                    </div>
                </header>

                {/* Quick Actions */}
                <div className="quick-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', flex: 1 }}>
                        <button className="quick-action-btn" onClick={() => navigate('/trip-ticket', { state: null })}>
                            <Car size={16} /> New Trip Ticket
                        </button>
                        <button className="quick-action-btn" onClick={() => navigate('/prf', { state: null })}>
                            <FileText size={16} /> New PRF
                        </button>
                        <button className="quick-action-btn" onClick={() => navigate('/rfp', { state: null })}>
                            <FileText size={16} /> New RFP
                        </button>
                        {hasPendingAccess && (
                            <button className="quick-action-btn accent" onClick={() => navigate('/pending')}>
                                <Zap size={16} /> View Pending
                            </button>
                        )}
                    </div>
                    <button className="quick-action-btn" onClick={() => setShowCustomizeModal(true)} style={{ marginLeft: '1rem', flexShrink: 0 }}>
                        <Settings size={16} /> Customize
                    </button>
                </div>

                {/* KPI Grid */}
                <div className="kpi-grid">
                    {kpiPrefs.pending && <DynamicKPICard title="Pending" value={stats.pending} icon={Clock} color="#F59E0B" onClick={() => navigate('/pending')} trend={stats.trends?.pending} sparklineData={stats.sparklines} dataKey="pending" />}
                    {kpiPrefs.approved && <DynamicKPICard title="Completed" value={stats.approved} icon={CheckCircle} color="#22C55E" onClick={() => navigate('/approved')} trend={stats.trends?.approved} sparklineData={stats.sparklines} dataKey="approved" />}
                    {kpiPrefs.rejected && <DynamicKPICard title="Rejected" value={stats.rejected} icon={XCircle} color="#EF4444" onClick={() => navigate('/archived', { state: { statusFilter: 'Rejected' } })} trend={stats.trends?.rejected} sparklineData={stats.sparklines} dataKey="rejected" />}
                    {kpiPrefs.ongoing && <DynamicKPICard title="Ongoing" value={stats.ongoing} icon={Activity} color={isDarkMode ? '#ffffff' : '#000000'} onClick={() => navigate('/ongoing')} trend={stats.trends?.ongoing} sparklineData={stats.sparklines} dataKey="ongoing" />}
                    {kpiPrefs.today && <DynamicKPICard title="Today's Requests" value={stats.today} icon={Calendar} color="#22D3EE" onClick={() => navigate('/today')} />}
                    {kpiPrefs.availableVehicles && <DynamicKPICard title="Available Vehicles" value={stats.availableVehicles} icon={Car} color="#F97316" onClick={() => navigate('/vehicles')} />}
                    {kpiPrefs.activeDrivers && <DynamicKPICard title="Active Drivers" value={stats.activeDrivers} icon={Users} color="#64748B" onClick={() => navigate('/active-drivers')} />}
                    {kpiPrefs.totalForms && <DynamicKPICard title="Total Forms" value={stats.totalForms} icon={FileText} color={isDarkMode ? '#ffffff' : '#000000'} />}
                </div>

                {/* Charts + Activity */}
                {(kpiPrefs.analytics || kpiPrefs.recentActivity) && (
                    <div className="dashboard-grid-2" style={{ gridTemplateColumns: (!kpiPrefs.analytics || !kpiPrefs.recentActivity) ? '1fr' : '2.5fr 1fr' }}>
                        {kpiPrefs.analytics && (
                            <div className="dashboard-charts">
                                <AnalyticsCharts />
                            </div>
                        )}
                        {kpiPrefs.recentActivity && (
                            <div className="dashboard-activity">
                                <h2 className="section-heading">Recent Activity</h2>
                                <div className="activity-card">
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                        <ActivityTimeline />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Customize Modal */}
            {showCustomizeModal && (
                <div className="modal-overlay" onClick={() => setShowCustomizeModal(false)}>
                    <div className="modal-content customize-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Customize Dashboard</h2>
                            <button className="close-btn" onClick={() => setShowCustomizeModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p className="customize-desc">Select which statistics you want to see on your dashboard.</p>
                            <div className="kpi-toggles">
                                {Object.keys(kpiPrefs).map(key => (
                                    <label key={key} className="kpi-toggle-item">
                                        <div className="toggle-info">
                                            <span className="toggle-name">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                        </div>
                                        <div className="toggle-switch">
                                            <input 
                                                type="checkbox" 
                                                checked={kpiPrefs[key]} 
                                                onChange={() => {
                                                    const newPrefs = { ...kpiPrefs, [key]: !kpiPrefs[key] };
                                                    setKpiPrefs(newPrefs);
                                                    localStorage.setItem('kpiPrefs', JSON.stringify(newPrefs));
                                                }}
                                            />
                                            <span className="slider-round"></span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .dashboard-view { 
          padding: 1.5rem; 
          min-height: 100vh; 
          animation: fadeIn 0.5s ease-out; 
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .dashboard-content { max-width: 100%; margin: 0 auto; }
        
        .dashboard-header { margin-bottom: 1.5rem; }
        .dashboard-title { 
          font-size: 1.75rem; font-weight: 700; margin-bottom: 4px; color: var(--text-main); 
          letter-spacing: -0.5px; 
        }
        .dashboard-subtitle { font-size: 0.9rem; color: var(--text-dim); font-weight: 400; }
        .dashboard-user { color: var(--text-main); font-weight: 600; }
        
        .loader-line { height: 3px; width: 100%; background: var(--primary-light); overflow: hidden; border-radius: 10px; margin-top: 1rem; }
        .loader-line::after { content: ''; display: block; height: 100%; width: 40%; background: var(--text-main); animation: slide 1.2s infinite ease-in-out; border-radius: 10px; }
        @keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }

        /* Quick Actions */
        .quick-actions {
          display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .quick-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0.5rem 1rem; border-radius: var(--radius-sm);
          border: 1px solid var(--glass-border); background: var(--card-bg);
          color: var(--text-dim); font-size: 0.8rem; font-weight: 500;
          cursor: pointer; transition: var(--transition-smooth);
          font-family: inherit;
        }
        .quick-action-btn:hover {
          border-color: var(--text-main); color: var(--text-main);
          transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .quick-action-btn.accent {
          background: var(--text-main); color: var(--card-bg); border-color: var(--text-main);
        }
        .quick-action-btn.accent:hover {
          background: var(--text-dim); border-color: var(--text-dim); color: var(--card-bg);
        }

        /* KPI Grid */
        .kpi-grid { 
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; 
        }
        @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .kpi-grid { grid-template-columns: 1fr; } }

        .kpi-card { 
          background: var(--card-bg); 
          padding: 1.25rem; 
          border-radius: var(--radius-lg); 
          border: 1px solid var(--glass-border); 
          display: flex; align-items: center; gap: 0; 
          transition: var(--transition-smooth); 
          cursor: pointer; position: relative; overflow: hidden;
          box-shadow: var(--card-shadow);
        }
        .kpi-card:hover { 
          transform: translateY(-2px); 
          box-shadow: var(--premium-shadow); 
          border-color: var(--text-main); 
        }
        
        .kpi-card-inner { display: flex; flex-direction: column; width: 100%; gap: 0.75rem; }
        .kpi-top { display: flex; justify-content: space-between; align-items: center; }
        
        .kpi-icon { 
          width: 40px; height: 40px; border-radius: var(--radius-md); 
          display: flex; align-items: center; justify-content: center; 
          transition: var(--transition-smooth); 
        }
        .kpi-card:hover .kpi-icon { transform: scale(1.05); }
                /* Turn purple KPI icons black on hover for better contrast */
                .kpi-card:hover .kpi-icon[data-color="#8B5CF6"],
                .kpi-card:hover .kpi-icon[data-color="#6366F1"],
                .kpi-card:hover .kpi-icon[data-color="#6D28D9"],
                .kpi-card:hover .kpi-icon[data-color="#7C3AED"],
                .kpi-card:hover .kpi-icon[data-color="#A78BFA"] {
                    background: #1e293b !important;
                    color: #ffffff !important;
                }
        
        .kpi-trend {
          display: flex; align-items: center; gap: 2px;
          padding: 2px 8px; border-radius: 100px;
          font-size: 0.7rem; font-weight: 600;
        }
        .kpi-trend.positive { background: var(--success-light); color: var(--success); }
        .kpi-trend.negative { background: var(--danger-light); color: var(--danger); }

        .kpi-value { font-size: 1.75rem; font-weight: 700; line-height: 1; color: var(--text-main); }
        .kpi-label { font-size: 0.8rem; font-weight: 500; color: var(--text-dim); }

        .kpi-sparkline { height: 32px; width: 100%; margin-top: 0.25rem; }
        
        .kpi-arrow { 
          position: absolute; right: 1rem; color: var(--text-muted); 
          opacity: 0; transition: var(--transition-smooth); 
        }
        .kpi-card:hover .kpi-arrow { opacity: 1; transform: translateX(2px); color: var(--text-main); }

        /* Dashboard Grid */
        .dashboard-grid-2 { 
          display: grid; grid-template-columns: 2.5fr 1fr; gap: 1.5rem; 
        }
        @media (max-width: 1024px) { .dashboard-grid-2 { grid-template-columns: 1fr; } }

        .section-heading { 
          font-size: 1rem; font-weight: 600; color: var(--text-main); 
          margin-bottom: 0.75rem; 
        }

        .activity-card { 
          background: var(--card-bg); border-radius: var(--radius-lg); 
          border: 1px solid var(--glass-border); padding: 1rem; 
          height: 380px; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--card-shadow);
        }

        .section-title { 
          font-size: 1rem; font-weight: 600; color: var(--text-main); 
          margin-bottom: 1rem; 
        }
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 44px;
            height: 24px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider-round {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: var(--border-color);
            transition: .3s;
            border-radius: 34px;
        }
        .slider-round:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }
        input:checked + .slider-round {
            background-color: #10b981;
        }
        input:checked + .slider-round:before {
            transform: translateX(20px);
        }
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        }
        .modal-content.customize-modal {
            background: var(--card-bg);
            border-radius: 12px;
            width: 90%; max-width: 400px;
            max-height: 85vh;
            display: flex; flex-direction: column;
            padding: 1.5rem;
            box-shadow: var(--card-shadow);
            border: 1px solid var(--glass-border);
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            padding-bottom: 1rem; border-bottom: 1px solid var(--glass-border);
        }
        .modal-body {
            overflow-y: auto;
            padding-right: 0.5rem;
            margin-top: 1rem;
            flex: 1;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; color: var(--text-main); }
        .close-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 4px; }
        .close-btn:hover { color: var(--text-main); background: rgba(0,0,0,0.05); }
        .customize-desc { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 1.2rem; }
        .kpi-toggles { display: flex; flex-direction: column; gap: 0.6rem; }
        .kpi-toggle-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.6rem 0.8rem; background: var(--bg-main);
            border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer;
            transition: var(--transition-smooth);
        }
        .kpi-toggle-item:hover { border-color: var(--text-dim); }
        .toggle-name { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
      `}</style>
        </div>
    );
}
