import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const Login = ({ setUserData }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const isValidFormat = /\S+@\S+\.\S+/.test(email);
    const isUnicoreDomain = email.endsWith('@unicore.edu');

    const emailError = !email 
        ? 'Email is required' 
        : !isValidFormat 
            ? 'Enter a valid email address' 
            : !isUnicoreDomain 
                ? 'Local login requires a @unicore.edu address' 
                : '';

    const passwordError = !password ? 'Password is required' : '';
    const isFormValid = !emailError && !passwordError;

    const handleLocalLogin = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (!isFormValid) {
            setFieldErrors({
                email: emailError,
                password: passwordError,
            });
            return;
        }

        setLoading(true);

        try {
            const data = await api.login({ email, password });
            localStorage.setItem('accessToken', data.token);
            setUserData?.(data.user);
            navigate('/', { replace: true });
        } catch (err) {
            setFieldErrors(err.fieldErrors || {});
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade" style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
            {/* Left side: Branding/Illustration */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', padding: '3rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>UniCore</h1>
                <p style={{ color: '#ffffff', fontSize: '1.2rem', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>Your Smart Campus Operations Hub.<br/>Log in to manage tickets, resources, and notifications.</p>
            </div>
            
            {/* Right side: Login Form */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', background: 'var(--background)' }}>
                <div className="card text-center" style={{ width: '100%', maxWidth: '440px', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p className="text-muted" style={{ marginBottom: '2rem' }}>Enter your credentials to access your account.</p>
                    
                    {location.state?.message && (
                        <div style={{ color: 'var(--success)', marginBottom: '1.25rem', background: 'var(--success-bg, #ecfdf5)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>
                            {location.state.message}
                        </div>
                    )}
                    {error && <div style={{ color: 'var(--danger)', marginBottom: '1.25rem', background: 'var(--danger-bg, #fef2f2)', padding: '0.75rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

                    <form onSubmit={handleLocalLogin} style={{ textAlign: 'left' }} className="mt-6 mb-6">
                        <div className="form-group">
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
                        <div className="form-group mb-6 mt-4">
                            <label style={{ fontWeight: 600 }}>Password</label>
                            <input 
                                type="password" 
                                required 
                                placeholder="Enter your password"
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
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || !isFormValid} style={{ padding: '0.9rem', fontSize: '1rem', borderRadius: '12px', marginTop: '1rem' }}>
                            {loading ? 'Authenticating...' : 'Log In'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', color: 'var(--muted)' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                        <span style={{ padding: '0 1rem', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR continue with</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    </div>

                    <a 
                        href="http://localhost:8080/oauth2/authorization/google" 
                        className="btn-google-login"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.75rem', 
                            width: '100%', 
                            padding: '0.9rem', 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)', 
                            background: '#fff', 
                            textDecoration: 'none', 
                            color: 'var(--text)', 
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                    </a>

                    <div className="mt-8 text-muted" style={{ fontSize: '0.95rem', marginTop: '2rem' }}>
                        Don't have an account? <Link to="/signup" className="text-primary" style={{ fontWeight: 700, textDecoration: 'none' }}>Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
