import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

const validate = (formData) => {
    const errors = {};
    if (!formData.name.trim()) {
        errors.name = 'Resource name is required';
    } else if (formData.name.trim().length < 3) {
        errors.name = 'Resource name must be at least 3 characters long';
    }

    if (!formData.type) errors.type = 'Resource type is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    
    if (!formData.capacity) {
        errors.capacity = 'Capacity is required';
    } else if (Number(formData.capacity) <= 0) {
        errors.capacity = 'Capacity must be greater than 0';
    }

    if (!formData.description.trim()) {
        errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters long';
    }

    return errors;
};

const ResourceForm = ({ userData }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [touched, setTouched] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        type: 'LECTURE_HALL',
        capacity: '',
        location: '',
        status: 'ACTIVE',
        description: '',
    });

    useEffect(() => {
        if (userData?.role !== 'ADMIN') {
            navigate('/resources');
        }
    }, [userData, navigate]);

    useEffect(() => {
        if (!isEditing) return;

        const fetchResource = async () => {
            try {
                setLoading(true);
                const data = await api.getResourceById(id);
                setFormData({
                    name: data.name,
                    type: data.type,
                    capacity: String(data.capacity || ''),
                    location: data.location,
                    status: data.status,
                    description: data.description || '',
                });
            } catch (err) {
                setError(`Failed to load resource: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchResource();
    }, [id, isEditing]);

    const errors = useMemo(() => validate(formData), [formData]);
    const isValid = Object.keys(errors).length === 0;

    const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;

        // Pre-upload validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image (JPEG, PNG, or WEBP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setImageFile(file);
        setError('');
        
        // Create local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setTouched({ 
            name: true, 
            type: true, 
            capacity: true, 
            location: true, 
            description: true 
        });

        if (!isValid) return;

        setSubmitting(true);
        setError('');

        try {
            let resourceId = id;
            const payload = {
                ...formData,
                capacity: Number(formData.capacity),
            };

            if (isEditing) {
                await api.updateResource(id, payload);
            } else {
                const created = await api.createResource(payload);
                resourceId = created.id;
            }

            if (imageFile && resourceId) {
                await api.uploadResourceImage(resourceId, imageFile);
            }

            navigate('/resources');
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const fieldClass = (field) => touched[field] && errors[field] ? 'input-invalid' : '';

    if (loading) return <div className="card">Loading resource...</div>;

    return (
        <div className="card animate-fade" style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div className="card-header">
                <div>
                    <h2>{isEditing ? 'Edit Resource' : 'Add Resource'}</h2>
                    <p>Create and maintain university facilities and assets with validated admin controls.</p>
                </div>
            </div>

            {error && (
                <div className="alert alert-error mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="btn-close" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="form-group">
                    <label className="required-label">Resource Name</label>
                    <input
                        placeholder="e.g. Innovation Hall A"
                        className={fieldClass('name')}
                        value={formData.name}
                        onBlur={() => markTouched('name')}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
                </div>

                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="required-label">Type</label>
                        <select
                            className={fieldClass('type')}
                            value={formData.type}
                            onBlur={() => markTouched('type')}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="LECTURE_HALL">Lecture Hall</option>
                            <option value="LAB">Laboratory</option>
                            <option value="MEETING_ROOM">Meeting Room</option>
                            <option value="EQUIPMENT">Equipment</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="required-label">Capacity</label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Seats or Units"
                            className={fieldClass('capacity')}
                            value={formData.capacity}
                            onBlur={() => markTouched('capacity')}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        />
                        {touched.capacity && errors.capacity && <span className="field-error">{errors.capacity}</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className="required-label">Location</label>
                        <input
                            placeholder="e.g. Block C, 2nd Floor"
                            className={fieldClass('location')}
                            value={formData.location}
                            onBlur={() => markTouched('location')}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                        {touched.location && errors.location && <span className="field-error">{errors.location}</span>}
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                            <option value="ACTIVE">Active</option>
                            <option value="OUT_OF_SERVICE">Out of Service</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="required-label">Description</label>
                    <textarea 
                        rows="4" 
                        placeholder="Provide details about features, equipment available, etc."
                        className={fieldClass('description')}
                        onBlur={() => markTouched('description')}
                        value={formData.description} 
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    />
                    {touched.description && errors.description && <span className="field-error">{errors.description}</span>}
                </div>

                <div className="form-group">
                    <label>Resource Image</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '120px', height: '120px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: '#f8fafc', display: 'grid', placeItems: 'center' }}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', textAlign: 'center', padding: '0.5rem' }}>No Image</div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <input 
                                type="file" 
                                accept="image/png,image/jpeg,image/webp" 
                                onChange={handleImageChange} 
                                style={{ border: 'none', background: 'transparent', padding: 0 }}
                            />
                            <p className="text-muted" style={{ fontSize: '0.75rem' }}>JPEG, PNG, or WEBP. Max size 5MB.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={submitting || !isValid}>
                        {submitting ? 'Saving...' : isEditing ? 'Update Resource' : 'Create Resource'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/resources')}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResourceForm;
