import { jwtDecode } from 'jwt-decode';

export default function isValidToken(token) {
    // Check to see token is null or not
    if (!token) {
        return false;
    }

    // Check the expire time of token
    const decodedToken = jwtDecode(token);

    const currentEpochTimeSecond = Date.now() / 1000;
    const expiredTime = decodedToken.exp;

    if (currentEpochTimeSecond >= expiredTime) {
        return false;
    }

    return true;
}
