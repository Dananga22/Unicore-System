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
    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    const emailError = !email ? 'Email is required' : (!isValidEmail ? 'Enter a valid email address' : '');
    const passwordError = !password ? 'Password is required' : '';
    const isFormValid = !emailError && !passwordError;

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

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
        <div className="auth-wrapper animate-fade">
            <div className="card auth-card text-center">
                <h2>Welcome to UniCore</h2>
                <p>Securely access your campus operations dashboard.</p>
                
                {location.state?.message && (
                    <div style={{ color: 'var(--success)', marginBottom: '1.25rem', background: 'var(--success-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                        {location.state.message}
                    </div>
                )}
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1.25rem', background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500 }}>{error}</div>}

                <form onSubmit={handleLocalLogin} style={{ textAlign: 'left' }} className="mt-6 mb-6">
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
                    <div className="form-group mb-6">
                        <label>Password</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="Enter your password"
                            value={formData.password} 
                            className={fieldErrors.password || passwordError ? 'input-invalid' : ''}
                            onChange={(e) => {
                                setFormData({...formData, password: e.target.value});
                                setFieldErrors((current) => ({ ...current, password: '' }));
                            }}
                        />
                        {(fieldErrors.password || passwordError) && <div className="field-error">{fieldErrors.password || passwordError}</div>}
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading || !isFormValid}>
                        {loading ? 'Authenticating...' : 'Log In'}
                    </button>
                </form>

                <div className="flex items-center gap-4 mb-6 text-muted" style={{ fontSize: '0.85rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                    <span>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                <button 
                    type="button"
                    onClick={handleGoogleLogin} 
                    className="btn btn-secondary btn-block"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Continue with Google
                </button>

                <div className="mt-6 text-muted" style={{ fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/signup" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
