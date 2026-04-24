import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const ResourceThumbnail = ({ url, name }) => {
    const [isError, setIsError] = useState(false);
    const initials = name.charAt(0).toUpperCase();

    return (
        <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '16px', 
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #eaf2ff, #f0f7ff)', 
            display: 'grid', 
            placeItems: 'center', 
            color: 'var(--primary)', 
            fontWeight: 800,
            border: '1px solid var(--border)',
            flexShrink: 0
        }}>
            {url && !isError ? (
                <img 
                    src={`${api.API_ORIGIN}${url}`} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    onError={() => setIsError(true)}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
};

const ResourceListing = ({ userData }) => {
    const [resources, setResources] = useState([]);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        location: '',
        search: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isAdmin = userData?.role === 'ADMIN';

    useEffect(() => {
        loadResources();
    }, [filters]);

    const loadResources = async () => {
        try {
            setLoading(true);
            setError('');
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
            const data = await api.getResources(cleanFilters);
            setResources(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const hasFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await api.deleteResource(deleteTarget.id);
            setDeleteTarget(null);
            loadResources();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="card animate-fade">
                <div className="card-header">
                    <div>
                        <h2>Facilities & Assets Catalogue</h2>
                        <p>Modern admin view for campus spaces, labs, and operational equipment.</p>
                    </div>
                    {isAdmin && (
                        <Link to="/resources/new" className="btn btn-primary">
                            Add Resource
                        </Link>
                    )}
                </div>

                {error && <div className="badge badge-rejected" style={{ justifySelf: 'start', marginBottom: '1rem' }}>{error}</div>}

                <div className="resource-filters">
                    <label className="search-input">
                        <Search size={16} />
                        <input
                            name="search"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Search resources"
                        />
                    </label>
                    <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                        <option value="">All Types</option>
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Laboratory</option>
                        <option value="MEETING_ROOM">Meeting Room</option>
                        <option value="EQUIPMENT">Equipment</option>
                    </select>
                    <input
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        placeholder="Filter by location"
                    />
                    <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                    </select>
                </div>

                <div className="table-container">
                    {loading ? (
                        <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                            <div className="flex flex-col items-center gap-3">
                                <span>Loading facilities catalogue...</span>
                            </div>
                        </div>
                    ) : resources.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', background: '#f8fafc' }}>
                            <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                                <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No Resources Available</h3>
                                <p>
                                    {hasFilters 
                                        ? 'No facilities match your current search criteria. Try adjusting your filters.' 
                                        : 'The facilities catalogue is currently empty. Start by adding a new campus resource.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th className="res-col-main">Resource</th>
                                    <th className="res-col-type">Type</th>
                                    <th className="res-col-loc">Location</th>
                                    <th className="res-col-cap">Capacity</th>
                                    <th className="res-col-status">Status</th>
                                    <th className="res-col-actions">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map((resource) => (
                                    <tr key={resource.id}>
                                        <td className="res-col-main">
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <ResourceThumbnail url={resource.imageUrl} name={resource.name} />
                                                <div style={{ maxWidth: '200px', minWidth: 0 }}>
                                                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.name}</strong>
                                                    <p style={{ 
                                                        fontSize: '0.82rem', 
                                                        whiteSpace: 'nowrap', 
                                                        overflow: 'hidden', 
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {resource.description || 'No description provided.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="res-col-type">
                                            <span style={{ fontSize: '0.85rem' }}>{resource.type.replaceAll('_', ' ')}</span>
                                        </td>
                                        <td className="res-col-loc">{resource.location}</td>
                                        <td className="res-col-cap">
                                            <strong>{resource.capacity}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: '0.35rem' }}>units</span>
                                        </td>
                                        <td className="res-col-status">
                                            <span className={`status-pill-large ${resource.status.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}>
                                                {resource.status.replaceAll('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="res-col-actions">
                                            <div className="flex gap-2">
                                                <Link to={`/resources/${resource.id}`} className="btn btn-secondary"><Eye size={16} /></Link>
                                                {isAdmin && (
                                                    <>
                                                        <Link to={`/resources/edit/${resource.id}`} className="btn btn-secondary"><Pencil size={16} /></Link>
                                                        <button onClick={() => setDeleteTarget(resource)} className="btn btn-danger-outline"><Trash2 size={16} /></button>
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

            {deleteTarget && (
                <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
                    <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                        <div className="card-header">
                            <div>
                                <h3>Delete Resource</h3>
                                <p>This will permanently remove the resource if it is not referenced elsewhere.</p>
                            </div>
                        </div>
                        <div className="summary-block" style={{ marginBottom: '1rem' }}>
                            <span>Selected Resource</span>
                            <strong>{deleteTarget.name}</strong>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn btn-danger-outline" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ResourceListing;
