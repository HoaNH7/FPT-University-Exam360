import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HeaderComponent.scss';
import { Link, useNavigate } from 'react-router-dom';
import { googleLogout } from '@react-oauth/google';
import { useBackendLogout, useCurrentUserInfo } from '../../auth';

function Header() {
    const navigate = useNavigate();
    const [setUser] = useState(null);
    const user = useCurrentUserInfo();
    const logoutBackend = useBackendLogout();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleResize = () => {
        setIsMobile(window.innerWidth < 800);
    };

    const logout = async () => {
        await logoutBackend();
        googleLogout();
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container-fluid">
                <Link to="/" className="navbar-brand">
                    FPT University Exam360
                </Link>
                {!isMobile && user && (
                    <>
                        <span style={{ marginRight: '120vh' }} className="navbar-brand">
                            {user.roles[0] === 'Admin' ? '' : user.campusName}
                        </span>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <span className="nav-link text-light">Welcome: {user.email}</span>
                            </li>
                            <li className="nav-item">
                                <span className="nav-link text-light">Role: {user.roles[0]}</span>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" variant="outline-light" to="/" onClick={logout}>
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </>
                )}

                {isMobile && user && (
                    <>
                        <span className="navbar-brand">{user.roles[0] === 'Admin' ? '' : user.campusName}</span>
                        <ul className="navbar-nav d-flex align-items-center flex-row">
                            {' '}
                            <li className="nav-item mr-3" style={{ marginRight: 15 }}>
                                {' '}
                                <span className="nav-link text-light">Role: {user.roles[0]}</span>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" variant="outline-light" to="/" onClick={logout}>
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Header;
