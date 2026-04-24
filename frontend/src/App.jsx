import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldCheck,
  UserCircle2,
  Wrench,
} from 'lucide-react';
import BookingForm from './components/BookingForm';
import BookingHistory from './components/BookingHistory';
import AdminDashboard from './components/AdminDashboard';
import ResourceListing from './components/ResourceListing';
import ResourceForm from './components/ResourceForm';
import ResourceDetails from './components/ResourceDetails';
import Login from './components/Login';
import Signup from './components/Signup';
import Oauth2RedirectHandler from './components/Oauth2RedirectHandler';
import UserProfile from './components/UserProfile';
import AdminUserManagement from './components/AdminUserManagement';
import AdminBookingApprovals from './components/AdminBookingApprovals';
import UserDashboard from './components/UserDashboard';
import LandingPage from './components/LandingPage';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetails from './components/TicketDetails';
import NotificationPanel from './components/NotificationPanel';
import SupportChatbot from './components/SupportChatbot';
import { api } from './services/api';
import './index.css';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/resources', label: 'Facilities & Assets', icon: BookOpen, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/admin/approvals', label: 'Booking Approvals', icon: ClipboardList, roles: ['ADMIN'] },
  { to: '/history', label: 'My Bookings', icon: CalendarDays, roles: ['USER', 'TECHNICIAN'] },
  { to: '/tickets', label: 'Tickets', icon: Wrench, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
  { to: '/admin/users', label: 'User Access', icon: ShieldCheck, roles: ['ADMIN'] },
  { to: '/resources/new', label: 'Add Resource', icon: Settings2, roles: ['ADMIN'] },
  { to: '/profile', label: 'Profile', icon: UserCircle2, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
];

const getDefaultRoute = (user) => {
  if (!user) return '/';
  return '/dashboard';
};

function DashboardRouter({ userData }) {
  if (userData.role === 'ADMIN') {
    return <AdminDashboard userData={userData} />;
  }
  return <UserDashboard userData={userData} />;
}

function ProtectedRoute({ userData, roles, children }) {
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(userData.role)) {
    return <Navigate to={getDefaultRoute(userData)} replace />;
  }

  return children;
}

function AppShell({ userData, onLogout, unreadCount, setUnreadCount, children }) {
  const location = useLocation();
  const allowedMenuItems = useMemo(
    () => menuItems.filter((item) => item.roles.includes(userData.role)),
    [userData.role]
  );

  const pageTitle = allowedMenuItems.find((item) => location.pathname.startsWith(item.to))?.label || 'UniCore Dashboard';

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">U</div>
          <div>
            <strong>UniCore System</strong>
            <span>Smart Campus Operations Hub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {allowedMenuItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to === '/admin' || to === '/profile'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userData.name?.charAt(0)}</div>
            <div>
              <strong>{userData.name}</strong>
              <span>{userData.role}</span>
            </div>
          </div>
          <button className="btn btn-secondary btn-block" onClick={onLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">University Operations</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            <NotificationPanel 
              userData={userData} 
              unreadCount={unreadCount} 
              setUnreadCount={setUnreadCount} 
            />
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
        <SupportChatbot userData={userData} />
      </div>
    </div>
  );
}

function AppRoutes({ userData, setUserData, loading, handleLogout, unreadCount, setUnreadCount }) {
  if (loading) {
    return <div className="page-state">Loading workspace...</div>;
  }

  if (!userData) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setUserData={setUserData} />} />
        <Route path="/signup" element={<Signup setUserData={setUserData} />} />
        <Route path="/oauth2/redirect" element={<Oauth2RedirectHandler setUserData={setUserData} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell 
      userData={userData} 
      onLogout={handleLogout} 
      unreadCount={unreadCount} 
      setUnreadCount={setUnreadCount}
    >
      <Routes>
        <Route path="/" element={<Navigate to={getDefaultRoute(userData)} replace />} />
        <Route path="/login" element={<Navigate to={getDefaultRoute(userData)} replace />} />
        <Route path="/signup" element={<Navigate to={getDefaultRoute(userData)} replace />} />
        <Route path="/oauth2/redirect" element={<Oauth2RedirectHandler setUserData={setUserData} />} />

        <Route path="/dashboard" element={<ProtectedRoute userData={userData}><DashboardRouter userData={userData} /></ProtectedRoute>} />
        <Route path="/bookings/new" element={<ProtectedRoute userData={userData} roles={['USER']}><BookingForm userData={userData} /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute userData={userData} roles={['USER', 'TECHNICIAN']}><BookingHistory userData={userData} /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute userData={userData}><ResourceListing userData={userData} /></ProtectedRoute>} />
        <Route path="/resources/:id" element={<ProtectedRoute userData={userData}><ResourceDetails userData={userData} /></ProtectedRoute>} />
        <Route path="/resources/new" element={<ProtectedRoute userData={userData} roles={['ADMIN']}><ResourceForm userData={userData} /></ProtectedRoute>} />
        <Route path="/resources/edit/:id" element={<ProtectedRoute userData={userData} roles={['ADMIN']}><ResourceForm userData={userData} /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute userData={userData}><TicketList userData={userData} /></ProtectedRoute>} />
        <Route path="/tickets/new" element={<ProtectedRoute userData={userData}><TicketForm userData={userData} /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute userData={userData}><TicketDetails userData={userData} /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute userData={userData}><UserProfile userData={userData} setUserData={setUserData} /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute userData={userData} roles={['ADMIN']}><AdminBookingApprovals userData={userData} /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute userData={userData} roles={['ADMIN']}><AdminUserManagement userData={userData} /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to={getDefaultRoute(userData)} replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const count = await api.getNotificationUnreadCount();
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await api.getCurrentUser();
        setUserData(user);
        fetchUnreadCount();
      } catch (err) {
        localStorage.removeItem('accessToken');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Auto-refresh unread count periodically
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUserData(null);
  };

  return (
    <Router>
      <AppRoutes
        userData={userData}
        setUserData={setUserData}
        loading={loading}
        handleLogout={handleLogout}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
      />
    </Router>
  );
}

export default App;
