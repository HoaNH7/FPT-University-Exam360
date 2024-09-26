import { useContext } from 'react';
import { CurrentUserInfoContext } from '../contexts/CurrentUserInfoContext';
import logoutBackend from '../helpers/logoutBackend';

/**
 * Custom hook to use backend log out functionality
 *
 * For more info about the function that this hook return,
 * check out this file
 * auth/custom-hooks/useBackendLogout.js
 *
 * @example
 * const logoutBackend = useBackendLogout();
 *
 * await logoutBackend();
 */
export function useBackendLogout() {
    // eslint-disable-next-line no-unused-vars
    const [_, setCurrentUserInfo] = useContext(CurrentUserInfoContext);

    /**
     * Log user out from backend server
     * and update currentUserInfo (that useCurrentUserInfo() hook return).
     *
     * @returns {Promise<void>} Return a Promise that will resolve to void if successfully log out
     * @async This function run asynchronously so rememebr to await
     * @throws {AuthorizationError} Throw AuthorizationError if fail to log out
     */
    const returnedFunction = async () => {
        await logoutBackend();
        setCurrentUserInfo(null);
    };

    return returnedFunction;
}
