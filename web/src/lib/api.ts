// Centralized API Fetch Wrapper with Error Handling

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

// Function to get global redirect handler (set by auth store)
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (handler: () => void) => {
    onUnauthorized = handler;
};

// Function to get auth token (set by auth store)
let getToken: (() => string | null) | null = null;
export const setGetToken = (getter: () => string | null) => {
    getToken = getter;
};

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

export async function apiFetch<T>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
    };

    // ✅ Capture the token ONCE for this request
    const tokenUsedForThisRequest =
        !skipAuth && getToken ? getToken() : null;

    console.log(
        '[API] Token for',
        endpoint,
        ':',
        tokenUsedForThisRequest ? 'present' : 'missing'
    );

    // Attach auth token if available
    if (tokenUsedForThisRequest) {
        (headers as Record<string, string>)['Authorization'] =
            `Bearer ${tokenUsedForThisRequest}`;
    }

    const url = `${API_URL}${endpoint}`;
    console.log('[API] Fetching:', url);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
        });

        console.log('[API] Response:', endpoint, response.status);

        // ✅ Safe 401 handling
        if (response.status === 401) {
            const sentAuthHeader = !!tokenUsedForThisRequest;

            console.log('[API] Got 401, sent token:', sentAuthHeader);

            // Only logout if THIS request actually sent a token
            if (sentAuthHeader && onUnauthorized && !skipAuth) {
                console.log('[API] Triggering logout due to 401');
                onUnauthorized();
            }

            throw new ApiError('Unauthorized', 401);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return undefined as T;
        }

        // Handle other error responses
        if (!response.ok) {
            let message = response.statusText;
            try {
                const errorData = await response.json();
                message = errorData.message || message;
            } catch {
                // Ignore JSON parse errors
            }
            throw new ApiError(message, response.status);
        }

        // Parse JSON response
        const data = await response.json();
        return data as T;

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        console.error('[API] Network error:', error);
        throw new ApiError('Network error. Please try again.', 0);
    }
}
