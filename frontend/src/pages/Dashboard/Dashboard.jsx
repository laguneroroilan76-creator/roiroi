import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import api, { BASE_URL } from '../../services/api';
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

import AnalyticsCharts from '../../components/shared/AnalyticsCharts';
import ActivityTimeline from '../../components/shared/ActivityTimeline';
import { io } from 'socket.io-client';
import { PageSkeleton } from '../../components/shared/Skeleton';
import './Dashboard.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        approved: 0, pending: 0, rejected: 0, ongoing: 0,
        today: 0, totalForms: 0, activeUsers: 0, availableVehicles: 0, activeDrivers: 0
    });
    const [tripData, setTripData] = useState([]);
    const [prfData, setPrfData] = useState([]);
    const [rfpData, setRfpData] = useState([]);
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
                showToast(notif.message, 'info');
            }
        });

        const fetchData = async () => {
            setLoading(true);
            try {
                const [ticketsRes, prfsRes, rfpsRes, statsRes] = await Promise.all([
                    api.get('/trip-tickets').catch(e => ({ data: { error: e.message } })),
                    api.get('/prfs').catch(e => ({ data: { error: e.message } })),
                    api.get('/rfps').catch(e => ({ data: { error: e.message } })),
                    api.get('/stats').catch(e => ({ data: { error: e.message, status: e.response?.status } }))
                ]);

                if (statsRes.data && statsRes.data.error) {
                    showToast(`API Error: ${statsRes.data.error} (Status: ${statsRes.data.status})`, 'error');
                }

                let tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data.filter(d => d.status !== 'Archived') : [];
                let prfs = Array.isArray(prfsRes.data) ? prfsRes.data.filter(d => d.status !== 'Archived') : [];
                let rfps = Array.isArray(rfpsRes.data) ? rfpsRes.data.filter(d => d.status !== 'Archived') : [];

                if (user?.role !== 'Admin' && !user?.canApprove) {
                    const isMyDoc = (d) => String(d.authorId) === String(user?.id) || String(d.userId) === String(user?.id) || d.requestorName === user?.name || d.requestor === user?.name;
                    
                    const canSeeAllTT = user?.canApproveTripTicket || user?.canEndorse;
                    const canSeeAllPRF = user?.canApprovePRF || user?.canVerify;
                    const canSeeAllRFP = user?.canApproveRFP || user?.canApproveDeptHead || user?.role === 'Accounting';

                    tickets = tickets.filter(d => canSeeAllTT || isMyDoc(d));
                    prfs = prfs.filter(d => canSeeAllPRF || isMyDoc(d));
                    rfps = rfps.filter(d => canSeeAllRFP || isMyDoc(d));
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
                const parsedRfps = rfps.map(r => ({ ...parseRecord(r), docType: 'RFP' }));

                const allParsedDocs = [...parsedTickets, ...parsedPrfs, ...parsedRfps];

                let pending = 0;
                let rejected = 0;
                let ongoing = 0;
                let today = 0;
                const totalForms = allParsedDocs.length;
                const todayDate = new Date().toDateString();

                if (user?.role !== 'Admin' && !user?.canApprove) {
                    allParsedDocs.forEach(d => {
                        const isAccountingPendingRFP = user?.role === 'Accounting' && d.docType === 'RFP' && d.status === 'Approved' && !d.receivedBy;
                        if ((d.status && d.status.includes('Pending')) || isAccountingPendingRFP) {
                            const isAdminUser = user?.role === 'Admin' || user?.canApprove;
                            let canApproveThis = false;
                            const isMyDocObj = String(d.authorId) === String(user?.id) || String(d.userId) === String(user?.id) || d.requestorName === user?.name || d.requestor === user?.name;
                            
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
                                
                                if (isAccountingPendingRFP) canApproveThis = true;
                            }
                            
                            if (canApproveThis) pending++;
                        }
                        
                        if (['Disapproved', 'Closed', 'Cancelled', 'CANCELLED'].includes(d.status)) rejected++;
                        
                        if (['In Progress', 'Ongoing', 'DEPARTED'].includes(d.status)) ongoing++;
                        else if (d.docType === 'TRIP_TICKET' && ['Approved', 'Resolved'].includes(d.status) && !d.guardInId) ongoing++;
                        
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
                        if (d.docType === 'TRIP_TICKET') {
                            return d.status === 'Completed' || d.status === 'ARRIVED';
                        }
                        if (d.docType === 'PRF') {
                            return d.status === 'Approved' || d.status === 'Completed';
                        }
                        if (d.docType === 'RFP') {
                            return d.status === 'Completed' || d.status === 'Received' || d.status === 'Approved';
                        }
                        return false;
                    }).length,
                    pending,
                    rejected,
                    ongoing,
                    today,
                    totalForms: (user?.role === 'Admin' || user?.canApprove) ? statsRes.data.totalForms : totalForms
                });

                setTripData(processChartData(tickets.filter(d => d.status === 'Approved' || d.status === 'Completed' || d.status === 'DEPARTED' || d.status === 'ARRIVED'), 'requestorName'));
                setPrfData(processChartData(prfs.filter(d => d.status === 'Approved' || d.status === 'Completed'), 'requestor'));
                setRfpData(processChartData(rfps.filter(d => d.status === 'Approved' || d.status === 'Completed' || d.status === 'Received'), 'requestor'));

            } catch (err) {
                console.error('Dashboard Fetch Error:', err);
                // @ts-ignore
                showToast(`Fetch Error: ${err.message || 'Unknown error'}`, 'error');
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
                <div className="quick-actions">
                    <div className="quick-actions-left">
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
                    <button className="quick-action-btn customize-btn" onClick={() => setShowCustomizeModal(true)}>
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
                    <div className={`dashboard-grid-2 ${(!kpiPrefs.analytics || !kpiPrefs.recentActivity) ? 'single-col' : ''}`}>
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
                                        <ActivityTimeline isDashboard={true} limit={50} />
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

            
        </div>
    );
}
