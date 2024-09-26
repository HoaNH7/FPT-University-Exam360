import authFetch from '../helpers/authFetch.js';

/**
 * Custom hook to make request to protected backend API
 *
 * Return a function used to make request to protected backend API. This returned function behaves identically to vanilla fetch().
 *
 * For detailed info about authFetch function that this hook return, see this file:
 * auth/helpers/authFetch.js
 *
 * @example
 * const authFetch = useAuthFetch();
 * authFetch("http://backend-server/api/protected-endpoint").then(res => res.json()).then(data => console.log(data));
 */
export function useAuthFetch() {
    return authFetch;
}
