import {BACKEND_URL} from '../../constant';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Col, Container, Row, Form } from 'react-bootstrap';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Correct import from 'jwt-decode'
import './LoginPage.scss';
import { useAuthFetch, useBackendLogin, useCurrentUserInfo } from '../../auth';

const LoginPage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('');
    const loginBackend = useBackendLogin();
    const authfetch = useAuthFetch();
    const userInfo = useCurrentUserInfo();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        getData();
        fetchNotification();
    }, []);

    const getData = () => {
        axios
            .get(BACKEND_URL + '/Admin/ManageCampus/GetAllCampuses')
            .then((result) => {
                setData(result.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleLoginSuccess = async (response) => {
        console.log('google token received:\n', response.credential);

        const googleToken = response.credential;

        const decodedToken = jwtDecode(googleToken);
        if (!decodedToken.email.endsWith('@fpt.edu.vn')) {
            alert('Only accounts with the @fpt.edu.vn domain are allowed.');
            return;
        }
        console.log(' prepare login backend');
        await loginBackend(googleToken);
    };

    const handleLoginFailure = (error) => {
        console.log('Login Failed:', error);
        // Handle failed login here
    };

    const handleCampusChange = (e) => {
        setSelectedCampus(e.target.value);
    };

    const fetchNotification = async () => {
        try {
            const response = await authfetch(BACKEND_URL + '/Examiner/MakeCommonNotice/GetAllNotices');
            const data = await response.json();

            console.log('Fetched notification data:', data);

            if (response.ok && data.length > 0) {
                const sortedData = data.sort((a, b) => new Date(b.sendTime) - new Date(a.sendTime));

                const mostRecentNotification = sortedData[0];

                setTitle(mostRecentNotification?.title || '');
                setContent(mostRecentNotification?.content || '');
            } else {
                console.error('Failed to fetch notification or no notification available');
            }
        } catch (error) {
            console.error('Error fetching notification:', error);
        }
    };

    if (userInfo) {
        return (
            <Container className="d-flex flex-column justify-content-center align-items-center vh-100">
                {title && content && (
                    <div className="notification-banner">
                        <h2 style={{ color: 'red' }}>Thông báo: {title}</h2>
                        <h3 style={{ color: 'red' }}>{content}</h3>
                    </div>
                )}
                {userInfo.roles.map((role) => {
                    if (role === 'Admin') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/admin"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to Admin page
                            </Link>
                        );
                    } else if (role === 'ExaminerHead') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/examinerhead"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to ExaminerHead page
                            </Link>
                        );
                    } else if (role === 'ITStaff') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/itstaff"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to ITStaff page
                            </Link>
                        );
                    } else if (role === 'Examiner') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/examiner"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to Examiner page
                            </Link>
                        );
                    } else if (role === 'Proctor') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/examschedule"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to Proctor page
                            </Link>
                        );
                    } else if (role === 'Student') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/student"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to Student Page
                            </Link>
                        );
                    } else if (role === 'HallwayProctor') {
                        return (
                            <Link
                                key={role}
                                className="btn btn-primary my-2"
                                to="/hallwayProctor"
                                style={{ width: '50%', fontSize: '20px' }}
                            >
                                Go to HallwayProctor Page
                            </Link>
                        );
                    } else {
                        return null;
                    }
                })}
            </Container>
        );
    }

    return (
        <GoogleOAuthProvider clientId="531851149653-r0o3ekq3dccb56b1r7trcb7si3ga25ib.apps.googleusercontent.com">
            <div className="login-page">
                <Container>
                    <Row>
                        <Col xs={12} md={6} className="mx-auto">
                            <Form>
                                <div className="wrapper-col-left">
                                    <h1 className="login-text">Sign In</h1>
                                    <p className="login-text-p">Sinh viên, Giảng viên, Cán bộ ĐH - FPT</p>
                                    {data && data.length > 0 ? (
                                        <Form.Select
                                            aria-label="Default select example"
                                            className="select-campus"
                                            value={selectedCampus}
                                            onChange={handleCampusChange}
                                        >
                                            <option value="" disabled>
                                                Select Campus
                                            </option>
                                            {data.map((item) => (
                                                <option key={item.campusId} value={item.campusId}>
                                                    {item.campusName}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    ) : (
                                        'No Data...'
                                    )}
                                    <div className="signin-google">
                                        <GoogleLogin
                                            onSuccess={handleLoginSuccess}
                                            onFailure={handleLoginFailure}
                                            useOneTap
                                        />
                                    </div>
                                </div>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </div>
        </GoogleOAuthProvider>
    );
};

export default LoginPage;
