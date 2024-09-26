import { getCurrentUserInfoAPIEndpoint } from '../setting';
import authFetch from './authFetch';

/**
 * Asynchronously fetches the current user's information from the backend API.
 *
 * @returns {Promise<Object|null>} A Promise that resolves with the current user's information if the fetch is successful, otherwise resolves with null.
 *
 * @throws This function doesn't throw error.
 */
export default async function getCurrentUserInfo() {
    let response;

    try {
        // Fetch user info from backend API
        response = await authFetch(getCurrentUserInfoAPIEndpoint);
    } catch {
        // In event of network error
        return null;
    }

    // Return null if cannot successfully fetch user info
    // It could be because the user is not logged in
    if (!response.ok) {
        return null;
    }

    // userInfo is the data backend API response with
    const userInfo = await response.json();

    return userInfo;
}
