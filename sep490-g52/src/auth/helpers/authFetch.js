import isValidToken from "./isValidToken";
import getNewAccessToken from "./getNewAccessToken";
import { NetworkError } from "./errorType";
import { logoutAPIEndpoint } from "../setting";
import { BACKEND_URL } from "../setting";

// Store accessToken privately inside this module
let accessToken;

/**
 * Use to make request to backend API that require authorization.
 *
 * Usage: identical to vanilla fetch()
 *
 * Note: only use this function to make request to our backend API.
 * This function will throw error if the request URL is not in our backend.
 *
 * This function is a wrapper around vanilla fetch().
 * It manage accessToken (store it, renew it when the old one is expired).
 * It also automatically put access token in the request header (that is required for backend authorization).
 *
 * @returns {Promise<Response>} A Promise that resolves to a Response object.
 *
 * @param {string | Request} [resource] The URL to fetch or a Request object.
 * @param {object} [options] An options object containing any custom settings that you want to apply to the request.
 *
 * @throws In term of throwing error, this function behaves identical to how vanilla fetch() behave.
 *
 * Special use case: When using this function to make a request to the logout API endpoint on the backend server,
 * this function will set the access token to an invalid value,
 * effectively rendering the user logged out from the backend server
 * (if the backend server also successfully set refresh token to an invalid value).
 */
export default async function authFetch(resource, options = {}) {
  // Set credentials to "include" so that backend server can set cookie (to store refresh token)
  options.credentials = "include";

  // Set mode to 'cors' because fetching cross origin (localhost:3000 to localhost:5000)
  options.mode = "cors";

  let request = new Request(resource, options);

  // Only allow authFetch to fetch from our backend origin
  const backendServerOrigin = BACKEND_URL;
  const destinationOrigin = new URL(request.url).origin;
  if (!backendServerOrigin.includes(destinationOrigin)) {
    throw new Error("Only use authFetch to fetch from our backend server");
  }

  if (!isValidToken(accessToken)) {
    try {
      const newAccessToken = await getNewAccessToken();
      accessToken = newAccessToken;
    } catch (error) {
      // If AuthorizationError occur, silence it and try to fetch() like normal

      // NetworkError will still go through (so that authFetch() behave like native fetch())
      if (error instanceof NetworkError) {
        throw error;
      }
    }
  }

  // Put access token in header for backend authorization
  request.headers.set("Authorization", "Bearer " + accessToken);

  // If authFetch is used to make a request to the logout endpoint
  if (resource === logoutAPIEndpoint) {
    // Invalid the access token (read more in the document of this function above)
    accessToken = null;
  }

  return await fetch(request);
}
