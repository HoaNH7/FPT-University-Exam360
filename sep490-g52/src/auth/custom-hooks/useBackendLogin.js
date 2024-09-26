import { useContext } from 'react';
import { CurrentUserInfoContext } from '../contexts/CurrentUserInfoContext';
import getCurrentUserInfo from '../helpers/getCurrentUserInfo';
import loginBackend from '../helpers/loginBackend';

/**
 * Custom hook to use backend login functionality.
 *
 * For more info about the function that this hook return, check out this file
 * auth/custom-hooks/useBackendLogin.js
 *
 * @example
 * const loginBackend = useBackendLogin();
 *
 * const googleToken = "receive this from Google";
 * await loginBackend(googleToken);
 */
export function useBackendLogin() {
    // eslint-disable-next-line no-unused-vars
    const [_, setCurrentUserInfo] = useContext(CurrentUserInfoContext);

    /**
     * Log user into the backend server
     * and update currentUserInfo (that useCurrentUserInfo() hook return).
     * (will take 1 render to update currentUserInfo
     * This mean that if you access currentUserInfo right after calling this function,
     * you will get null (example at the end))
     *
     * @async This function run asynchronously so remember to await it.
     *
     * @param {string} googleToken - The Google authentication token.
     *
     * @return {Promise<void>} Return a Promise that will resolve to void if successfully log the user in
     *
     * @throws {AuthorizationError} Throw AuthorizationError if log in fail
     *
     * @example
     * // ---------------------------------------
     * // currentUserInfo is null in this example
     *
     * // Inside some component
     * const loginBackend = useBackendLogin();
     * const currentUserInfo = useCurrentUserInfo();
     *
     * const handleLoginSuccess = async (googleToken) => {
     *   await loginBackend(googleToken);
     *
     *   // Although you have called loginBackend(),
     *   // because <BackendAuthProvider> havn't re-render yet,
     *   // currentUserInfo is still null here.
     *   console.log(currentUserInfo);
     * }
     *
     * // -----------------------------------------
     * // End example
     */
    const returnedFunction = async (googleToken) => {
        await loginBackend(googleToken);

        const userInfo = await getCurrentUserInfo();
        setCurrentUserInfo(userInfo);
    };

    return returnedFunction;
}
