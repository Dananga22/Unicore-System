import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  Bell, 
  ChevronRight, 
  Plus, 
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Layout,
  ExternalLink,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function UserDashboard({ userData }) {
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, ticketsData, notificationsData, dashboardData] = await Promise.all([
        api.getUserBookings(),
        api.getTickets(false),
        api.getUserNotifications(),
        api.getUserDashboardSummary()
      ]);
      setBookings(bookingsData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setTickets(ticketsData);
      setNotifications(notificationsData);
      setSummary(dashboardData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    return {
      activeBookings: summary?.bookingAnalytics?.activeBookings || 0,
      pendingBookings: summary?.bookingAnalytics?.pendingBookings || 0,
      openTickets: summary?.ticketAnalytics?.openTickets || 0,
      unreadNotifications: summary?.unreadNotificationsCount || 0
    };
  }, [summary]);

  const getStatusLabel = (status) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const statusColors = {
    APPROVED: '#16a34a',
    PENDING: '#d97706',
    REJECTED: '#dc2626',
    CANCELLED: '#4b5563',
    IN_PROGRESS: '#2563eb',
    OPEN: '#6366f1',
    RESOLVED: '#059669',
    CLOSED: '#6b7280'
  };

  if (loading) return <div className="page-state">Loading personal workspace...</div>;

  return (
    <div className="animate-fade" style={{ paddingBottom: '2rem' }}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Hello, {userData.name.split(' ')[0]} 👋
          </h2>
          <p className="text-muted" style={{ fontSize: '1.05rem' }}>
            Welcome back. You have <span className="text-primary font-bold">{stats.activeBookings} upcoming</span> events today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/resources" className="btn btn-primary shadow-sm" style={{ padding: '0.75rem 1.25rem' }}>
            <Plus size={18} /> New Reservation
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Upcoming Bookings', value: stats.activeBookings, icon: Calendar, color: '#3b82f6', bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', borderColor: 'rgba(59, 130, 246, 0.2)' },
          { label: 'Pending Reviews', value: stats.pendingBookings, icon: Clock, color: '#f59e0b', bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))', borderColor: 'rgba(245, 158, 11, 0.2)' },
          { label: 'Open Tickets', value: stats.openTickets, icon: Wrench, color: '#6366f1', bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))', borderColor: 'rgba(99, 102, 241, 0.2)' },
          { label: 'Unread Alerts', value: stats.unreadNotifications, icon: Bell, color: '#a855f7', bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))', borderColor: 'rgba(168, 85, 247, 0.2)' }
        ].map((stat, i) => (
          <div key={i} className="card stat-card-modern hover-lift" style={{ background: stat.bg, borderColor: stat.borderColor }}>
            <div className="stat-icon-square mb-3" style={{ color: stat.color, background: 'rgba(255,255,255,0.8)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <stat.icon size={20} />
            </div>
            <div className="stat-value-modern">{stat.value}</div>
            <div className="stat-label-modern">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid (70/30) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Main Activity) - 70% */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Recent Activity Card */}
          <div className="card shadow-sm p-0 overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
              <h3 className="m-0 text-base font-bold flex items-center gap-2">
                <Calendar size={18} className="text-primary" /> Recent Booking Activity
              </h3>
              <Link to="/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View History <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="p-1">
              {bookings.length === 0 ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <Calendar size={40} className="text-muted mb-3" style={{ opacity: 0.2 }} />
                  <p className="text-sm text-muted">No recent reservations found.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {bookings.slice(0, 4).map((booking, idx) => (
                    <div key={booking.id} className={`activity-row-compact ${idx === 3 ? '' : 'border-b'}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="resource-avatar-sm" style={{ backgroundColor: booking.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)' }}>
                          {booking.status === 'APPROVED' ? 
                            <CheckCircle2 size={16} className="text-success" /> : 
                            <Clock size={16} className="text-amber-500" />
                          }
                        </div>
                        <div>
                          <div className="font-bold text-sm">{booking.resourceName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-muted">
                            <span>{new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{booking.startTime.substring(0, 5)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge-refined" style={{ color: statusColors[booking.status] || '#666', backgroundColor: `${statusColors[booking.status] || '#666'}10` }}>
                          {getStatusLabel(booking.status)}
                        </span>
                        <Link to={`/history`} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                          <ExternalLink size={14} className="text-muted" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Maintenance & Tickets Section */}
          <div className="card shadow-sm border-0 bg-surface">
            <div className="flex justify-between items-center mb-5">
              <h3 className="m-0 text-base font-bold flex items-center gap-2">
                <Wrench size={18} className="text-indigo-500" /> Active Support Tickets
              </h3>
              <Link to="/tickets" className="text-xs font-bold text-indigo-600">All Tickets</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.length === 0 ? (
                <div className="col-span-2 py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-muted">No active maintenance tickets matching your profile.</p>
                </div>
              ) : (
                tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').slice(0, 2).map(ticket => (
                  <div key={ticket.id} className="ticket-card-compact">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted mb-0.5">#{ticket.id} • {ticket.category.replace('_', ' ')}</span>
                        <div className="font-bold text-sm leading-tight line-clamp-1">{ticket.description}</div>
                      </div>
                      <div className={`priority-indicator pr-${ticket.priority.toLowerCase()}`}></div>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                      <span className="text-[11px] font-bold py-1 px-2 rounded-lg" style={{ color: statusColors[ticket.status], backgroundColor: `${statusColors[ticket.status]}12` }}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className="text-[10px] text-muted font-medium italic">{ticket.priority} PRIORITY</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) - 30% */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Quick Actions Card */}
          <div className="card shadow-sm border-0 bg-white" style={{ border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-4 opacity-70">Quick Shortcuts</h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                { to: '/resources', icon: Layout, title: 'Browse Facilities', sub: 'Book rooms & labs', color: '#2563eb', bg: '#eff6ff' },
                { to: '/tickets/new', icon: AlertCircle, title: 'Report Issue', sub: 'Technical support', color: '#d97706', bg: '#fffbeb' },
                { to: '/history', icon: Zap, title: 'My Activity', sub: 'Manage requests', color: '#4f46e5', bg: '#eef2ff' }
              ].map((act, i) => (
                <Link key={i} to={act.to} className="action-tile-compact group">
                  <div className="tile-icon" style={{ backgroundColor: act.bg, color: act.color }}>
                    <act.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[13px]">{act.title}</div>
                    <div className="text-[10px] text-muted">{act.sub}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="card shadow-sm border-0" style={{ background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="m-0 text-sm font-bold flex items-center gap-2">
                <Bell size={16} className="text-primary" /> Recent Alerts
              </h3>
              {stats.unreadNotifications > 0 && (
                <span className="count-pill">{stats.unreadNotifications} NEW</span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {notifications.length === 0 ? (
                <p className="text-[11px] text-center py-4 text-muted italic">No new alerts.</p>
              ) : (
                notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="m-alert-compact" style={{ borderLeft: `2px solid ${n.type.includes('REJECTED') ? '#ef4444' : '#3b82f6'}` }}>
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="font-bold text-[11px]">{n.title}</div>
                      <span className="text-[9px] text-muted font-bold">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted line-clamp-1 m-0">{n.message}</p>
                  </div>
                ))
              )}
            </div>
            
            <button className="btn btn-secondary btn-sm w-full mt-4 flex items-center justify-center gap-1.5" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
              Dismiss All <CheckCircle2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hover-lift {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.1);
        }
        .stat-card-modern {
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .stat-icon-square {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-value-modern {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 0.25rem;
        }
        .stat-label-modern {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .activity-row-compact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1rem;
          transition: background 0.1s ease;
        }
        .activity-row-compact:hover {
          background: rgba(0,0,0,0.015);
        }
        .resource-avatar-sm {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge-refined {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        .ticket-card-compact {
          padding: 1rem;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .ticket-card-compact:hover {
          transform: translateY(-2px);
          border-color: var(--primary);
        }
        .priority-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .pr-high, .pr-critical { background-color: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
        .pr-medium { background-color: #f59e0b; }
        .pr-low { background-color: #22c55e; }
        
        .action-tile-compact {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.75rem 1rem;
          background: #fcfcfc;
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
        }
        .action-tile-compact:hover {
          background: #fff;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .tile-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .m-alert-compact {
          padding: 0.75rem;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .count-pill {
          font-size: 8px;
          font-weight: 900;
          background: var(--primary);
          color: #fff;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .accent-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}
