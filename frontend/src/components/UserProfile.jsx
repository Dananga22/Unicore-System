import React, { useState } from 'react';
import { api } from '../services/api';

const UserProfile = ({ userData, setUserData }) => {
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        email: userData?.email || '',
    });
    const [status, setStatus] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const updatedUser = await api.updateCurrentUser(formData);
            setUserData(updatedUser);
            setStatus('Profile updated successfully.');
        } catch (err) {
            setStatus(err.message);
        }
    };

    if (!userData) return <div className="card">Loading profile...</div>;

    return (
        <div className="grid md:grid-cols-2 gap-6 animate-fade">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2>Profile</h2>
                        <p>Manage identity details and review your current access role.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="card" style={{ padding: '1rem' }}>
                        <strong>{userData.name}</strong>
                        <p>{userData.email}</p>
                        <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                            <span className="badge badge-active">{userData.role}</span>
                            <span className={`badge badge-${userData.status.toLowerCase()}`}>{userData.status}</span>
                        </div>
                    </div>
                    <div>
                        <strong>Provider</strong>
                        <p>{userData.provider || 'local'}</p>
                    </div>
                    <div>
                        <strong>Member Since</strong>
                        <p>{new Date(userData.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <h2>Update Details</h2>
                        <p>Maintain accurate account information for notifications and approvals.</p>
                    </div>
                </div>

                {status && <div className="badge badge-approved" style={{ justifySelf: 'start', marginBottom: '1rem' }}>{status}</div>}

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="form-group">
                        <label>Name</label>
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary">Save Profile</button>
                </form>
            </div>
        </div>
    );
};

export default UserProfile;
