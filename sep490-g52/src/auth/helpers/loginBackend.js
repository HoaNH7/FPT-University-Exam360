import { loginAPIEndpoint } from '../setting';
import { AuthorizationError } from './errorType';

/**
 * Log the user into backend server by making a POST request to login API
 * If successful, the backend server will set refresh token in the user's cookie
 * and effectively log the user in
 *
 * @param {string} googleToken - The JWT token received from Google.
 * This token is used to prove the user's identity to the backend server.
 *
 * @returns {Promise<void>} Return a Promise that will resolve to void if successfully log in.
 *
 * @throws {AuthorizationError} Throw an AuthorizationError if cannot log the user in.
 */
export default async function loginBackend(googleToken) {
    const postRequestData = {
        token: googleToken,
    };

    const response = await fetch(loginAPIEndpoint, {
        credentials: 'include',
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postRequestData),
    });

    if (!response.ok) {
        throw new AuthorizationError('Error when trying to log in to backend');
    }
}
