import {BACKEND_URL} from '../../../constant';
import { ToastContainer, toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import Form from 'react-bootstrap/Form';
import 'react-toastify/dist/ReactToastify.css';
import './ViewFileDat.scss'; // Create this CSS file for custom styles
import { useAuthFetch } from '../../../auth';

const ViewFileDat = () => {
    const [submissions, setSubmissions] = useState([]);
    const authfetch = useAuthFetch();
    useEffect(() => {
        authfetch(BACKEND_URL + '/api/FileUpload/GetAllSubmissions')
            .then((response) => response.json())
            .then((data) => setSubmissions(data))
            .catch((error) => {
                console.error('Error fetching submissions:', error);
                toast.error('Failed to load submissions');
            });
    }, []);

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-viewrequest">
                <div className="viewrequest-management-header">
                    <Link className="viewrequest-management-link" to="/examiner">
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
                <div className="body-container-examcode">
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
                </div>
                <div className="table-responsive">
                    <table className="viewrequest-table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>No</th>
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
                                    <td>{index + 1}</td>
                                    <td>{submission.studentIdNumber}</td>
                                    <td>{submission.date}</td>
                                    <td>{submission.slot}</td>
                                    <td>{submission.fullName}</td>
                                    <td>{submission.subjectCode}</td>
                                    {/* <td>{submission.room}</td> */}
                                    <td>
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

export default ViewFileDat;
