import React, { useEffect, useState, useMemo } from 'react';
import { 
  XCircle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  MapPin, 
  AlertCircle,
  X,
  Info,
  Undo2
} from 'lucide-react';
import { api } from '../services/api';
import Breadcrumbs from './Breadcrumbs';

export default function AdminCancellationRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getAllBookings();
      // Filter for cancellation requests
      const requests = data.filter(b => b.status === 'CANCELLATION_REQUESTED');
      setBookings(requests.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesSearch = b.userName.toLowerCase().includes(search.toLowerCase()) || 
                            b.resourceName.toLowerCase().includes(search.toLowerCase());
      const matchesResource = resourceFilter === 'all' || b.resourceId.toString() === resourceFilter;
      return matchesSearch && matchesResource;
    });
  }, [bookings, search, resourceFilter]);

  const handleApproveCancellation = async (id) => {
    if (!window.confirm('Are you sure you want to approve this cancellation? This will release the slot.')) return;
    try {
      setSubmitting(true);
      setError('');
      // Using existing cancelBooking endpoint which sets status to CANCELLED
      await api.cancelBooking(id);
      setSuccess('Cancellation approved and slot released.');
      setTimeout(() => {
        setSuccess('');
        setSelectedBooking(null);
        fetchData();
      }, 1500);
    } catch (err) {
      setError(`Failed to approve cancellation: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectCancellation = async (id) => {
    if (!window.confirm('Rejection will restore the booking to APPROVED state. Continue?')) return;
    try {
      setSubmitting(true);
      setError('');
      // We need a specific endpoint to "Restore" or just set back to APPROVED
      // For simplicity, we can use approveBooking endpoint which sets status to APPROVED
      await api.approveBooking(id);
      setSuccess('Cancellation request rejected. Booking restored to APPROVED.');
      setTimeout(() => {
        setSuccess('');
        setSelectedBooking(null);
        fetchData();
      }, 1500);
    } catch (err) {
      setError(`Failed to reject cancellation: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resources = useMemo(() => {
    const resMap = new Map();
    bookings.forEach(b => resMap.set(b.resourceId, b.resourceName));
    return Array.from(resMap.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  if (loading) return <div className="page-state">Loading cancellation requests...</div>;

  return (
    <div className="animate-fade">
      <Breadcrumbs 
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Cancellation Requests' }
        ]} 
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Cancellation Requests</h2>
          <p>Review requests from users to cancel their already approved reservations.</p>
        </div>
        <div className="badge badge-rejected" style={{ background: 'var(--warning-surface)', color: 'var(--warning)' }}>
          {bookings.length} Pending Requests
        </div>
      </div>

      <div className="grid gap-6">
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="search-box" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                type="text" 
                placeholder="Search by user or resource..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '3rem', width: '100%' }}
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <Filter size={16} color="var(--muted)" />
              <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}>
                <option value="all">All Resources</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
            {filteredBookings.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--muted)' }}>
                <Info size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>No cancellation requests found.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Requester</th>
                    <th>Resource</th>
                    <th>Schedule</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="sidebar-avatar" style={{ background: 'var(--surface-alt)', color: 'var(--primary)', width: '2.5rem', height: '2.5rem' }}>
                            {booking.userName?.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold">{booking.userName}</div>
                            <div className="text-muted text-xs">ID #{booking.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{booking.resourceName}</div>
                      </td>
                      <td>
                        <div className="font-medium text-sm">{new Date(booking.date).toLocaleDateString()}</div>
                        <div className="text-primary font-bold text-xs">{booking.startTime} - {booking.endTime}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex gap-2 justify-end">
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleApproveCancellation(booking.id)}
                            disabled={submitting}
                          >
                            Approve Cancel
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => handleRejectCancellation(booking.id)}
                            disabled={submitting}
                          >
                            Reject Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
