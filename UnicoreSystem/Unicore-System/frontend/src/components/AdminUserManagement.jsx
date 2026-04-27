import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Breadcrumbs from './Breadcrumbs';
import { Edit2, Check, X, Trash2, User as UserIcon } from 'lucide-react';
import { API_ORIGIN } from '../services/api';

const AdminUserManagement = ({ userData }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [sortOrder, setSortOrder] = useState('newest');

    useEffect(() => {
        if (userData?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [userData]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getAllUsers({ search });
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            await api.updateUserRole(id, newRole);
            fetchUsers(); // refresh
        } catch (err) {
            alert('Failed to update role: ' + err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.updateUserStatus(id, newStatus);
            fetchUsers(); // refresh
        } catch (err) {
            alert('Failed to update status: ' + err.message);
        }
    };

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setEditForm({ name: user.name, email: user.email });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditForm({ name: '', email: '' });
    };

    const handleSaveEdit = async (id) => {
        try {
            await api.updateUserInfo(id, editForm);
            setEditingUserId(null);
            fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (id, name) => {
        const actingUserRole = userData?.role;
        if (actingUserRole !== 'ADMIN') return;
        
        if (id === userData.id) {
            alert('You cannot delete your own account.');
            return;
        }

        if (!window.confirm(`Are you sure you want to permanently delete user "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert('Failed to delete user: ' + err.message);
        }
    };

    if (userData?.role !== 'ADMIN') {
        return <div className="card error-message">Access Denied. Admin privileges required.</div>;
    }

    return (
    <div className="animate-fade">
      <Breadcrumbs 
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'User Access' }
        ]} 
      />
      <div className="card">
            <div className="card-header flex justify-between items-center mb-6">
                <h2 style={{ margin: 0 }}>System Users</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)' }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        style={{ maxWidth: '250px' }}
                    />
                    <button className="btn btn-secondary" onClick={fetchUsers}>Search</button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="table-container">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...users].sort((a, b) => {
                                const dateA = new Date(a.createdAt).getTime();
                                const dateB = new Date(b.createdAt).getTime();
                                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                            }).map(user => (
                                <tr key={user.id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        {user.picture ? (
                                            <img 
                                                src={user.picture.startsWith('http') ? user.picture : `${API_ORIGIN}${user.picture}`} 
                                                alt="" 
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div style={{ 
                                            width: '32px', 
                                            height: '32px', 
                                            borderRadius: '50%', 
                                            background: 'var(--surface-alt)', 
                                            color: 'var(--primary)', 
                                            display: user.picture ? 'none' : 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 700,
                                            flexShrink: 0,
                                            border: '1px solid var(--border)'
                                        }}>
                                            {user.name.charAt(0)}
                                        </div>
                                        {editingUserId === user.id ? (
                                            <input 
                                                type="text" 
                                                value={editForm.name} 
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                style={{ width: '100%', padding: '4px 8px', margin: 0 }}
                                                autoFocus
                                            />
                                        ) : (
                                            user.name
                                        )}
                                    </td>
                                    <td>
                                        {editingUserId === user.id ? (
                                            <input 
                                                type="email" 
                                                value={editForm.email} 
                                                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                                style={{ width: '100%', padding: '4px 8px', margin: 0 }}
                                            />
                                        ) : (
                                            user.email
                                        )}
                                    </td>
                                    <td>
                                        <select 
                                            value={user.role} 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={user.id === userData.id} // prevent self-demotion
                                            style={{ padding: '4px 8px', width: 'auto' }}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="TECHNICIAN">TECHNICIAN</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="status-select-wrapper">
                                            <select 
                                                value={user.status} 
                                                onChange={(e) => handleStatusChange(user.id, e.target.value)}
                                                disabled={user.id === userData.id}
                                                className={`badge badge-${user.status.toLowerCase()}`}
                                                style={{ 
                                                    padding: '0.4rem 0.8rem', 
                                                    border: 'none', 
                                                    cursor: user.id === userData.id ? 'default' : 'pointer',
                                                    width: 'auto',
                                                    minWidth: '100px',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <option value="ACTIVE">ACTIVE</option>
                                                <option value="INACTIVE">INACTIVE</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {editingUserId === user.id ? (
                                                <>
                                                    <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleSaveEdit(user.id)} title="Save"><Check size={16} className="text-primary" /></button>
                                                    <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={handleCancelEdit} title="Cancel"><X size={16} className="text-muted" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="btn btn-secondary" 
                                                        style={{ padding: '6px' }}
                                                        onClick={() => handleEditClick(user)}
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={16} className="text-muted" />
                                                    </button>
                                                    {user.status === 'INACTIVE' && user.id !== userData.id && (
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ padding: '6px' }}
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                            title="Delete Inactive User"
                                                        >
                                                            <Trash2 size={16} className="text-danger" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
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
    );
};

export default AdminUserManagement;
