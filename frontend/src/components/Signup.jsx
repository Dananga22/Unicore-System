import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const Signup = ({ setUserData }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    const nameError = !name ? 'Full name is required' : '';
    const emailError = !email ? 'Email is required' : (!isValidEmail ? 'Enter a valid email address' : '');
    const passwordError = !password
        ? 'Password is required'
        : password.length < 8
            ? 'Password must be at least 8 characters long'
            : (!/[A-Za-z]/.test(password) || !/\d/.test(password))
                ? 'Password must contain at least one letter and one number'
                : '';
    const confirmPasswordError = !confirmPassword
        ? 'Confirm your password'
        : password !== confirmPassword
            ? 'Passwords do not match'
            : '';
    const isFormValid = !nameError && !emailError && !passwordError && !confirmPasswordError;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (!isFormValid) {
            setFieldErrors({
                name: nameError,
                email: emailError,
                password: passwordError,
                confirmPassword: confirmPasswordError,
            });
            return;
        }

        setLoading(true);

        try {
            await api.register({ name, email, password });
            const data = await api.login({ email, password });
            localStorage.setItem('accessToken', data.token);
            setUserData?.(data.user);
            navigate('/', { replace: true });
        } catch (err) {
            setFieldErrors(err.fieldErrors || {});
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper animate-fade">
            <div className="card auth-card text-center">
                <h2>Create an Account</h2>
                <p>Join the UniCore Operations Hub.</p>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1.25rem', background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }} className="mt-6 mb-4">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="John Doe"
                            value={formData.name} 
                            className={fieldErrors.name || nameError ? 'input-invalid' : ''}
                            onChange={(e) => {
                                setFormData({...formData, name: e.target.value});
                                setFieldErrors((current) => ({ ...current, name: '' }));
                            }}
                        />
                        {(fieldErrors.name || nameError) && <div className="field-error">{fieldErrors.name || nameError}</div>}
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            required 
                            placeholder="student@unicore.edu"
                            value={formData.email} 
                            className={fieldErrors.email || emailError ? 'input-invalid' : ''}
                            onChange={(e) => {
                                setFormData({...formData, email: e.target.value});
                                setFieldErrors((current) => ({ ...current, email: '' }));
                            }}
                        />
                        {(fieldErrors.email || emailError) && <div className="field-error">{fieldErrors.email || emailError}</div>}
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="Create a strong password"
                            value={formData.password} 
                            className={fieldErrors.password || passwordError ? 'input-invalid' : ''}
                            onChange={(e) => {
                                setFormData({...formData, password: e.target.value});
                                setFieldErrors((current) => ({ ...current, password: '' }));
                            }}
                        />
                        {(fieldErrors.password || passwordError) && <div className="field-error">{fieldErrors.password || passwordError}</div>}
                    </div>
                    <div className="form-group mb-6">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            required
                            placeholder="Re-enter your password"
                            value={formData.confirmPassword}
                            className={fieldErrors.confirmPassword || confirmPasswordError ? 'input-invalid' : ''}
                            onChange={(e) => {
                                setFormData({...formData, confirmPassword: e.target.value});
                                setFieldErrors((current) => ({ ...current, confirmPassword: '' }));
                            }}
                        />
                        {(fieldErrors.confirmPassword || confirmPasswordError) && (
                            <div className="field-error">{fieldErrors.confirmPassword || confirmPasswordError}</div>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading || !isFormValid}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-muted" style={{ fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Log In</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
