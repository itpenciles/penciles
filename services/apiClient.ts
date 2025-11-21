const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const apiClient = {
    async get(endpoint: string) {
        return this.request('GET', endpoint);
    },

    async post(endpoint: string, body: any) {
        return this.request('POST', endpoint, body);
    },

    async put(endpoint: string, body: any) {
        return this.request('PUT', endpoint, body);
    },

    async delete(endpoint: string) {
        return this.request('DELETE', endpoint);
    },

    async request(method: string, endpoint: string, body?: any) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            // Critical: Tell browser/proxies not to cache this
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        };
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            method,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        // Add timestamp to GET requests to force browser to bypass cache
        let url = `/api${endpoint}`;
        if (method === 'GET') {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}_t=${Date.now()}`;
        }

        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            // Create a custom error object to pass along response data
            const error: any = new Error(errorData.message || 'Server error');
            error.response = {
                status: response.status,
                data: errorData,
            };
            throw error;
        }

        // Handle successful responses with no content (e.g., 204 for DELETE)
        if (response.status === 204) {
            return null;
        }

        return response.json();
    }
};

export default apiClient;