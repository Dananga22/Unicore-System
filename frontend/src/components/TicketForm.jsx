import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ImagePlus, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const validate = (formData) => {
    const errors = {};
    if (!formData.category) errors.category = 'Please select a category';
    if (!formData.priority) errors.priority = 'Please select a priority';
    if (!formData.location?.trim()) {
        errors.location = 'Location is required';
    } else if (formData.location.trim().length < 3 || formData.location.trim().length > 50) {
        errors.location = 'Location must be between 3 and 50 characters';
    }

    if (!formData.description?.trim()) {
        errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
        errors.description = 'Description must be at least 10 characters';
    }

    if (formData.contactDetails && formData.contactDetails.trim().length > 0) {
        const contact = formData.contactDetails;
        if (contact.length < 5 || contact.length > 100) {
            errors.contactDetails = 'Contact details must be between 5 and 100 characters';
        } else if (!/^[a-zA-Z0-9\s@+\-\.,()]*$/.test(contact)) {
            errors.contactDetails = 'Contact details contains invalid characters';
        }
    }

    return errors;
};

const TicketForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [resources, setResources] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [formData, setFormData] = useState({
        resourceId: '',
        location: '',
        category: '',
        priority: '',
        description: '',
        contactDetails: '',
    });

    const location = useLocation();
    const editId = new URLSearchParams(location.search).get('edit');
    const isEdit = !!editId;

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const data = await api.getResources();
                setResources(data.filter((resource) => resource.status === 'ACTIVE'));
            } catch (err) {
                setError(err.message);
            }
        };

        fetchResources();
    }, []);

    useEffect(() => {
        if (isEdit) {
            const fetchTicket = async () => {
                try {
                    setLoading(true);
                    const ticket = await api.getTicketById(editId);
                    setFormData({
                        resourceId: ticket.resourceId || '',
                        location: ticket.location || '',
                        category: ticket.category || 'FACILITY_MAINTENANCE',
                        priority: ticket.priority || 'LOW',
                        description: ticket.description || '',
                        contactDetails: ticket.contactDetails || '',
                    });
                } catch (err) {
                    setError('Failed to load ticket for editing');
                } finally {
                    setLoading(false);
                }
            };
            fetchTicket();
        }
    }, [isEdit, editId]);

    useEffect(() => {
        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [previews]);

    const selectedResource = useMemo(
        () => resources.find((resource) => resource.id === Number(formData.resourceId)),
        [resources, formData.resourceId]
    );

    const errors = useMemo(() => validate(formData), [formData]);
    const isValid = Object.keys(errors).length === 0;

    const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldClass = (field) => (touched[field] || Object.keys(fieldErrors).length > 0) && (errors[field] || fieldErrors[field]) ? 'input-invalid' : '';

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        let currentFiles = [...imageFiles];
        let currentPreviews = [...previews];
        let newError = '';

        for (const file of files) {
            if (currentFiles.length >= 3) {
                newError = 'Maximum of 3 images allowed.';
                break;
            }
            if (!ALLOWED_TYPES.includes(file.type)) {
                newError = 'Only PNG, JPG, and WEBP files are allowed.';
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                newError = 'Each image must be 5MB or smaller.';
                continue;
            }

            currentFiles.push(file);
            currentPreviews.push({
                id: Math.random().toString(36).substring(7),
                url: URL.createObjectURL(file)
            });
        }

        setError(newError);
        setImageFiles(currentFiles);
        setPreviews(currentPreviews);
        event.target.value = ''; // Reset input
    };

    const removeAttachment = (index) => {
        const fileToRemove = imageFiles[index];
        const previewToRemove = previews[index];

        if (previewToRemove) {
            URL.revokeObjectURL(previewToRemove.url);
        }

        setImageFiles(imageFiles.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setTouched({ category: true, priority: true, location: true, description: true });
        if (!isValid) return;

        setLoading(true);
        setError('');
        setFieldErrors({});

        try {
            const payload = { ...formData };
            if (!payload.resourceId) {
                delete payload.resourceId;
            } else {
                payload.resourceId = Number(payload.resourceId);
            }

            let ticketId;
            if (isEdit) {
                const updatedTicket = await api.updateTicket(editId, payload);
                ticketId = updatedTicket.id;
            } else {
                const newTicket = await api.createTicket(payload);
                ticketId = newTicket.id;
            }
            
            // Sequential Upload of Attachments (only for new/existing if fresh files added)
            if (imageFiles.length > 0 && ticketId) {
                for (const file of imageFiles) {
                    try {
                        await api.uploadAttachment(newTicket.id, file); // Using uploadAttachment from api.js
                    } catch (uploadErr) {
                        console.error('Failed to upload an image:', uploadErr);
                    }
                }
            }

            navigate(`/tickets/${ticketId}`);
        } catch (err) {
            setError(err.message);
            if (err.fieldErrors) {
                setFieldErrors(err.fieldErrors);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade" style={{ maxWidth: '860px', margin: '0 auto' }}>
            <div className="card-header">
                <div>
                    <h2>{isEdit ? `Edit Ticket #${editId}` : 'Create Ticket'}</h2>
                    <p>{isEdit ? 'Update your maintenance report details below.' : 'Report a campus issue. Select a resource or location, describe the problem, and attach up to 3 images as evidence.'}</p>
                </div>
            </div>

            {error && (
                <div className="badge badge-rejected" style={{ justifySelf: 'start', marginBottom: '1rem', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: 'auto', borderRadius: '12px' }}>
                    <div className="font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                    {Object.keys(fieldErrors || {}).length > 0 && (
                        <ul style={{ margin: '0.25rem 0 0 1.5rem', padding: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                            {Object.entries(fieldErrors).map(([field, msg]) => (
                                <li key={field}>{msg}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2">
                    <div className="form-group">
                        <label>Category</label>
                        <select 
                            className={fieldClass('category')}
                            value={formData.category} 
                            onBlur={() => markTouched('category')}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select a category...</option>
                            <option value="FACILITY_MAINTENANCE">Facility Maintenance</option>
                            <option value="IT_SUPPORT">IT Support</option>
                            <option value="CLEANING">Cleaning</option>
                            <option value="EQUIPMENT_REPAIR">Equipment Repair</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {(touched.category || fieldErrors.category) && (errors.category || fieldErrors.category) && 
                            <span className="field-error">{errors.category || fieldErrors.category}</span>
                        }
                    </div>
                    <div className="form-group">
                        <label>Priority</label>
                        <select 
                            className={fieldClass('priority')}
                            value={formData.priority} 
                            onBlur={() => markTouched('priority')}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="">Select priority level...</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                        {(touched.priority || fieldErrors.priority) && (errors.priority || fieldErrors.priority) && 
                            <span className="field-error">{errors.priority || fieldErrors.priority}</span>
                        }
                    </div>
                </div>

                <div className="form-group">
                    <label>Related Resource</label>
                    <select value={formData.resourceId} onChange={(e) => setFormData({ ...formData, resourceId: e.target.value, location: selectedResource?.location || formData.location })}>
                        <option value="">General campus issue</option>
                        {resources.map((resource) => (
                            <option key={resource.id} value={resource.id}>{resource.name} ({resource.location})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Location</label>
                    <input 
                        className={fieldClass('location')}
                        value={formData.location} 
                        onBlur={() => markTouched('location')}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                        placeholder="e.g. Building B, Level 3, Room 302"
                    />
                    {(touched.location || fieldErrors.location) && (errors.location || fieldErrors.location) && 
                        <span className="field-error">{errors.location || fieldErrors.location}</span>
                    }
                </div>

                <div className="form-group">
                    <label>Description (Min 10 chars)</label>
                    <textarea 
                        rows="4" 
                        className={fieldClass('description')}
                        value={formData.description} 
                        onBlur={() => markTouched('description')}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                        placeholder="Please describe the issue in detail..."
                    />
                    {(touched.description || fieldErrors.description) && (errors.description || fieldErrors.description) && 
                        <span className="field-error">{errors.description || fieldErrors.description}</span>
                    }
                </div>

                <div className="form-group">
                    <label>Attachments (Max 3)</label>
                    <div className="attachments-management">
                        <div className="attachments-grid-preview">
                            {previews.map((preview, index) => (
                                <div key={preview.id} className="attachment-thumb">
                                    <img src={preview.url} alt={`Upload ${index + 1}`} />
                                    <button type="button" className="thumb-remove" onClick={() => removeAttachment(index)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {previews.length < 3 && (
                                <label className="upload-placeholder">
                                    <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                                    <ImagePlus size={24} />
                                    <span>Add Image</span>
                                </label>
                            )}
                        </div>
                        <p className="form-hint">PNG, JPG or WEBP. Max 5MB per file.</p>
                    </div>
                </div>

                <div className="form-group">
                    <label>Preferred Contact Details (Optional)</label>
                    <input 
                        className={fieldClass('contactDetails')}
                        value={formData.contactDetails} 
                        onBlur={() => markTouched('contactDetails')}
                        onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })} 
                        placeholder="Phone extension or alternate email" 
                    />
                    {(touched.contactDetails || fieldErrors.contactDetails) && (errors.contactDetails || fieldErrors.contactDetails) && 
                        <span className="field-error">{errors.contactDetails || fieldErrors.contactDetails}</span>
                    }
                </div>

                <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading || !isValid}>
                        {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Submit Maintenance Ticket')}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/tickets')}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketForm;
