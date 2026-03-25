import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const Oauth2RedirectHandler = ({ setUserData }) => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const queryParams = new URLSearchParams(location.search);
            const token = queryParams.get('token');

            if (token) {
                // Save token
                localStorage.setItem('accessToken', token);
                
                // Fetch user data using the new token
                try {
                    const data = await api.getCurrentUser();
                    setUserData(data);
                    navigate('/');
                } catch (error) {
                    console.error("Failed to fetch user data after login", error);
                    navigate('/login');
                }
            } else {
                navigate('/login');
            }
        };

        fetchUserData();
    }, [location, navigate, setUserData]);

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Authenticating...</p>
        </div>
    );
};

export default Oauth2RedirectHandler;
