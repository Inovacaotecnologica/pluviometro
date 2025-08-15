import type { RawMessage } from '../types';
import { API_BASE_URL } from '../constants';

/**
 * Generic fetch wrapper for the API.
 * Includes timeout, no-cache headers, and error handling.
 * @param endpoint - The API endpoint to call.
 * @param options - Standard fetch options.
 * @returns The JSON response.
 */
const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-store',
                ...options.headers,
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error('A requisição excedeu o tempo limite de 8 segundos');
            }
            throw error;
        }
        throw new Error('An unknown fetch error occurred');
    }
};

/**
 * Fetches the list of available topics.
 */
export const getTopics = async (): Promise<string[]> => {
    return apiFetch('/api/raw/topics');
};

/**
 * Fetches the latest message for a given topic.
 */
export const getLatest = async (topic: string): Promise<RawMessage> => {
    return apiFetch(`/api/raw/latest?topic=${encodeURIComponent(topic)}`);
};

/**
 * Fetches a series of messages for a given topic.
 */
export const getSeries = async (topic: string, limit: number = 2000): Promise<RawMessage[]> => {
    return apiFetch(`/api/raw/series?topic=${encodeURIComponent(topic)}&limit=${limit}`);
};
