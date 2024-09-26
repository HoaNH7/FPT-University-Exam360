import { BACKEND_URL as BACKEND_URL_ENV } from "../constant";
export const BACKEND_URL = BACKEND_URL_ENV;
export const logoutAPIEndpoint = BACKEND_URL + '/api/auth/logout';
export const loginAPIEndpoint = BACKEND_URL + '/api/auth/googleLogin';
export const getNewAccessTokenAPIEndpoint = BACKEND_URL + '/api/auth/refresh-access-token';
export const getCurrentUserInfoAPIEndpoint = BACKEND_URL + '/api/User/userInfo';
export const deniedAccessRedirectUrl = '/*';
