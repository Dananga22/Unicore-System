import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const TicketForm = ({ userData }) => {
    const { id } = useParams();
    const isEditMode = !!id;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(isEditMode);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [resources, setResources] = useState([]);
    const [imageFiles, setImageFiles] = useState([]); // Array of {file, preview}
    const [formData, setFormData] = useState({
        resourceId: '',
        location: '',
        category: 'FACILITY_MAINTENANCE',
        priority: 'LOW',
        description: '',
        contactDetails: '',
    });

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await api.getResources();
                setResources(data.filter((resource) => resource.status === 'ACTIVE'));
            } catch (err) {
                setError(err.message);
            }
        };

        const fetchTicket = async () => {
            if (!isEditMode) return;
            try {
                const ticketData = await api.getTicketById(id);
                
                // Security & Status check
                if (ticketData.reportedById !== userData?.id && userData?.role !== 'ADMIN') {
                    navigate('/tickets');
                    return;
                }
                if (ticketData.status !== 'OPEN') {
                    navigate(`/tickets/${id}`);
                    return;
                }

                setFormData({
                    resourceId: ticketData.resourceId || '',
                    location: ticketData.location || '',
                    category: ticketData.category,
                    priority: ticketData.priority,
                    description: ticketData.description,
                    contactDetails: ticketData.contactDetails || '',
                });
            } catch (err) {
                setError('Failed to load ticket for editing: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
        fetchTicket();
    }, [id, isEditMode, userData?.id]);

    useEffect(() => {
        return () => {
            imageFiles.forEach(img => URL.revokeObjectURL(img.preview));
        };
    }, [imageFiles]);

    const validateForm = () => {
        const errors = {};
        
        const location = formData.location.trim();
        const description = formData.description.trim();
        const contactDetails = formData.contactDetails.trim();

        if (!location) {
            errors.location = 'Location is required';
        } else if (location.length < 3) {
            errors.location = 'Location must be at least 3 characters';
        } else if (!formData.resourceId && location.length < 5) {
            errors.location = 'Please provide a more specific location for general issues';
        }

        if (!description) {
            errors.description = 'Description is required';
        } else if (description.length < 10) {
            errors.description = 'Description must be at least 10 characters';
        } else if (description.length > 1000) {
            errors.description = 'Description must not exceed 1000 characters';
        }

        if (contactDetails) {
            if (contactDetails.length > 150) {
                errors.contactDetails = 'Contact details must be under 150 characters';
            } else if (contactDetails.includes('@') && !contactDetails.match(/^[A-Za-z0-9+_.-]+@(.+)$/)) {
                errors.contactDetails = 'Invalid email format';
            }
        }

        if (!formData.category) errors.category = 'Category is required';
        if (!formData.priority) errors.priority = 'Priority is required';

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const selectedResource = useMemo(
        () => resources.find((resource) => resource.id === Number(formData.resourceId)),
        [resources, formData.resourceId]
    );

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        if (imageFiles.length + selectedFiles.length > 3) {
            setError('A maximum of 3 attachments is allowed per ticket.');
            return;
        }

        const validFiles = [];
        for (const file of selectedFiles) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError('Only PNG, JPG, and WEBP files are allowed.');
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError('Each attachment must be 5MB or smaller.');
                return;
            }
            validFiles.push({
                file,
                preview: URL.createObjectURL(file)
            });
        }

        setError('');
        setImageFiles([...imageFiles, ...validFiles]);
    };

    const removeAttachment = (index) => {
        const newFiles = [...imageFiles];
        URL.revokeObjectURL(newFiles[index].preview);
        newFiles.splice(index, 1);
        setImageFiles(newFiles);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        
        if (!validateForm()) {
            setError('Please correct the errors in the form.');
            return;
        }

        setLoading(true);
        setFieldErrors({});

        try {
            const payload = { 
                ...formData,
                location: formData.location.trim(),
                description: formData.description.trim(),
                contactDetails: formData.contactDetails.trim()
            };

            if (!payload.resourceId) {
                delete payload.resourceId;
            } else {
                payload.resourceId = Number(payload.resourceId);
            }

            let ticketId = id;
            if (isEditMode) {
                await api.updateTicket(id, payload);
            } else {
                const newTicket = await api.createTicket(payload);
                ticketId = newTicket.id;
            }

            // Upload all attachments
            if (imageFiles.length > 0 && ticketId) {
                try {
                    await Promise.all(imageFiles.map(img => api.uploadTicketImage(ticketId, img.file)));
                } catch (uploadErr) {
                    console.error('Upload failed:', uploadErr);
                    // Don't error out completely, ticket is already saved
                }
            }

            navigate(`/tickets/${ticketId}`, { state: { success: true, message: isEditMode ? 'Ticket updated successfully!' : 'Ticket created successfully!' } });
        } catch (err) {
            if (err.status === 403) {
                setError('You do not have permission to perform this action.');
            } else if (err.status === 400 || err.fieldErrors) {
                setError(err.message || 'Validation failed. Please check the fields below.');
                if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            } else {
                setError('Service is temporarily unavailable. Your ticket may not have been saved.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode && !formData.description) {
        return <div className="text-center p-12 text-muted">Initialising edit workspace...</div>;
    }

    const isFormValid = formData.location.trim().length >= 3 && formData.description.trim().length >= 10 && !!formData.category && !!formData.priority;

    return (
        <div className="card animate-fade" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div className="card-header">
                <div>
                    <h2>{isEditMode ? 'Edit Ticket' : 'Create Ticket'}</h2>
                    <p>{isEditMode ? `Updating Ticket #${id}. Changes are only allowed while the status is OPEN.` : 'Report a campus issue with clear categorization and required validation.'}</p>
                </div>
            </div>

            {error && (
                <div className="badge badge-rejected" style={{ justifySelf: 'start', marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: 'auto', borderRadius: '12px' }}>
                    <div className="font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label className={fieldErrors.category ? 'text-danger' : ''}>Category</label>
                        <select 
                            className={fieldErrors.category ? 'input-invalid' : ''}
                            value={formData.category} 
                            onChange={(e) => handleInputChange('category', e.target.value)}
                        >
                            <option value="FACILITY_MAINTENANCE">Facility Maintenance</option>
                            <option value="IT_SUPPORT">IT Support</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="EQUIPMENT_REPAIR">Equipment Repair</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
                    </div>
                    <div className="form-group">
                        <label className={fieldErrors.priority ? 'text-danger' : ''}>Priority</label>
                        <select 
                            className={fieldErrors.priority ? 'input-invalid' : ''}
                            value={formData.priority} 
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                        {fieldErrors.priority && <span className="field-error">{fieldErrors.priority}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>Related Resource (Optional)</label>
                    <select value={formData.resourceId} onChange={(e) => {
                        const resId = e.target.value;
                        const resource = resources.find(r => r.id === Number(resId));
                        setFormData({ 
                            ...formData, 
                            resourceId: resId, 
                            location: resource?.location || formData.location 
                        });
                    }}>
                        <option value="">General campus issue</option>
                        {resources.map((resource) => (
                            <option key={resource.id} value={resource.id}>{resource.name} ({resource.location})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className={fieldErrors.location ? 'text-danger' : ''}>Location</label>
                    <input 
                        className={fieldErrors.location ? 'input-invalid' : ''}
                        value={formData.location} 
                        onChange={(e) => handleInputChange('location', e.target.value)} 
                        placeholder="e.g. Building B, Level 3, Room 302"
                    />
                    {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
                </div>

                <div className="form-group">
                    <label className={fieldErrors.description ? 'text-danger' : ''}>Description</label>
                    <textarea 
                        className={fieldErrors.description ? 'input-invalid' : ''}
                        rows="5" 
                        value={formData.description} 
                        onChange={(e) => handleInputChange('description', e.target.value)} 
                        placeholder="Please describe the issue in at least 10 characters..."
                    />
                    {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
                </div>

                <div className="grid grid-cols-1">
                    <div className="form-group">
                        <label>Attachments (Max 3, Image only)</label>
                        <div className="flex gap-4 flex-wrap mt-2">
                             {imageFiles.map((img, index) => (
                                <div key={index} className="attachment-preview" style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
                                    <img src={img.preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button type="button" className="attachment-remove" onClick={() => removeAttachment(index)} style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                             ))}
                             {imageFiles.length < 3 && (
                                <label className="upload-box" style={{ width: '100px', height: '100px', border: '2px dashed var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', background: '#f8fafc' }}>
                                    <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <ImagePlus size={24} color="#64748b" />
                                    <span style={{ fontSize: '0.7rem', marginTop: '6px', color: '#64748b', fontWeight: 500 }}>Add Image</span>
                                </label>
                             )}
                        </div>
                    </div>
                    <div className="form-group mt-4">
                        <label className={fieldErrors.contactDetails ? 'text-danger' : ''}>Contact Details (Optional)</label>
                        <input 
                            className={fieldErrors.contactDetails ? 'input-invalid' : ''}
                            value={formData.contactDetails} 
                            onChange={(e) => handleInputChange('contactDetails', e.target.value)} 
                            placeholder="Phone extension or alternate email" 
                        />
                        {fieldErrors.contactDetails && <span className="field-error">{fieldErrors.contactDetails}</span>}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem 2rem' }} disabled={loading || !isFormValid}>
                        {loading ? 'Processing...' : (isEditMode ? 'Update Ticket' : 'Submit Ticket')}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.9rem 2rem' }} onClick={() => navigate(isEditMode ? `/tickets/${id}` : '/tickets')}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketForm;
