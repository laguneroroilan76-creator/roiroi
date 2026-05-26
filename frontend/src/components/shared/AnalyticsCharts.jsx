import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const CHART_COLORS = ['#6366F1', '#22D3EE', '#8B5CF6', '#F59E0B', '#22C55E', '#EF4444', '#EC4899', '#14B8A6'];

export default function AnalyticsCharts() {
    const { isDarkMode } = useTheme();
    const [period, setPeriod] = useState('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const gridColor = isDarkMode ? '#334155' : '#E2E8F0';
    const axisColor = isDarkMode ? '#64748B' : '#94A3B8';
    const tooltipBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const tooltipBorder = isDarkMode ? '#334155' : '#E2E8F0';
    const tooltipText = isDarkMode ? '#E5E7EB' : '#0F172A';

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                let url = `/stats/analytics?period=${period}`;
                if (period === 'custom' && startDate && endDate) {
                    url += `&start=${startDate}&end=${endDate}`;
                } else if (period === 'custom') {
                    setLoading(false);
                    return;
                }
                const res = await api.get(url);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [period, startDate, endDate]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ 
                    background: tooltipBg, padding: '0.75rem 1rem', borderRadius: '8px', 
                    border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '0.85rem'
                }}>
                    <p style={{ fontWeight: 600, margin: '0 0 0.35rem 0', color: tooltipText }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '0.15rem 0', color: entry.color || entry.fill, fontSize: '0.8rem', fontWeight: 500 }}>
                            {entry.name}: {entry.value}{entry.name === 'Approval Rate' ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const inputStyle = {
        padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${isDarkMode ? '#334155' : '#E2E8F0'}`,
        background: isDarkMode ? '#1E293B' : '#FFFFFF',
        color: isDarkMode ? '#E5E7EB' : '#0F172A',
        fontSize: '0.8rem', fontFamily: 'inherit'
    };

    return (
        <div className="analytics-dashboard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h2 className="section-heading" style={{ margin: 0 }}>Analytics</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="yearly">This Year</option>
                        <option value="all_time">All Time</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {period === 'custom' && (
                        <>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loader-line" style={{ marginBottom: '2rem' }}></div>
            ) : data ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(380px, calc(50% - 1rem)), 1fr))', gap: '1.5rem' }}>

                    {/* Request Trends */}
                    <div className="chart-card">
                        <h3 className="chart-title">Request Trends</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.monthlyTrends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#6366F1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="approved" name="Approved" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Department Performance */}
                    <div className="chart-card">
                        <h3 className="chart-title">Department Performance</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.departmentStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" orientation="left" stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="volume" name="Volume" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="approvalRate" name="Approval Rate" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Workload Activity */}
                    <div className="chart-card">
                        <h3 className="chart-title">Workload Activity</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.workloadActivity}>
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="active" name="Active Forms" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Form Distribution */}
                    <div className="chart-card">
                        <h3 className="chart-title">Form Distribution</h3>
                        <div style={{ height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.formTypeStats} cx="50%" cy="50%"
                                        innerRadius={70} outerRadius={100}
                                        paddingAngle={4} dataKey="value" stroke="none"
                                    >
                                        {data.formTypeStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            ) : null}

            <style>{`
                .chart-card {
                    background: var(--card-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    box-shadow: var(--card-shadow);
                    transition: var(--transition-theme);
                }
                .chart-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-main);
                    margin: 0 0 1rem 0;
                }
                .section-heading {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-main);
                }
                .recharts-legend-item-text {
                    font-size: 0.8rem !important;
                    color: var(--text-dim) !important;
                }
            `}</style>
        </div>
    );
}
