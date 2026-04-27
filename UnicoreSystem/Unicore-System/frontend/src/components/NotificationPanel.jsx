import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellRing, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Info, 
  Calendar, 
  Wrench, 
  UserPlus, 
  AlertTriangle,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { api } from '../services/api';

const NotificationPanel = ({ userData, unreadCount, setUnreadCount }) => {
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all, unread, bookings, tickets, system

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.getUserNotifications();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (activeTab === 'unread') return !n.isRead;
            if (activeTab === 'bookings') return n.referenceType === 'BOOKING';
            if (activeTab === 'tickets') return n.referenceType === 'TICKET';
            if (activeTab === 'system') return n.referenceType === 'SYSTEM' || n.referenceType === 'USER' || n.referenceType === 'RESOURCE';
            return true;
        });
    }, [notifications, activeTab]);

    const handleNotificationClick = async (notification) => {
        // Mark as read locally first for immediate feedback
        if (!notification.isRead) {
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            try {
                await api.markNotificationAsRead(notification.id);
            } catch (err) {
                console.error('Failed to mark as read on server:', err);
            }
        }
        
        setIsOpen(false);

        // Intelligent Navigation based on referenceType and referenceId
        const refType = notification.referenceType;
        const refId = notification.referenceId;

        switch (refType) {
            case 'BOOKING':
                // Check for Cancellation Request specifically
                if (userData.role === 'ADMIN' && (notification.type === 'BOOKING_CANCELLATION_REQUEST' || notification.title === 'Cancellation Request')) {
                    navigate('/admin/cancellations');
                } else if (userData.role === 'ADMIN') {
                    navigate('/admin/approvals');
                } else {
                    navigate('/history');
                }
                break;
            case 'TICKET':
                if (refId) {
                    navigate(`/tickets/${refId}`);
                } else {
                    navigate('/tickets');
                }
                break;
            case 'RESOURCE':
                if (refId) {
                    navigate(`/resources/${refId}`);
                } else {
                    navigate('/resources');
                }
                break;
            case 'USER':
                if (userData.role === 'ADMIN') {
                    navigate('/admin/users');
                }
                break;
            default:
                // If it's just a general system notification or unknown type
                if (notification.type === 'NEW_USER_REGISTERED' && userData.role === 'ADMIN') {
                    navigate('/admin/users');
                }
                // Don't navigate anywhere special for generic info
                break;
        }
    };

    const handleMarkAllRead = async () => {
        // Optimistic UI update: mark all as read immediately in the frontend
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await api.markAllNotificationsAsRead();
        } catch (err) {
            console.error('Failed to mark all as read on server:', err);
            // Optionally reload if it fails to ensure consistency
            loadNotifications();
        }
    };

    const getIcon = (type) => {
        if (type.includes('APPROVED') || type.includes('SUCCESS') || type.includes('RESOLVED')) return <CheckCircle size={18} className="text-success" />;
        if (type.includes('REJECTED') || type.includes('CANCELLED') || type.includes('ALERT')) return <XCircle size={18} className="text-danger" />;
        if (type.includes('PENDING') || type.includes('CREATED') || type.includes('REQUEST')) return <Clock size={18} style={{ color: 'var(--warning)' }} />;
        if (type.includes('URGENT')) return <AlertTriangle size={18} className="text-danger" />;
        if (type.includes('USER')) return <UserPlus size={18} style={{ color: 'var(--secondary)' }} />;
        if (type.includes('RESOURCE')) return <Wrench size={18} style={{ color: 'var(--primary)' }} />;
        return <Info size={18} className="text-primary" />;
    };

    const formatTimestamp = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) {
            if (date.getDate() === now.getDate()) return `${diffHours}h ago`;
            return 'Yesterday';
        }
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <div ref={panelRef} className="notification-wrapper">
            <button 
                className="bell-trigger" 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle notifications"
            >
                <BellRing size={22} color={isOpen ? 'var(--primary)' : 'var(--text)'} />
                {unreadCount > 0 && (
                    <span className="unread-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel animate-slide-up">
                    <div className="panel-header">
                        <div className="flex justify-between items-center w-full mb-3">
                            <h3 style={{ margin: 0 }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button className="text-btn" onClick={handleMarkAllRead}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        
                        <div className="tab-row">
                            {['all', 'unread', 'bookings', 'tickets', 'system'].map(tab => (
                                <button 
                                    key={tab}
                                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="panel-body">
                        {loading && notifications.length === 0 ? (
                            <div className="panel-state">Loading alerts...</div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="panel-state">
                                <Info size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                <p>No {activeTab !== 'all' ? activeTab : ''} notifications found.</p>
                            </div>
                        ) : (
                            filteredNotifications.map(n => (
                                <div 
                                    key={n.id} 
                                    className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="item-icon">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="item-content">
                                        <div className="item-header">
                                            <span className="item-title">{n.title}</span>
                                            <span className="item-time">{formatTimestamp(n.createdAt)}</span>
                                        </div>
                                        <p className="item-msg">{n.message}</p>
                                        <div className="item-footer">
                                            <span className="type-tag">{n.referenceType.toLowerCase()}</span>
                                            {!n.isRead && <span className="unread-dot"></span>}
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="item-arrow" />
                                </div>
                            ))
                        )}
                    </div>

                    <div className="panel-footer">
                        <button className="view-all-btn" onClick={() => setIsOpen(false)}>
                            Close Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
