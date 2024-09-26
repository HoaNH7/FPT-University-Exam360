import { logoutAPIEndpoint } from '../setting';
import authFetch from './authFetch';
import { AuthorizationError } from './errorType';

/**
 * Log the user out from backend server
 * - The backend server sets refresh token in cookie to an invalid value (an empty string).
 * - Front-end also sets access token to an invalid value (null).
 *
 * @returns {Promise<void>} If successfully log the user out, return a Promise that will resolve to void.
 *
 * @throws {AuthorizationError} Throw AuthorizationError if cannot log the user out.
 */
export default async function logoutBackend() {
    const response = await authFetch(logoutAPIEndpoint);

    if (!response.ok) {
        throw new AuthorizationError('Error when trying to log out from backend server');
    }
}
