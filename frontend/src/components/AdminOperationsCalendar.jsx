import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ClipboardList,
  Wrench,
  MapPin,
  User,
  Users,
  LayoutDashboard,
  Filter,
  MoreVertical,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

const AdminOperationsCalendar = ({ userData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper for consistent date comparison (YYYY-MM-DD)
  // Treats strings as literal dates to avoid timezone shifts
  const normalizeDate = (date) => {
    if (!date) return null;
    
    // If it's an ISO string (2026-04-20T...), take the date part literally
    if (typeof date === 'string') {
      const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    
    // Otherwise handle as Date object
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isSameDay = (date1, date2) => {
    const d1 = normalizeDate(date1);
    const d2 = normalizeDate(date2);
    return d1 && d2 && d1 === d2;
  };

  // Helper for local-safe date formatting (YYYY-MM-DD)
  const formatLocalDate = (date) => normalizeDate(date);

  // Fetch data when month/range changes
  useEffect(() => {
    const fetchRangeData = async () => {
      try {
        setLoading(true);
        // Calculate range based on current month/view
        const start = view === 'month' 
          ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
          : new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        
        const end = view === 'month'
          ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
          : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        
        const response = await api.getAdminOperationsCalendar(formatLocalDate(start), formatLocalDate(end));
        setData(response);
      } catch (err) {
        setError("Failed to load operations data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRangeData();
  }, [currentDate, view]);

  const selectDate = (date) => {
    setSelectedDate(date);
  };

  const nextMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    }
  };

  const prevMonth = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    }
  };

  // Grid Generation Logic
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (view === 'month') {
      const date = new Date(year, month, 1);
      const daysArr = [];
      const firstDay = date.getDay();
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      
      for (let i = firstDay - 1; i >= 0; i--) {
        daysArr.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
      }
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        daysArr.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      while (daysArr.length % 7 !== 0) {
        const last = daysArr[daysArr.length - 1].date;
        daysArr.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), isCurrentMonth: false });
      }
      return daysArr;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
      const daysArr = [];
      for (let i = 0; i < 7; i++) {
        daysArr.push({ date: new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i), isCurrentMonth: true });
      }
      return daysArr;
    }
  }, [currentDate, view]);

  const getDayData = (date) => {
    if (!data || !data.calendarData) return null;
    const dateStr = formatLocalDate(date);
    return data.calendarData[dateStr];
  };

  const selectedDayData = useMemo(() => getDayData(selectedDate), [selectedDate, data]);

  if (error) return <div className="page-error-container">{error}</div>;

  return (
    <div className="admin-ops-wrapper animate-in fade-in duration-500">
      {/* 1. Header & Summary Cards */}
      <section className="dashboard-summary-section">
        <div className="summary-grid">
          <div className="summary-card glass-card">
            <div className="summary-card-header">
              <div className="icon-badge bg-indigo-soft"><CalendarIcon className="text-indigo" size={20} /></div>
              <span className="card-labelText">Today's Bookings</span>
            </div>
            <div className="summary-card-body">
              <h3>{data?.todayBookingsCount || 0}</h3>
              <span className="card-trend positive"><ArrowUpRight size={14} /> Live</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-card-header">
              <div className="icon-badge bg-amber-soft"><Clock className="text-amber" size={20} /></div>
              <span className="card-labelText">Pending Approvals</span>
            </div>
            <div className="summary-card-body">
              <h3>{data?.pendingApprovalsCount || 0}</h3>
              <span className="card-trend neutral">Waiting</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-card-header">
              <div className="icon-badge bg-purple-soft"><AlertTriangle className="text-purple" size={20} /></div>
              <span className="card-labelText">Open Tickets</span>
            </div>
            <div className="summary-card-body">
              <h3>{data?.openTicketsCount || 0}</h3>
              <span className="card-trend negative">Attention</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-card-header">
              <div className="icon-badge bg-blue-soft"><Activity className="text-blue" size={20} /></div>
              <span className="card-labelText">In Progress</span>
            </div>
            <div className="summary-card-body">
              <h3>{data?.inProgressTicketsCount || 0}</h3>
              <span className="card-trend info">Active</span>
            </div>
          </div>

          <div className="summary-card glass-card urgent">
            <div className="summary-card-header">
              <div className="icon-badge bg-red-soft"><AlertCircle className="text-danger" size={20} /></div>
              <span className="card-labelText">Urgent Issues</span>
            </div>
            <div className="summary-card-body">
              <h3 className="text-danger">{data?.urgentTicketsCount || 0}</h3>
              <span className="card-trend negative">High Priority</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Full-Width Hero Calendar */}
      <section className="calendar-hero-section mt-6">
        <div className="card calendar-main-card">
          <div className="calendar-header-modern">
            <div className="header-left">
              <div className="month-selector">
                <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
              </div>
              <div className="nav-controls ml-4">
                <button className="btn-nav" onClick={prevMonth}><ChevronLeft size={20}/></button>
                <button className="btn-today" onClick={() => setCurrentDate(new Date())}>Today</button>
                <button className="btn-nav" onClick={nextMonth}><ChevronRight size={20}/></button>
              </div>
            </div>
            
            <div className="header-right">
              <div className="view-toggle">
                <button className={`toggle-btn ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>Month</button>
                <button className={`toggle-btn ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>Week</button>
              </div>
              <button className="btn-filter ml-3"><Filter size={18}/> Filters</button>
            </div>
          </div>

          <div className="calendar-surface">
            <div className="calendar-days-header">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="weekday-label">{d}</div>
              ))}
            </div>
            
            <div className={`calendar-grid ${view}`}>
              {days.map((day, idx) => {
                const dayData = getDayData(day.date);
                const isSelected = formatLocalDate(day.date) === formatLocalDate(selectedDate);
                const isToday = formatLocalDate(day.date) === formatLocalDate(new Date());
                
                return (
                  <div 
                    key={idx} 
                    className={`calendar-day-cell ${!day.isCurrentMonth ? 'inactive' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                    onClick={() => selectDate(day.date)}
                  >
                    <div className="cell-top">
                      <span className="day-number">{day.date.getDate()}</span>
                      {dayData?.ticketCount > 0 && (
                        <div className="ticket-indicator-badge">
                          <AlertTriangle size={10} /> {dayData.ticketCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="cell-events">
                      {dayData?.bookings?.slice(0, 3).map((b, bIdx) => (
                        <div key={bIdx} className={`booking-chip-modern status-${b.status.toLowerCase()}`}>
                          <span className="b-name">{b.resourceName}</span>
                          <span className="b-time">{b.startTime.substring(0, 5)}</span>
                        </div>
                      ))}
                      {dayData?.bookings?.length > 3 && (
                        <div className="more-events">+{dayData.bookings.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Operational Detail Panels (Bottom Row) */}
      <section className="operational-panels-section mt-6">
        <div className="panels-grid">
          {/* A. Daily Operations Panel */}
          <div className="card panel-card">
            <div className="panel-card-header">
              <div className="flex items-center gap-3">
                <div className="icon-badge bg-indigo-soft"><ClipboardList className="text-indigo" size={20} /></div>
                <div>
                  <h4 className="m-0">Daily Operations</h4>
                  <p className="text-muted text-xs m-0">{selectedDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="count-chip">{selectedDayData?.bookings?.length || 0} Items</div>
            </div>

            <div className="panel-card-body">
              {!selectedDayData?.bookings?.length ? (
                <div className="empty-panel-state">
                  <CalendarIcon size={48} className="opacity-10 mb-2" />
                  <p>No bookings scheduled for this day.</p>
                </div>
              ) : (
                <div className="detailed-ops-list">
                  {selectedDayData.bookings.map((booking, idx) => (
                    <div key={idx} className="modern-op-item transition-all">
                      <div className="op-item-time">
                        <span className="time-start">{booking.startTime.substring(0, 5)}</span>
                        <div className="time-line"></div>
                        <span className="time-end">{booking.endTime.substring(0, 5)}</span>
                      </div>
                      <div className="op-item-content">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5>{booking.resourceName}</h5>
                            <div className="op-metadata">
                              <span className="meta-item"><User size={12}/> {booking.userName}</span>
                              <span className="meta-item"><Users size={12}/> {booking.expectedAttendees || 1} Attendees</span>
                            </div>
                            <p className="op-purpose">"{booking.purpose || 'Campus Resource Usage'}"</p>
                          </div>
                          <span className={`status-tag status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                        </div>
                      </div>
                      <button className="btn-more"><MoreVertical size={16}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* B. Critical Maintenance / Ticket Issues */}
          <div className="card panel-card">
            <div className="panel-card-header">
              <div className="flex items-center gap-3">
                <div className="icon-badge bg-red-soft"><Wrench className="text-danger" size={20} /></div>
                <div>
                  <h4 className="m-0">Maintenance & Ticket Oversight</h4>
                  <p className="text-muted text-xs m-0">
                    {selectedDayData ? `Tickets for ${selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Critical focus areas across campus'}
                  </p>
                </div>
              </div>
              {selectedDayData?.tickets?.length > 0 && (
                <div className="count-chip bg-red-soft text-danger">{selectedDayData.tickets.length} Issues</div>
              )}
            </div>

            <div className="panel-card-body">
              {(() => {
                // Shared filtering logic to ensure badge and panel always match
                // 1. Try to get tickets from the per-date DTO
                let dayTickets = selectedDayData?.tickets || [];
                
                // 2. Fallback/Refine: Filter from the global criticalMaintenance list if array is empty
                // This ensures that even if backend grouping differs (timezone etc), we find them
                if (dayTickets.length === 0 && data?.criticalMaintenance) {
                  dayTickets = data.criticalMaintenance.filter(ticket => 
                    isSameDay(ticket.createdAt, selectedDate)
                  );
                }
                
                if (dayTickets.length === 0) {
                  return (
                    <div className="empty-panel-state">
                      <CheckCircle2 size={48} className="text-success opacity-10 mb-2" />
                      <p>No ticket issues reported for this date.</p>
                    </div>
                  );
                }

                // Sort display tickets: Critical/High first, then by date
                const sortedTickets = [...dayTickets].sort((a, b) => {
                  const priorityMap = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
                  const pA = priorityMap[a.priority?.toUpperCase()] ?? 99;
                  const pB = priorityMap[b.priority?.toUpperCase()] ?? 99;
                  if (pA !== pB) return pA - pB;
                  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });

                return (
                  <div className="maintenance-stack">
                    {sortedTickets.slice(0, 5).map((ticket, idx) => {
                      const isOverdue = ticket.status !== 'RESOLVED' && 
                                       ticket.createdAt && 
                                       (new Date() - new Date(ticket.createdAt) > 3 * 24 * 60 * 60 * 1000);
                                       
                      return (
                        <div key={ticket.id || idx} className={`maintenance-ticket-v2 ${ticket.priority?.toLowerCase() === 'critical' ? 'is-critical' : ''} ${isOverdue ? 'is-overdue' : ''}`}>
                          <div className="ticket-v2-main">
                            <div className="flex justify-between items-start">
                              <span className="category-label">{ticket.category || 'Maintenance'}</span>
                              <div className="flex gap-2">
                                {isOverdue && <span className="overdue-tag">OVERDUE</span>}
                                <span className={`prio-badge prio-${ticket.priority?.toLowerCase() || 'medium'}`}>{ticket.priority || 'MEDIUM'}</span>
                              </div>
                            </div>
                            <h5 className="mt-2 mb-1">
                              {ticket.title || (ticket.description ? (ticket.description.substring(0, 50) + (ticket.description.length > 50 ? '...' : '')) : 'No Description')}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-muted">
                              <MapPin size={12}/> {ticket.location || ticket.resourceName || 'Campus'}
                              <span className="dot-sep">•</span>
                              <span>{ticket.reportedByName || 'Staff'}</span>
                            </div>
                          </div>
                          <div className="ticket-v2-footer">
                            <span className="date-added">
                              {ticket.createdAt ? `Reported ${new Date(ticket.createdAt).toLocaleDateString()}` : 'Date unknown'}
                            </span>
                            <span className={`status-badge-mini status-${ticket.status?.toLowerCase().replace('_', '-') || 'open'}`}>
                              {ticket.status?.replace('_', ' ') || 'OPEN'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {sortedTickets.length > 5 && (
                      <button className="btn-view-all" style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#f8fafc',
                        border: '1px dashed #e2e8f0',
                        borderRadius: '10px',
                        color: '#64748b',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}>
                        View All {sortedTickets.length} Tickets
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .admin-ops-wrapper {
          padding: 1rem;
          color: #1e293b;
        }

        /* Summary Grid */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }

        .summary-card {
          padding: 1.25rem;
          border-radius: 1.25rem;
          background: #fff;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .summary-card.urgent { border-left: 4px solid #ef4444; }

        .summary-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: grid;
          place-items: center;
        }

        .card-labelText { font-family: 'Inter', sans-serif; font-size: 0.8rem; font-weight: 500; color: #64748b; }

        .summary-card-body {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .summary-card-body h3 { font-size: 1.75rem; margin: 0; font-weight: 700; color: #0f172a; }

        .card-trend { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; }
        .card-trend.positive { background: #dcfce7; color: #15803d; }
        .card-trend.neutral { background: #fef3c7; color: #92400e; }
        .card-trend.negative { background: #fee2e2; color: #b91c1c; }
        .card-trend.info { background: #e0f2fe; color: #0369a1; }

        /* Modern Calendar Styles */
        .calendar-main-card {
          padding: 0;
          overflow: hidden;
          background: #fff;
          border-radius: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .calendar-header-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-left, .header-right { display: flex; align-items: center; }

        .nav-controls { display: flex; align-items: center; gap: 4px; background: #f8fafc; padding: 4px; border-radius: 10px; }
        .btn-nav, .btn-today { border: none; padding: 6px 12px; border-radius: 8px; background: transparent; cursor: pointer; color: #64748b; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
        .btn-nav:hover, .btn-today:hover { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        .view-toggle { display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; }
        .toggle-btn { border: none; padding: 6px 16px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #64748b; transition: 0.2s; }
        .toggle-btn.active { background: #fff; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .calendar-surface { padding: 1.25rem; }

        .calendar-days-header { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.75rem; text-align: center; }
        .weekday-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #f1f5f9; border: 1px solid #f1f5f9; border-radius: 1rem; overflow: hidden; }

        .calendar-day-cell {
          background: #fff;
          min-height: 140px;
          padding: 0.75rem;
          transition: all 0.2s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .calendar-day-cell:hover { background: #f8fafc; }
        .calendar-day-cell.inactive { background: #fcfdfe; color: #cbd5e1; }
        .calendar-day-cell.selected { background: #f0f7ff; box-shadow: inset 0 0 0 2px #3b82f6; }
        .calendar-day-cell.is-today .day-number { background: #3b82f6; color: #fff; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 8px; }

        .cell-top { display: flex; justify-content: space-between; align-items: center; }
        .day-number { font-weight: 700; font-size: 0.95rem; }

        .ticket-indicator-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          background: #fef2f2;
          color: #ef4444;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .cell-events { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }

        .booking-chip-modern {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.73rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 3px solid transparent;
          white-space: nowrap;
          overflow: hidden;
          background: #f8fafc;
        }

        .b-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%; }
        .b-time { font-size: 0.65rem; opacity: 0.6; }

        .booking-chip-modern.status-approved { background: #ecfdf5; border-left-color: #10b981; color: #065f46; }
        .booking-chip-modern.status-pending { background: #fffbeb; border-left-color: #f59e0b; color: #92400e; }
        .booking-chip-modern.status-cancelled { background: #f1f5f9; border-left-color: #94a3b8; color: #475569; }

        .more-events { font-size: 0.7rem; color: #64748b; font-weight: 600; padding: 2px; }

        /* Operational Panels Bottom Row */
        .panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 1024px) { .panels-grid { grid-template-columns: 1fr; } }

        .panel-card { border-radius: 1.5rem; border: 1px solid #e2e8f0; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .panel-card-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .panel-card-body { padding: 1.5rem; max-height: 500px; overflow-y: auto; }

        .modern-op-item { display: flex; gap: 1rem; padding: 1rem; border-radius: 1rem; border: 1px solid #f1f5f9; margin-bottom: 0.75rem; position: relative; }
        .modern-op-item:hover { background: #f8fafc; border-color: #e2e8f0; }

        .op-item-time { display: flex; flex-direction: column; align-items: center; min-width: 50px; font-size: 0.8rem; font-weight: 700; color: #64748b; }
        .time-line { width: 2px; flex-grow: 1; background: #e2e8f0; margin: 4px 0; border-radius: 2px; }

        .op-item-content { flex-grow: 1; }
        .op-item-content h5 { margin: 0 0 4px 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
        .op-metadata { display: flex; gap: 1rem; margin-bottom: 4px; }
        .meta-item { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #64748b; }
        .op-purpose { font-size: 0.8rem; color: #94a3b8; font-style: italic; margin-top: 4px; }

        .status-tag { font-size: 0.65rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.02em; }
        .status-tag.status-approved { background: #10b98120; color: #10b981; }
        .status-tag.status-pending { background: #f59e0b20; color: #f59e0b; }

        .maintenance-stack { display: flex; flex-direction: column; gap: 1rem; }
        .maintenance-ticket-v2 { padding: 1.25rem; border-radius: 1.25rem; border: 1px solid #f1f5f9; background: #fcfcfd; }
        .maintenance-ticket-v2.is-critical { border-left: 4px solid #ef4444; }
        .maintenance-ticket-v2.is-overdue { background: linear-gradient(to right, #fff1f2, #fff); border-left: 4px solid #be123c; }

        .category-label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .prio-badge { font-size: 0.65rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
        .prio-critical { background: #fee2e2; color: #991b1b; }
        .prio-high { background: #ffedd5; color: #9a3412; }
        .overdue-tag { background: #991b1b; color: #fff; font-size: 0.6rem; font-weight: 900; padding: 2px 6px; border-radius: 4px; }

        .status-badge-mini { font-size: 0.7rem; font-weight: 700; text-transform: capitalize; color: #64748b; }
        .status-badge-mini.status-in-progress { color: #3b82f6; }

        .ticket-v2-footer { margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; }
        .date-added { font-size: 0.7rem; color: #94a3b8; }

        .empty-panel-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; color: #94a3b8; font-weight: 500; }

        /* Utility helper colors */
        .bg-indigo-soft { background: #eef2ff; }
        .text-indigo { color: #4f46e5; }
        .bg-amber-soft { background: #fffbeb; }
        .text-amber { color: #d97706; }
        .bg-purple-soft { background: #faf5ff; }
        .text-purple { color: #7c3aed; }
        .bg-red-soft { background: #fef2f2; }
        .text-danger { color: #dc2626; }
        .bg-blue-soft { background: #eff6ff; }
        .text-blue { color: #2563eb; }
        .dot-sep { margin: 0 4px; }
      `}</style>
    </div>
  );
};

export default AdminOperationsCalendar;
