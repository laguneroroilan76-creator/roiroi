import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ approved: 0, pending: 0 });
  const [tripData, setTripData] = useState([]);
  const [prfData, setPrfData] = useState([]);
  const [rrfData, setRrfData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDarkMode } = useTheme();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f43f5e', '#14b8a6'];

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ticketsRes, prfsRes, rrfsRes] = await Promise.all([
          api.get('/trip-tickets').catch(e => ({ data: [] })),
          api.get('/prfs').catch(e => ({ data: [] })),
          api.get('/rrfs').catch(e => ({ data: [] }))
        ]);
        
        const tickets = Array.isArray(ticketsRes.data) ? ticketsRes.data.filter(d => d.status !== 'Archived') : [];
        const prfs = Array.isArray(prfsRes.data) ? prfsRes.data.filter(d => d.status !== 'Archived') : [];
        const rrfs = Array.isArray(rrfsRes.data) ? rrfsRes.data.filter(d => d.status !== 'Archived') : [];
        const allDocs = [...tickets, ...prfs, ...rrfs];

        setStats({
            approved: allDocs.filter(d => d.status === 'Approved').length,
            pending: allDocs.filter(d => d.status === 'Pending' || !d.status).length
        });

        setTripData(processChartData(tickets.filter(d => d.status === 'Approved'), 'requestorName'));
        setPrfData(processChartData(prfs.filter(d => d.status === 'Approved'), 'requestor'));
        setRrfData(processChartData(rrfs.filter(d => d.status === 'Approved'), 'requestor'));

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

        <div className="stats-grid">
            <div className="stat-card glass highlight-pending" onClick={() => navigate('/pending')}>
                <div className="stat-icon-box pending">⏳</div>
                <div className="stat-info">
                    <h3>{stats.pending}</h3>
                    <p>Pending Approval</p>
                </div>
                <div className="arrow-hint">›</div>
            </div>

            <div className="stat-card glass highlight-approved" onClick={() => navigate('/approved')}>
                <div className="stat-icon-box approved">✅</div>
                <div className="stat-info">
                    <h3>{stats.approved}</h3>
                    <p>Approved Records</p>
                </div>
                <div className="arrow-hint">›</div>
            </div>
        </div>

        <h2 className="section-title">Form Request Analytics</h2>
        <div className="charts-grid">
            
            {/* Trip Tickets Chart */}
            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`}>
                <div className="section-header">
                    <h3>Trip Tickets</h3>
                </div>
                <div className="chart-container">
                    {tripData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={tripData} cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={100} 
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    {tripData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No Trip Ticket Data</div>
                    )}
                </div>
            </div>

            {/* PRF Chart */}
            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`}>
                <div className="section-header">
                    <h3>Request For Payment (RFP)</h3>
                </div>
                <div className="chart-container">
                    {prfData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={prfData} cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={100} 
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    {prfData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No PRF Data</div>
                    )}
                </div>
            </div>

            {/* RRF Chart */}
            <div className={`section-card ${isDarkMode ? 'dark-box' : 'light-box'}`}>
                <div className="section-header">
                    <h3>Purchase Requisition (PRF)</h3>
                </div>
                <div className="chart-container">
                    {rrfData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={rrfData} cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={100} 
                                    paddingAngle={5} dataKey="value" stroke="none"
                                >
                                    {rrfData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No RRF Data</div>
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
        .stat-icon-box.pending { background: #fffbeb; color: #f59e0b; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15); }
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
