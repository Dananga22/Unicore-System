const API_BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = (headers = {}, body) => {
    const token = localStorage.getItem('accessToken');
    const resolvedHeaders = { ...headers };

    if (!(body instanceof FormData) && !resolvedHeaders['Content-Type']) {
        resolvedHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
        resolvedHeaders.Authorization = `Bearer ${token}`;
    }

    return resolvedHeaders;
};

const parseResponse = async (response) => {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message = typeof payload === 'string'
            ? payload
            : payload.message || payload.error || 'Request failed';
        const error = new Error(message);
        error.status = response.status;
        error.fieldErrors = payload.fieldErrors || null;
        throw error;
    }

    return payload;
};

const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: getAuthHeaders(options.headers, options.body),
    });

    if (response.status === 401) {
        localStorage.removeItem('accessToken');
    }

    return parseResponse(response);
};

export const api = {
    login: (credentials) => fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    register: (userData) => fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),

    getCurrentUser: () => fetchWithAuth('/users/me'),
    updateCurrentUser: (userData) => fetchWithAuth('/users/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),

    getAllUsers: (filters = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.role) queryParams.append('role', filters.role);
        if (filters.status) queryParams.append('status', filters.status);
        return fetchWithAuth(`/users?${queryParams.toString()}`);
    },

    updateUserRole: (id, role) => fetchWithAuth(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    }),

    updateUserStatus: (id, status) => fetchWithAuth(`/users/${id}/status?status=${status}`, {
        method: 'PUT',
    }),

    updateUserInfo: (id, userData) => fetchWithAuth(`/users/${id}/details`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),

    deleteUser: (id) => fetchWithAuth(`/users/${id}`, {
        method: 'DELETE',
    }),

    getResources: (filters = {}) => {
        const queryParams = new URLSearchParams();
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.minCapacity) queryParams.append('minCapacity', filters.minCapacity);
        if (filters.search) queryParams.append('search', filters.search);
        const suffix = queryParams.toString();
        return fetchWithAuth(`/resources${suffix ? `?${suffix}` : ''}`);
    },

    getResourceById: (id) => fetchWithAuth(`/resources/${id}`),
    createResource: (resourceData) => fetchWithAuth('/resources', {
        method: 'POST',
        body: JSON.stringify(resourceData),
    }),
    updateResource: (id, resourceData) => fetchWithAuth(`/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(resourceData),
    }),
    updateResourceStatus: (id, status) => fetchWithAuth(`/resources/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    deleteResource: (id) => fetchWithAuth(`/resources/${id}`, {
        method: 'DELETE',
    }),
    uploadResourceImage: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth(`/resources/${id}/image`, {
            method: 'POST',
            body: formData,
        });
    },

    createBooking: (bookingData) => fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    }),
    getUserBookings: () => fetchWithAuth('/bookings'),
    getAllBookings: () => fetchWithAuth('/bookings?all=true'),
    approveBooking: (bookingId) => fetchWithAuth(`/bookings/${bookingId}/approve`, {
        method: 'PUT',
    }),
    rejectBooking: (bookingId, reason) => fetchWithAuth(`/bookings/${bookingId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
    }),
    cancelBooking: (bookingId) => fetchWithAuth(`/bookings/${bookingId}/cancel`, {
        method: 'PUT',
    }),

    getTickets: (adminMode = false) => fetchWithAuth(`/tickets${adminMode ? '?adminMode=true' : ''}`),
    getTicketById: (id) => fetchWithAuth(`/tickets/${id}`),
    createTicket: (ticketData) => fetchWithAuth('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
    }),
    updateTicketStatus: (id, statusData) => fetchWithAuth(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(statusData),
    }),
    addTicketComment: (id, commentData) => fetchWithAuth(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
    }),
    getTicketComments: (id) => fetchWithAuth(`/tickets/${id}/comments`),
    uploadTicketImage: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth(`/tickets/${id}/attachments`, {
            method: 'POST',
            body: formData,
        });
    },

    getUserNotifications: () => fetchWithAuth('/notifications'),
    markNotificationAsRead: (id) => fetchWithAuth(`/notifications/${id}/read`, {
        method: 'PUT',
    }),
    markAllNotificationsAsRead: () => fetchWithAuth('/notifications/read-all', {
        method: 'PUT',
    }),
};
