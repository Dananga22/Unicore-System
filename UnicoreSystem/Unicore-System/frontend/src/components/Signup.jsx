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

    const isValidFormat = /\S+@\S+\.\S+/.test(email);
    const isUnicoreDomain = email.endsWith('@unicore.edu');
    
    // Strict Name Validation
    const nameError = !name 
        ? 'Full name is required' 
        : name.length < 3 
            ? 'Name must be at least 3 characters' 
            : '';

    // Institutional Email Validation
    const emailError = !email 
        ? 'Email is required' 
        : !isValidFormat 
            ? 'Enter a valid email address' 
            : !isUnicoreDomain 
                ? 'Only institutional emails (@unicore.edu) are allowed' 
                : '';

    // Strict Password Validation
    const passwordError = !password
        ? 'Password is required'
        : password.length < 8
            ? 'Password must be at least 8 characters long'
            : !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)
                ? 'Password must include uppercase, lowercase, number, and special character'
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
        <div className="animate-fade" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
            {/* Left side: Branding/Illustration */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', padding: '3rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>UniCore</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '400px', textAlign: 'center', lineHeight: 1.6 }}>Join the next generation of campus infrastructure management.</p>
            </div>
            
            {/* Right side: Signup Form */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', background: 'var(--background)', overflowY: 'auto' }}>
                <div className="card text-center" style={{ width: '100%', maxWidth: '440px', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Get started with your UniCore account.</p>
                    
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1.25rem', background: 'var(--danger-bg, #fef2f2)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ textAlign: 'left' }} className="mt-4 mb-4">
                        <div className="form-group mt-2">
                            <label style={{ fontWeight: 600 }}>Full Name</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="John Doe"
                                value={formData.name} 
                                className={fieldErrors.name || nameError ? 'input-invalid' : ''}
                                style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                onChange={(e) => {
                                    setFormData({...formData, name: e.target.value});
                                    setFieldErrors((current) => ({ ...current, name: '' }));
                                }}
                            />
                            {(fieldErrors.name || nameError) && <div className="field-error">{fieldErrors.name || nameError}</div>}
                        </div>
                        <div className="form-group mt-4">
                            <label style={{ fontWeight: 600 }}>Email Address</label>
                            <input 
                                type="email" 
                                required 
                                placeholder="student@unicore.edu"
                                value={formData.email} 
                                className={fieldErrors.email || emailError ? 'input-invalid' : ''}
                                style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                onChange={(e) => {
                                    setFormData({...formData, email: e.target.value});
                                    setFieldErrors((current) => ({ ...current, email: '' }));
                                }}
                            />
                            {(fieldErrors.email || emailError) && <div className="field-error">{fieldErrors.email || emailError}</div>}
                        </div>
                        <div className="form-group mt-4">
                            <label style={{ fontWeight: 600 }}>Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="Create a strong password"
                                value={formData.password} 
                                className={fieldErrors.password || passwordError ? 'input-invalid' : ''}
                                style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                onChange={(e) => {
                                    setFormData({...formData, password: e.target.value});
                                    setFieldErrors((current) => ({ ...current, password: '' }));
                                }}
                            />
                            {(fieldErrors.password || passwordError) && <div className="field-error">{fieldErrors.password || passwordError}</div>}
                        </div>
                        <div className="form-group mb-6 mt-4">
                            <label style={{ fontWeight: 600 }}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                className={fieldErrors.confirmPassword || confirmPasswordError ? 'input-invalid' : ''}
                                style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}
                                onChange={(e) => {
                                    setFormData({...formData, confirmPassword: e.target.value});
                                    setFieldErrors((current) => ({ ...current, confirmPassword: '' }));
                                }}
                            />
                            {(fieldErrors.confirmPassword || confirmPasswordError) && (
                                <div className="field-error">{fieldErrors.confirmPassword || confirmPasswordError}</div>
                            )}
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !isFormValid} style={{ padding: '0.9rem', fontSize: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-muted" style={{ fontSize: '0.95rem' }}>
                        Already have an account? <Link to="/login" className="text-primary" style={{ fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
