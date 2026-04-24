import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { XCircle, AlertCircle, X, Edit2, Trash2, RotateCcw } from 'lucide-react';


export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getUserBookings();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = (id) => {
    setBookingToCancel(id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!bookingToCancel) return;
    const booking = bookings.find(b => b.id === bookingToCancel);
    const isRequest = booking?.status === 'APPROVED';

    try {
      setCancelling(true);
      if (isRequest) {
        await api.requestBookingCancellation(bookingToCancel);
        alert('Cancellation request has been sent to the admin.');
      } else {
        await api.cancelBooking(bookingToCancel);
      }
      setShowCancelModal(false);
      setBookingToCancel(null);
      fetchBookings();
    } catch (err) {
      alert(`Operation failed: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="card">Loading bookings...</div>;

  return (
    <div className="card animate-fade">
      <div className="card-header">
        <div>
          <h2>My Bookings</h2>
          <p>Track approval progress, review outcomes, and modify active requests when needed.</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" onClick={fetchBookings}>
          <RotateCcw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="badge badge-rejected" style={{ justifySelf: 'start', marginBottom: '1rem' }}>{error}</div>}

      {bookings.length === 0 ? (
        <p style={{ padding: '2rem 0', textAlign: 'center' }}>You have not created any bookings yet.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{booking.resourceName}</td>
                  <td>{booking.date}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{booking.startTime} - {booking.endTime}</td>
                  <td>{booking.purpose}</td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>
                        {booking.status === 'CANCELLATION_REQUESTED' ? 'Cancel Requested' : booking.status}
                      </span>
                      {booking.reviewReason && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: '#991b1b', 
                          fontWeight: 500,
                          paddingLeft: '0.2rem'
                        }}>
                          {booking.reviewReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                      {booking.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary flex items-center justify-center gap-1.5" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                            onClick={() => navigate(`/bookings/edit/${booking.id}`)}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button className="btn btn-danger-outline flex items-center justify-center gap-1.5" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleCancel(booking.id)}>
                            <Trash2 size={13} /> Cancel
                          </button>
                        </div>
                      )}
                      {booking.status === 'APPROVED' && (
                        <button 
                          className="btn btn-warning-outline" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleCancel(booking.id)}
                        >
                          Request Cancellation
                        </button>
                      )}
                      {booking.status === 'CANCELLATION_REQUESTED' && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                          Waiting for admin...
                        </span>
                      )}
                      {['REJECTED', 'CANCELLED'].includes(booking.status) && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          -
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem' }}>
                <XCircle size={22} /> Cancel Booking
              </h2>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }} onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1.25rem', color: 'var(--text)', fontSize: '1.05rem' }}>
                {bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' 
                  ? 'Would you like to send a cancellation request to the administrator for this approved booking?'
                  : 'Are you sure you want to cancel this booking request?'}
              </p>
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem', 
                padding: '1rem', 
                background: bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                borderRadius: '12px', 
                border: bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.1)' 
              }}>
                <AlertCircle size={18} style={{ color: bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? 'var(--warning)' : 'var(--danger)', flexShrink: 0 }} />
                <p style={{ fontSize: '0.88rem', color: bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? '#92400e' : '#b91c1c', margin: 0, lineHeight: '1.4' }}>
                  {bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED'
                    ? 'Since this booking is already approved, an administrator must review and process your cancellation request.'
                    : 'This will release the reserved time slot for others to book. This action cannot be reversed.'}
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                {bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? 'Keep Booking' : "Don't Cancel"}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? 'var(--warning)' : 'var(--danger)' }} 
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Processing...' : (bookings.find(b => b.id === bookingToCancel)?.status === 'APPROVED' ? 'Send Request' : 'Confirm Cancellation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
