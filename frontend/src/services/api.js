const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    'http://localhost:8080/api';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

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
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        let message = typeof payload === 'string'
            ? payload
            : payload.message || payload.error || 'Request failed';

        console.error('API Error:', payload);

        const error = new Error(message);
        error.status = response.status;
        error.fieldErrors = payload?.fieldErrors || null;
        throw error;
    }

    return payload;
};

const fetchWithAuth = async (url, options = {}) => {
    let response;

    try {
        response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: getAuthHeaders(options.headers, options.body),
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                `Unable to reach the backend at ${API_BASE_URL}. Make sure the Spring Boot server is running and the API URL is correct.`
            );
        }
        throw error;
    }

    if (response.status === 401) {
        localStorage.removeItem('accessToken');
    }

    return parseResponse(response);
};

export const api = {
    API_ORIGIN,

    // AUTH
    login: (data) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    // USERS
    getCurrentUser: () => fetchWithAuth('/users/me'),
    updateCurrentUser: (data) => fetchWithAuth('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    getAllUsers: (params = {}) => {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        ).toString();
        return fetchWithAuth(`/users${query ? `?${query}` : ''}`);
    },
    updateUserStatus: (id, status) => fetchWithAuth(`/users/${id}/status?status=${status}`, {
        method: 'PUT',
    }),
    updateUserRole: (id, role) => fetchWithAuth(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    }),
    updateUserInfo: (id, data) => fetchWithAuth(`/users/${id}/details`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteUser: (id) => fetchWithAuth(`/users/${id}`, {
        method: 'DELETE',
    }),

    // RESOURCES
    getResources: (params = {}) => {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        ).toString();
        return fetchWithAuth(`/resources${query ? `?${query}` : ''}`);
    },
    getResourceById: (id) => fetchWithAuth(`/resources/${id}`),
    createResource: (data) => fetchWithAuth('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateResource: (id, data) => fetchWithAuth(`/resources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
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
    getSlots: (date, resourceId) => fetchWithAuth(`/slots?date=${date}&resourceId=${resourceId}`),

    // BOOKINGS
    getMyBookings: () => fetchWithAuth('/bookings/my'),
    getUserBookings: () => fetchWithAuth('/bookings/my'),
    getAllBookings: () => fetchWithAuth('/bookings'),
    createBooking: (data) => fetchWithAuth('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    approveBooking: (id) => fetchWithAuth(`/bookings/${id}/approve`, {
        method: 'PATCH',
    }),
    rejectBooking: (id, reason) => fetchWithAuth(`/bookings/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
    }),
    cancelBooking: (id) => fetchWithAuth(`/bookings/${id}/cancel`, {
        method: 'PATCH',
    }),
    requestBookingCancellation: (id) => fetchWithAuth(`/bookings/${id}/request-cancellation`, {
        method: 'POST',
    }),
    getBookingById: (id) => fetchWithAuth(`/bookings/${id}`),
    updateBooking: (id, data) => fetchWithAuth(`/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),

    // TICKETS
    getTickets: (admin = false) => fetchWithAuth(`/tickets${admin ? '?adminMode=true' : ''}`),
    createTicket: (data) => fetchWithAuth('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    getTicketById: (id) => fetchWithAuth(`/tickets/${id}`),
    getTicketComments: (id) => fetchWithAuth(`/tickets/${id}/comments`),
    addTicketComment: (id, data) => fetchWithAuth(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateTicketStatus: (id, data) => fetchWithAuth(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    assignTicket: (id, assignedToId) => fetchWithAuth(`/tickets/${id}/assign?assignedToId=${assignedToId}`, {
        method: 'PATCH',
    }),
    updateTicket: (id, data) => fetchWithAuth(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    cancelTicket: (id) => fetchWithAuth(`/tickets/${id}/cancel`, {
        method: 'PATCH',
    }),
    uploadTicketImage: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchWithAuth(`/tickets/${id}/attachments`, {
            method: 'POST',
            body: formData,
        });
    },
    getTicketAnalytics: () => fetchWithAuth('/tickets/analytics/summary'),
    updateComment: (id, data) => fetchWithAuth(`/comments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteComment: (id) => fetchWithAuth(`/comments/${id}`, {
        method: 'DELETE',
    }),

    // NOTIFICATIONS
    getUserNotifications: () => fetchWithAuth('/notifications'),
    getNotificationUnreadCount: () => fetchWithAuth('/notifications/unread-count'),
    markNotificationAsRead: (id) => fetchWithAuth(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllNotificationsAsRead: () => fetchWithAuth('/notifications/read-all', { method: 'PUT' }),

    // DASHBOARD
    getAdminDashboardSummary: () => fetchWithAuth('/admin/dashboard/summary'),
    getAdminOperationsCalendar: (start, end) => fetchWithAuth(`/admin/operations/calendar?start=${start}&end=${end}`),
    getUserDashboardSummary: () => fetchWithAuth('/user/dashboard/summary'),
};
