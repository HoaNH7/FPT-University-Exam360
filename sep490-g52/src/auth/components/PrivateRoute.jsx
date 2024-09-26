import { Navigate, Outlet } from 'react-router-dom';
import { deniedAccessRedirectUrl } from '../setting';
import { useCurrentUserInfo } from '../custom-hooks/useCurrentUserInfo';

/**
 * A component to render routes conditionally based on user roles.
 *
 * This component will check user's roles (using useCurrentUserInfo() hook)
 * then compare user's role to allowedRoles to see whether the user can access this route or note
 *
 * @param {object} props - The component props.
 * @param {string[]} props.allowedRoles An array of roles allowed to access the route.
 * @param {ReactNode} props.children - The child components to render within the route.
 *
 * @param allowedRoles An array of roles allowed to access the route
 * if allowedRoles is \["Anonymous"\], anyone can visit the route
 *
 * @returns {ReactNode}
 * Returns either the children components if user roles match allowed roles, or redirects to deniedAccessRedirectUrl in auth/setting.js file
 */
export function PrivateRoute({ allowedRoles, children }) {
    const userInfo = useCurrentUserInfo();

    // Not logged in yet
    const userRoles = userInfo !== null ? userInfo.roles : [];

    if (!hasCommonElement(allowedRoles, userRoles) && !allowedRoles.includes('Anonymous')) {
        return <Navigate to={deniedAccessRedirectUrl} />;
    }

    return children ? children : <Outlet />;
}

function hasCommonElement(arr1, arr2) {
    for (const element of arr1) {
        if (arr2.includes(element)) {
            return true;
        }
    }
    return false;
}
