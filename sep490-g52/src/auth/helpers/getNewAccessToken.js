import { getNewAccessTokenAPIEndpoint } from '../setting';
import { AuthorizationError, NetworkError } from './errorType';

/**
 * Fetch new access token from backend API
 * and return it
 *
 * Note: this function return a Promise so remember to await it
 *
 * @returns {Promise<string>} new access token
 * @throws {NetworkError} Throws a NetworkError if the network fails
 * @throws {AuthorizationError} Throws an AuthorizationError if backend server response with 401 Unauthorized
 */
export default async function getNewAccessToken() {
    let response;
    try {
        response = await fetch(getNewAccessTokenAPIEndpoint, {
            mode: 'cors',
            method: 'GET',
            credentials: 'include',
        });
    } catch {
        // In this situation, fetch() only throw error due to network problem
        throw new NetworkError('Network error when trying to get new access token from backend API');
    }

    // Backend server response with 401 Unauthorized
    if (response.status === 401) {
        throw new AuthorizationError(
            "Error: Unauthorized when trying to get new access token from backend API (could be because of user's invalid refresh token stored in cookie)",
        );
    }

    const data = await response.json();
    const newAccessToken = data.token;

    return newAccessToken;
}
