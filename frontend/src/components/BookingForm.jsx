import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';

export default function BookingForm({ userData }) {
  if (userData?.role !== 'USER') {
    return <Navigate to="/dashboard" replace />;
  }

  const [formData, setFormData] = useState({
    resourceId: '',
    date: '',
    purpose: 'Meeting',
    notes: '',
    expectedAttendees: 1,
    startTime: '',
    endTime: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [validation, setValidation] = useState('');
  
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await api.getResources();
        const activeResources = data.filter((resource) => resource.status === 'ACTIVE');
        setResources(activeResources);
        if (activeResources.length > 0) {
          setFormData((prev) => ({ ...prev, resourceId: activeResources[0].id }));
        }
      } catch (err) {
        setStatus({ type: 'error', message: err.message });
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    if (formData.resourceId && formData.date) {
      fetchSlots(formData.date, formData.resourceId);
    }
  }, [formData.resourceId, formData.date]);

  const fetchSlots = async (date, resourceId) => {
    // 1. Reset selection state and clear previous slots/errors immediately
    setSlots([]);
    setSelectedSlots([]);
    setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
    setStatus({ type: '', message: '' });
    setValidation('');

    // 2. Sanitize date - prevent malformed years (e.g. from manual typing or prepends)
    if (!date || date.length > 10 || parseInt(date.substring(0, 4)) > 2100) {
      return; // Ignore invalid dates silently or show a mini-hint
    }

    try {
      setLoadingSlots(true);
      const data = await api.getSlots(date, resourceId);
      
      // 3. Ensure data is an array before setting slots
      if (Array.isArray(data)) {
        setSlots(data);
      } else {
        throw new Error('Received invalid slot data format from server.');
      }
    } catch (err) {
      // 4. Handle HTML error pages or generic 500s gracefully
      const friendlyMessage = err.message?.includes('<!DOCTYPE') 
        ? 'An unexpected server error occurred while scanning schedules.' 
        : err.message;
      setStatus({ type: 'error', message: friendlyMessage });
    } finally {
      setLoadingSlots(false);
    }
  };

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === Number(formData.resourceId)),
    [resources, formData.resourceId]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidation('');
  };

  const toggleSlot = (clickedSlot) => {
    if (clickedSlot.state !== 'AVAILABLE') return;

    setSelectedSlots(prev => {
      // If we already have a range > 1 or user clicks the same slot again
      if (prev.length > 1 || (prev.length === 1 && prev[0].startTime === clickedSlot.startTime)) {
        setValidation('');
        return [clickedSlot]; // Reset to single start point
      }

      if (prev.length === 1) {
        const startIdx = slots.findIndex(s => s.startTime === prev[0].startTime);
        const endIdx = slots.findIndex(s => s.startTime === clickedSlot.startTime);

        const rangeStart = Math.min(startIdx, endIdx);
        const rangeEnd = Math.max(startIdx, endIdx);

        const range = slots.slice(rangeStart, rangeEnd + 1);
        const hasConflict = range.some(s => s.state !== 'AVAILABLE');

        if (hasConflict) {
          setValidation('Cannot select this range due to conflict.');
          return prev; // keep the existing single point
        }

        setValidation('');
        return range;
      }

      return [clickedSlot];
    });
  };

  useEffect(() => {
    if (selectedSlots.length > 0) {
      setFormData(f => ({
          ...f,
          startTime: selectedSlots[0].startTime,
          endTime: selectedSlots[selectedSlots.length - 1].endTime,
      }));
    } else {
      setFormData(f => ({ ...f, startTime: '', endTime: '' }));
    }
  }, [selectedSlots]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    if (!formData.startTime || !formData.endTime) {
      setValidation('Please select at least one time slot.');
      setLoading(false);
      return;
    }

    try {
      const combinedPurpose = formData.notes ? `${formData.purpose} - ${formData.notes}` : formData.purpose;

      const bookingData = {
        ...formData,
        purpose: combinedPurpose,
        resourceId: Number(formData.resourceId),
        expectedAttendees: Number(formData.expectedAttendees),
      };

      console.log('Submitting Booking Payload:', bookingData);

      await api.createBooking(bookingData);


      setStatus({ type: 'success', message: 'Booking request submitted successfully. Approval status will appear in My Bookings.' });
      setFormData((prev) => ({
        ...prev,
        date: '',
        purpose: '',
        expectedAttendees: 1,
        startTime: '',
        endTime: '',
      }));
      setSelectedSlots([]);
      setSlots([]);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      resourceId: resources.length > 0 ? resources[0].id : '',
      date: '',
      purpose: 'Meeting',
      notes: '',
      expectedAttendees: 1,
      startTime: '',
      endTime: '',
    });
    setSelectedSlots([]);
    setSlots([]);
    setValidation('');
    setStatus({ type: '', message: '' });
  };

  return (
    <div className="animate-fade">
      <div className="mb-8 pl-1">
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>Booking Management</h2>
        <p className="text-muted" style={{ fontSize: '1.05rem' }}>Select a date and interactive visual time slots to create a conflict-free request.</p>
      </div>

      {(status.message || validation) && (
        <div className={`badge ${status.type === 'error' || validation ? 'badge-rejected' : 'badge-approved'}`} style={{ marginBottom: '1.5rem', display: 'inline-flex', fontSize: '0.95rem', padding: '0.75rem 1.25rem' }}>
          {validation || status.message}
        </div>
      )}

      <div className="booking-layout">
        {/* LEFT COLUMN: Main Configuration */}
        <div className="booking-main pb-4">
          <div className="card">
            <div className="card-header pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>1. Event Details</h3>
            </div>
            <div className="event-details-grid grid gap-5">
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Campus Resource</label>
                <select name="resourceId" value={formData.resourceId} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                  <option value="" disabled>Select a resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc' }} />
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Expected Attendees</label>
                <input type="number" min="1" name="expectedAttendees" value={formData.expectedAttendees} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc' }} />
              </div>
            </div>
            {selectedResource && formData.expectedAttendees > selectedResource.capacity && (
               <div style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠</span> Exceeds resource capacity of {selectedResource.capacity}!
               </div>
            )}
          </div>

          <div className="card">
            <div className="card-header pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>2. Timeline Availability</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Click your start time, then click your end time to reserve the continuous blocks.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full" style={{ background: '#ecfdf5', border: '1px solid #10b981' }}></span> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full" style={{ background: '#fef3c7', border: '1px solid #f59e0b' }}></span> Booked</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full" style={{ background: 'var(--secondary)' }}></span> Selected</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full" style={{ background: '#f3f4f6', border: '1px solid #d1d5db' }}></span> Maintenance</span>
            </div>
            
            {!formData.resourceId || !formData.date ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--surface-alt)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }}>📅</div>
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Select a Date & Resource</h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Choose your desired resource and date above to view availability.</p>
              </div>
            ) : loadingSlots ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px' }}>
                <p style={{ color: 'var(--muted)', fontWeight: 500 }}>Scanning schedules...</p>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#fffbeb', borderRadius: '16px', border: '1px dashed #fcd34d' }}>
                <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>⛱️</div>
                <h4 style={{ color: '#b45309', marginBottom: '0.5rem' }}>No Schedule Published</h4>
                <p style={{ color: '#d97706', fontSize: '0.9rem' }}>There are no operating hours available for this date. It may be a holiday.</p>
              </div>
            ) : (
              <div className="timeline-grid">
                {slots.map(slot => {
                  const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);
                  
                  let stateClass = '';
                  let icon = '';
                  let tooltip = '';
                  
                  if (slot.state === 'BOOKED') {
                    stateClass = 'timeline-slot-booked';
                    icon = '🔒';
                    tooltip = 'Already booked';
                  } else if (slot.state === 'UNAVAILABLE') {
                    stateClass = 'timeline-slot-unavailable';
                    icon = '⚠';
                    tooltip = 'Under maintenance or unavailable';
                  } else if (isSelected) {
                    stateClass = 'timeline-slot-selected';
                    icon = '✔';
                    tooltip = 'Selected for booking';
                  } else {
                    stateClass = 'timeline-slot-available';
                    icon = '🕘';
                    tooltip = 'Available - Click to select';
                  }

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={slot.state !== 'AVAILABLE'}
                      onClick={() => toggleSlot(slot)}
                      className={`timeline-slot ${stateClass}`}
                      title={tooltip}
                    >
                      <div className="slot-time">{slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}</div>
                      <div className="slot-icon">{icon}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>3. Purpose of Booking</h3>
            </div>
            <div className="grid gap-4">
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Primary Purpose</label>
                <select name="purpose" value={formData.purpose} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc' }}>
                  <option value="Meeting">Meeting</option>
                  <option value="Lecture">Lecture</option>
                  <option value="Event">Event</option>
                  <option value="Exam">Exam</option>
                  <option value="Study Group">Study Group</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Additional Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows="2"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any specific setup requirements or operational details..."
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--secondary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Summary Panel */}
        <div className="booking-sidebar">
          <div className="card" style={{ position: 'sticky', top: '1.5rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#eef2ff', padding: '0.4rem', borderRadius: '8px', color: 'var(--accent)' }}>📋</span> 
              Booking Summary
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Resource</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{selectedResource ? selectedResource.name : '-'}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Location</span>
                <strong style={{ textAlign: 'right' }}>{selectedResource ? selectedResource.location : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Date</span>
                <strong>{formData.date ? new Date(formData.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Time</span>
                <strong>{selectedSlots.length > 0 ? `${formData.startTime.substring(0, 5)} - ${formData.endTime.substring(0, 5)}` : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Duration</span>
                <strong>{selectedSlots.length > 0 ? `${selectedSlots.length} Hour(s)` : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Attendees</span>
                <strong>{formData.expectedAttendees}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fffbeb', borderRadius: '8px', border: '1px dashed #fcd34d' }}>
                <span style={{ color: '#b45309', fontSize: '0.85rem', fontWeight: 600 }}>Status</span>
                <span className="badge badge-pending">Pending Approval</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary" 
                disabled={loading || selectedSlots.length === 0 || (selectedResource && formData.expectedAttendees > selectedResource.capacity)}
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', borderRadius: '12px', display: 'flex', justifyContent: 'center', boxShadow: 'var(--shadow-md)' }}
              >
                {loading ? 'Submitting...' : 'Confirm Reservation'}
              </button>
              
              <button 
                type="button"
                onClick={handleReset} 
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer' }}
                onMouseOver={(e) => { e.target.style.background = '#f8fafc'; e.target.style.color = 'var(--text)' }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--muted)' }}
              >
                Reset Configuration
              </button>
            </div>
            
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1.25rem' }}>
              By confirming, you agree to the campus resource fair use policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
