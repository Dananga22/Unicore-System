import React, { useEffect, useState, useMemo } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users, 
  Package, 
  Calendar,
  AlertCircle,
  Plus,
  ShieldCheck,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart2,
  Bell,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getAdminDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error('Dashboard Fetch Error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusPieData = useMemo(() => {
    const analytics = summary?.bookingAnalytics;
    if (!analytics) return [];
    return [
      { name: 'Approved', value: analytics.approvedBookings || 0, color: '#10b981' },
      { name: 'Pending', value: analytics.pendingBookings || 0, color: '#f59e0b' },
      { name: 'Rejected', value: analytics.rejectedBookings || 0, color: '#ef4444' },
      { name: 'Cancelled', value: analytics.cancelledBookings || 0, color: '#6b7280' },
    ];
  }, [summary]);

  const trendData = useMemo(() => {
    const trends = summary?.bookingAnalytics?.bookingsByDate;
    if (!trends) return [];
    return Object.entries(trends)
      .map(([date, count]) => ({ 
        name: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
        bookings: count,
        date: date
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [summary]);

  const popularityData = useMemo(() => {
    const popularity = summary?.bookingAnalytics?.resourcePopularity;
    if (!popularity) return [];
    return Object.entries(popularity)
      .map(([name, count]) => ({ name, usage: count }))
      .sort((a, b) => b.usage - a.usage);
  }, [summary]);

  const peakHourData = useMemo(() => {
    const hours = summary?.bookingAnalytics?.peakBookingHours;
    if (!hours) return [];
    return Object.entries(hours).map(([hour, count]) => ({
      hour,
      bookings: count
    }));
  }, [summary]);

  const ticketStatusData = useMemo(() => {
    const statusMap = summary?.ticketAnalytics?.ticketsByStatus;
    if (!statusMap) return [];
    const colors = {
      OPEN: '#3b82f6',
      IN_PROGRESS: '#f59e0b',
      RESOLVED: '#10b981',
      CLOSED: '#6b7280',
      REJECTED: '#ef4444'
    };
    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.replaceAll('_', ' '),
      value,
      color: colors[name] || '#6366f1'
    }));
  }, [summary]);

  if (loading) return <div className="page-state">Analyzing campus operations...</div>;

  return (
    <div className="dashboard-v2-container animate-fade">
      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-indigo">
            <Calendar size={24} />
          </div>
          <div className="stat-value">{summary?.bookingAnalytics?.totalBookings || 0}</div>
          <div className="stat-label">Total Bookings</div>
          <div className="stat-trend text-primary">
            <TrendingUp size={14} /> Total handled
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-amber">
            <Clock size={24} />
          </div>
          <div className="stat-value">{summary?.bookingAnalytics?.pendingBookings || 0}</div>
          <div className="stat-label">Pending Reviews</div>
          <div className="badge badge-pending">New Requests</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-red" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-value">{summary?.bookingAnalytics?.cancellationRequests || 0}</div>
          <div className="stat-label">Cancel Requests</div>
          <div className="badge badge-rejected">Action Required</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-indigo">
             <Wrench size={24} />
          </div>
          <div className="stat-value">{summary?.ticketAnalytics?.openTickets || 0}</div>
          <div className="stat-label">Open Tickets</div>
          <div className="text-muted text-xs">Tickets needing technician</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-blue">
            <Package size={24} />
          </div>
          <div className="stat-value">{summary?.activeResourcesCount || 0}</div>
          <div className="stat-label">Active Resources</div>
          <div className="stat-trend" style={{ color: '#3b82f6' }}>Operational</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper accent-purple">
            <Users size={24} />
          </div>
          <div className="stat-value">{summary?.totalUsers || 0}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-trend" style={{ color: '#9333ea' }}>Campus members</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row mt-8">
        <div className="glass-card p-6">
          <h3 className="panel-title"><PieChartIcon size={18} /> Booking Distribution</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs font-bold">
            {statusPieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="panel-title"><TrendingUp size={18} /> Booking Trends</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="main-content-grid mt-8">
        <div className="flex flex-col gap-8">
           {/* Resource Popularity Chart */}
           <div className="glass-card p-6">
              <h3 className="panel-title"><BarChart2 size={18} /> Most Requested Facilities</h3>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="usage" fill="var(--primary)" radius={[0, 10, 10, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="panel-title"><Clock size={18} /> Peak Booking Hours</h3>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHourData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#1e3a8a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="glass-card p-6">
            <h3 className="panel-title"><PieChartIcon size={18} /> Ticket Status Distribution</h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketStatusData}
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`ticket-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4 text-xs font-bold">
              {ticketStatusData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }}></div>
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="panel-title"><ShieldCheck size={18} /> High-Priority Actions</h3>
            <div className="quick-actions-list">
              <Link to="/admin/approvals" className="action-item">
                <div className="stat-icon-wrapper accent-amber" style={{ width: '2.5rem', height: '2.5rem', marginBottom: 0 }}>
                  <Bell size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Booking Approvals</div>
                  <div className="text-xs text-muted">Review {summary?.bookingAnalytics?.pendingBookings || 0} requests</div>
                </div>
              </Link>
              <Link to="/admin/cancellations" className="action-item">
                <div className="stat-icon-wrapper accent-red" style={{ width: '2.5rem', height: '2.5rem', marginBottom: 0, background: '#fef2f2', color: '#ef4444' }}>
                  <XCircle size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold">Cancel Requests</div>
                  <div className="text-xs text-muted">Handle {summary?.bookingAnalytics?.cancellationRequests || 0} requests</div>
                </div>
              </Link>
              <Link to="/resources/new" className="action-item">
                <div className="stat-icon-wrapper accent-blue" style={{ width: '2.5rem', height: '2.5rem', marginBottom: 0 }}>
                  <Plus size={18} />
                </div>
                <div>
                    <div className="text-sm font-bold">Add Resource</div>
                    <div className="text-xs text-muted">Register new asset</div>
                </div>
              </Link>
              <Link to="/admin/users" className="action-item">
                <div className="stat-icon-wrapper accent-purple" style={{ width: '2.5rem', height: '2.5rem', marginBottom: 0 }}>
                  <Users size={18} />
                </div>
                <div>
                    <div className="text-sm font-bold">User Management</div>
                    <div className="text-xs text-muted">Access permissions</div>
                </div>
              </Link>
              <Link to="/tickets" className="action-item">
                <div className="stat-icon-wrapper accent-indigo" style={{ width: '2.5rem', height: '2.5rem', marginBottom: 0 }}>
                  <Wrench size={18} />
                </div>
                <div>
                    <div className="text-sm font-bold">Ticket Queue</div>
                    <div className="text-xs text-muted">Solve technical issues</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Users Activity */}
          <div className="glass-card p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="panel-title" style={{ margin: 0 }}><ShieldCheck size={18} /> New Registrations</h3>
                <Link to="/admin/users" className="text-xs font-bold text-primary flex items-center gap-1">Manage <ExternalLink size={12} /></Link>
             </div>
             <div className="flex flex-col gap-3">
                {summary?.recentRegistrations?.map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                     <div className="sidebar-avatar" style={{ width: '2.2rem', height: '2.2rem', background: 'var(--surface-alt)', color: 'var(--primary)', fontSize: '0.8rem' }}>
                        {u.name[0]}
                     </div>
                     <div>
                        <div className="text-sm font-bold">{u.name}</div>
                        <div className="text-xs text-muted">{u.role}</div>
                     </div>
                  </div>
                ))}
                {(!summary?.recentRegistrations || summary.recentRegistrations.length === 0) && (
                  <div className="text-center py-4 text-muted text-xs">No recent registrations</div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
