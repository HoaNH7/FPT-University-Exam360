import {BACKEND_URL} from '../../../constant';
import './ViewRecordsViolationsProctor.jsx.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch } from '../../../auth';
import { useCurrentUserInfo } from '../../../auth';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import moment from 'moment';

const ViewRecordsViolationsProctor = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [requests, setRequests] = useState([]);
    const authfetch = useAuthFetch();
    const user = useCurrentUserInfo();
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalViolations, setTotalViolations] = useState(0);
    const totalPages = Math.ceil(totalViolations / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [refreshTime, setRefreshTime] = useState(localStorage.getItem('refreshTime') || null);

    useEffect(() => {
        getData();
    }, [pageNumber]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/Violation/ViewAllViolationByProctorId?reportById=${user.userId}&roomName=${room}&startTime=${startTime}&endTime=${endTime}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalViolations, violations } = result;
                const sortedData = violations.sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
                setData(sortedData);
                setTotalViolations(totalViolations);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSearch = () => {
        const searchResult = data.filter((item) => item.rollNo.toLowerCase().includes(searchInput.toLowerCase()));
        setFilteredData(searchResult);
    };

    const handleRefreshButtonClick = () => {
        const currentTime = new Date().toLocaleTimeString();
        localStorage.setItem('refreshTime', currentTime);
        setRefreshTime(currentTime);
        window.location.reload();
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'status-pending';
            case 'Warning':
                return 'status-warning';
            case 'Exam suspension':
                return 'status-examsuspension';
            case 'Academic suspension':
                return 'status-acdemicsuspension';
            case 'rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-viewrecordproctor">
                <div className="viewrecordproctor-management-header">
                    <Link
                        className="viewrecordproctor-management-link"
                        to={`/examschedulemanage?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                    >
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> View Records Violations</span>{' '}
                </div>
                <h2 className="schedulemanage-management-title">
                    You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                </h2>
                <div className="body-container-viewrecordproctor">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        style={{ width: 250 }}
                        type="text"
                        placeholder="Search by Roll No"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                </div>
                <div className="body-container-viewrecordproctor">
                    <button className="btn btn-primary" onClick={handleRefreshButtonClick}>
                        Refresh
                    </button>
                    {refreshTime && (
                        <span style={{ marginLeft: '10px', fontSize: 14 }}>Last updated at: {refreshTime}</span>
                    )}
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 22 }}>Filter: </span>
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                    >
                        <option value="All">All Status</option>
                        <option value="All">Pending</option>
                        <option value="All">Resolved</option>
                        <option value="All">Rejected</option>
                    </Form.Select>
                </div>
                <div>
                    <table className="viewrecordproctor-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Full Name</th>
                                <th>Roll No</th>
                                <th>Subject</th>
                                {/* <th>Room</th> */}
                                <th>Time</th>
                                <th>Violation Content</th>
                                <th>Handing Result</th>
                                <th>Proctor's Note</th>
                                <th>Handler's Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0
                                ? data.map((item, index) => (
                                      <tr key={index}>
                                          <td data-title="No :">{index + startIndex}</td>
                                          <td data-title="Full Name :">{item.fullName}</td>
                                          <td data-title="Roll No :">{item.studentIdNumber}</td>
                                          <td data-title="Subject :">{item.subjectCode}</td>
                                          {/* <td data-title="Room">{item.roomName}</td> */}
                                          <td data-title="Time :">{item.reportDate}</td>
                                          <td data-title="Violation Content :">{item.violationTitle}</td>
                                          <td data-title="Handling Result :">
                                              <span className={`status-text ${getStatusClass(item.resolveStatus)}`}>
                                                  {item.resolveStatus}
                                              </span>
                                          </td>
                                          <td data-title="Note :">{item.note}</td>
                                          <td>{item.responseNote}</td>
                                      </tr>
                                  ))
                                : 'Loadding...'}
                        </tbody>
                    </table>
                    <div>
                        <br />
                        <ul className="pagination">
                            <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPageNumber(pageNumber - 1)}>
                                    Previous
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <li key={index} className={`page-item ${pageNumber === index + 1 ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => setPageNumber(index + 1)}>
                                        {index + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${pageNumber === totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" onClick={() => setPageNumber(pageNumber + 1)}>
                                    Next
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default ViewRecordsViolationsProctor;
