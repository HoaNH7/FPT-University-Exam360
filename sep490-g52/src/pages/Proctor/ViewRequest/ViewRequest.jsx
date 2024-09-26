import {BACKEND_URL} from '../../../constant';
import './ViewRequest.scss';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import moment from 'moment';

const ViewRequest = () => {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchValue, setSearchValue] = useState('');
    const user = useCurrentUserInfo();
    const authfetch = useAuthFetch();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const formatEndTime = moment(query.get('endTime')).format('HH:mm');
    const room = query.get('roomName');
    const [filterData, setFilterData] = useState([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRequests, setTotalRequests] = useState(0);
    const totalPages = Math.ceil(totalRequests / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [refreshTime, setRefreshTime] = useState(sessionStorage.getItem('refreshTime') || null);

    useEffect(() => {
        getData();
    }, [pageNumber]);

    useEffect(() => {
        handleSearch();
    }, [searchInput]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/Request/ViewAllRequestByProctorId?requestById=${user.userId}&startTime=${startTime}&endTime=${endTime}&roomName=${room}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalRequests, requests } = result;
                const sortedData = requests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
                setData(sortedData);
                setFilterData(sortedData);
                setTotalRequests(totalRequests);
                console.log('this is data that got from database: ', sortedData);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSearchInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    const handleSearch = () => {
        const filtered = data.filter(
            (item) => item.studentIdNumber && item.studentIdNumber.toLowerCase().includes(searchInput.toLowerCase()),
        );
        setFilterData(filtered);
    };

    const handleSearchButtonClick = () => {
        setSearchInput(searchValue);
    };

    const handleFilter = (status) => {
        let filtered = data;

        if (status) {
            filtered = filtered.filter((item) => item.resolveStatus === status);
        }

        setFilterData(filtered);
    };

    const handleStatusChange = (e) => {
        const selectedStatus = e.target.value;
        setStatusFilter(selectedStatus);
        handleFilter(selectedStatus);
    };

    const handleRefreshButtonClick = () => {
        const currentTime = new Date().toLocaleTimeString();
        sessionStorage.setItem('refreshTime', currentTime);
        setRefreshTime(currentTime);
        window.location.reload();
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'status-pending';
            case 'resolved':
                return 'status-resolved';
            case 'rejected':
                return 'status-rejected';
            case 'reassigned':
                return 'status-reassigned';
            case 'not reassigned':
                return 'status-notreassigned';
            case 'submitted':
                return 'status-submitted';
            case 'not submitted':
                return 'status-notsubmitted';
            default:
                return '';
        }
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
                    <span style={{ fontSize: 14 }}>View Request</span>{' '}
                </div>
                <h2 className="schedulemanage-management-title">
                    You are in the exam room: {room} Slot: {startTime}-{formatEndTime}{' '}
                </h2>
                <div className="body-container-viewrequest">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        style={{ width: 250 }}
                        type="text"
                        placeholder="Search By Roll No"
                        value={searchValue}
                        onChange={handleSearchInputChange}
                    />
                    <button className="btn btn-primary" onClick={handleSearchButtonClick}>
                        Search
                    </button>
                </div>
                <div className="body-container-viewrequest">
                    <button
                        className="btn btn-primary"
                        onClick={handleRefreshButtonClick}
                        style={{ marginLeft: '10px' }}
                    >
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
                        onChange={handleStatusChange}
                        value={statusFilter}
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Rejected">Rejected</option>
                    </Form.Select>
                </div>
                <Link
                    className="sendrequest-management-link"
                    to={`/sendrequest?startTime=${startTime}&endTime=${endTime}&roomName=${room}`}
                >
                    Send Request
                </Link>
                <div>
                    <table className="viewrequest-table table-striped">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Roll No.</th>
                                <th>Full Name</th>
                                <th>Subject</th>
                                <th>Request</th>
                                <th>Create Time</th>
                                <th>Status</th>
                                <th>My Note</th>
                                <th>Handler's Note</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filterData && filterData.length > 0
                                ? filterData.map((item, index) => (
                                      <tr key={index}>
                                          <td data-title="No :">{index + startIndex}</td>
                                          <td data-title="Roll No :">{item.studentIdNumber}</td>
                                          <td data-title="Full Name :">{item.fullName}</td>
                                          <td data-title="Subject :">{item.subjectCode}</td>
                                          <td data-title="Request :" className="d-flex">
                                              {item.requestTitle}
                                          </td>
                                          <td data-title="Create Time :">{item.requestDate}</td>
                                          <td data-title="Status :">
                                              <span className={`status-text ${getStatusClass(item.resolveStatus)}`}>
                                                  {item.resolveStatus}
                                              </span>
                                          </td>
                                          <td data-title="My Note :">{item.note}</td>
                                          <td data-title="Handler's Note :">{item.responseNote}</td>
                                      </tr>
                                  ))
                                : 'No Data...'}
                        </tbody>
                    </table>
                    <div>
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
            </div>
        </Fragment>
    );
};

export default ViewRequest;
