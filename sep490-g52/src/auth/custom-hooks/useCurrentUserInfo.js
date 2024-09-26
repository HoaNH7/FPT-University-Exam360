import { useContext } from 'react';
import { CurrentUserInfoContext } from '../contexts/CurrentUserInfoContext';

/**
 *  Custom hook to get the info of the current logged in user.
 *
 *  @returns
 *  If the user is logged in, return an object contain user information.
 *  Else (the user has not logged in yet), return null
 *
 *  @example
 *  const currentUserInfo = useCurrentUserInfo();
 *
 *  // If the user has logged in
 *  // currentUserInfo will has this shape
 *  // this is depend on what the backend server response
 *  // http://back-end-server/api/User/userInfo
 *  {
 *      email: string,
 *      roles: string[],
 *      campusName: string,
 *  }
 *
 *  // If the user has not logged in
 *  // currentUserInfo is
 *  null;
 */
export function useCurrentUserInfo() {
    const [currentUserInfo, _] = useContext(CurrentUserInfoContext);

    return currentUserInfo;
}
