import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package, ShieldCheck, Users } from 'lucide-react';
import { api, API_ORIGIN } from '../services/api';

const ResourceDetails = ({ userData }) => {
    const { id } = useParams();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isAdmin = userData?.role === 'ADMIN';

    useEffect(() => {
        const loadResource = async () => {
            try {
                setLoading(true);
                setResource(await api.getResourceById(id));
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadResource();
    }, [id]);

    if (loading) return <div className="card">Loading resource details...</div>;
    if (error) return <div className="card">{error}</div>;
    if (!resource) return <div className="card">Resource not found.</div>;

    return (
        <div className="grid md:grid-cols-2 gap-6 animate-fade">
            <div className="card">
                <div className="card-header">
                    <div>
                        <h2>{resource.name}</h2>
                        <p>Facilities & Assets details view</p>
                    </div>
                    <span className={`badge badge-${resource.status.toLowerCase()}`}>
                        {resource.status.replaceAll('_', ' ')}
                    </span>
                </div>

                {resource.imageUrl ? (
                    <img
                        src={`${API_ORIGIN}${resource.imageUrl}`}
                        alt={resource.name}
                        style={{ width: '100%', height: '280px', objectFit: 'cover', borderRadius: '22px', marginBottom: '1rem' }}
                    />
                ) : (
                    <div className="card text-center" style={{ padding: '3rem 1rem', marginBottom: '1rem', background: '#eef4ff' }}>
                        No image available
                    </div>
                )}

                <div className="grid gap-4">
                    <div className="summary-block">
                        <span>Description</span>
                        <strong>{resource.description || 'No description provided.'}</strong>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div>
                        <h3>Resource Information</h3>
                        <p>Operational details for admins and coordinators.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="summary-block">
                        <span><Package size={14} /> Type</span>
                        <strong>{resource.type.replaceAll('_', ' ')}</strong>
                    </div>
                    <div className="summary-block">
                        <span><MapPin size={14} /> Location</span>
                        <strong>{resource.location}</strong>
                    </div>
                    <div className="summary-block">
                        <span><Users size={14} /> Capacity</span>
                        <strong>{resource.capacity}</strong>
                    </div>
                    <div className="summary-block">
                        <span><ShieldCheck size={14} /> Created</span>
                        <strong>{new Date(resource.createdAt).toLocaleString()}</strong>
                    </div>
                </div>

                {!isAdmin && resource.status === 'ACTIVE' && (
                    <div className="flex gap-2 mt-6">
                        <Link to="/bookings/new" className="btn btn-primary" style={{ flex: 1 }}>Book This Facility</Link>
                        <Link to="/resources" className="btn btn-secondary">Back to List</Link>
                    </div>
                )}
                {!isAdmin && resource.status !== 'ACTIVE' && (
                    <div className="flex gap-2 mt-6">
                        <button className="btn btn-secondary" disabled style={{ flex: 1 }}>Currently Unavailable</button>
                        <Link to="/resources" className="btn btn-secondary">Back to List</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceDetails;
