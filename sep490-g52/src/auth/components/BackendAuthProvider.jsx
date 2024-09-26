import { useEffect, useState } from 'react';
import { CurrentUserInfoContext } from '../contexts/CurrentUserInfoContext';
import getCurrentUserInfo from '../helpers/getCurrentUserInfo';
import LoadingScreen from './LoadingScreen';

/**
 * BackendAuthProvider Component
 *
 * This component is responsible for managing authentication and user information within the application.
 * It provides context providers for authentication-related data and hooks to interact with the backend.
 *
 * This component is required to use these hook:
 * - useAuthFetch()
 * - useLoginBackend()
 * - useLogoutBackend()
 * - useCurrentUserInfo()
 *
 * Wrap this component around your <App />
 *
 * @returns {React.ReactNode} If not loading, return children. If loading, return loadingScreen
 *
 * @param {Object} props - Component props
 *
 * @param {React.ReactNode} props.children - Child components to be wrapped within the provider
 *
 * @param {React.ReactNode} [props.loadingScreen=<LoadingScreen />]
 * Component to be render when loading state is true
 * If omitted, will fall back to default (auth/components/LoadingScreen.jsx)
 *
 * @param {React.ReactNode} children - Child components to be wrapped within the provider
 *
 * @param {React.ReactNode} loadingScreen
 * Component to be render when loading state is true
 * If omitted, will fall back to default (auth/components/LoadingScreen.jsx)
 */
export function BackendAuthProvider({ loadingScreen, children }) {
    const [currentUserInfo, setCurrentUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This useEffect hook run once on <BackendAuthProvider> mount (when user open new browser tab and go to our app)
        // If the user's refresh token (stored in cookie) is still valid,
        // this effect will fetch and set currentUserInfo to that

        // Whether to ignore the data received after fetching or not
        // This is to prevent race condition
        // For more info: https://react.dev/learn/synchronizing-with-effects#fetching-data
        let ignore = false;

        setCurrentUserInfo(null);

        getCurrentUserInfo().then((userInfo) => {
            // If ignore, do nothing
            if (ignore) {
                return;
            }

            // Else (not ignore)
            setCurrentUserInfo(userInfo);
            setIsLoading(false);
        });

        return () => (ignore = true);
    }, []);

    if (isLoading) {
        return loadingScreen || <LoadingScreen />;
    }

    return (
        <CurrentUserInfoContext.Provider value={[currentUserInfo, setCurrentUserInfo]}>
            {children}
        </CurrentUserInfoContext.Provider>
    );
}
