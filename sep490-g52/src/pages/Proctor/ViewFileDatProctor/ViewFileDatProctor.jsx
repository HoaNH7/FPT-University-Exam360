import {BACKEND_URL} from '../../../constant';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import Form from 'react-bootstrap/Form';

const ViewFileDatProctor = () => {
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const room = query.get('roomName');
    const authfetch = useAuthFetch();
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/ListFileDat/GetAllSubmissions?proctorId=${user.userId}&startTime=${startTime}&endTime=${endTime}&room=${room}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                setSubmissions(rs);
            })
            .catch((error) => {
                console.error('Error fetching submissions:', error);
                toast.error('Failed to load submissions');
            });
    };
    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-viewrequest">
                <div className="viewrequest-management-header">
                    <Link
                        className="viewrequest-management-link"
                        to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                    >
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}>View File Dat</span>{' '}
                </div>
                <div className="body-container-viewrequest">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input type="text" placeholder="Search" />
                    <button className="btn btn-primary">Search</button>
                </div>
                {/* <div className="body-container-examcode">
                    <span style={{ marginRight: 22 }}>Filter: </span>
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </Form.Select>
                </div> */}
                <div className="table-responsive">
                    <table className="viewrequest-table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Full Name</th>
                                <th>Subject Code</th>
                                {/* <th>Room</th> */}
                                <th>File</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission, index) => (
                                <tr key={index}>
                                    <td data-title="Roll No :">{submission.studentIdNumber}</td>
                                    <td data-title="Date :">{submission.date}</td>
                                    <td data-title="Time :">{submission.slot}</td>
                                    <td data-title="Full Name :">{submission.fullName}</td>
                                    <td data-title="Subject Code :">{submission.subjectCode}</td>
                                    <td data-title="File :">
                                        <a href={submission.file} download>
                                            Download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Fragment>
    );
};

export default ViewFileDatProctor;
