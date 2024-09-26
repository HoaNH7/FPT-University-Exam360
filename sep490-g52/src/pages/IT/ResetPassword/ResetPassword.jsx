import {BACKEND_URL} from '../../../constant';
import './ResetPassword.scss';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch } from '../../../auth';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const ResetPassword = () => {
    const [data, setData] = useState([]);
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const requestDate = query.get('requestDate');
    const [status, setStatus] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalRequests, setTotalRequests] = useState(0);
    const totalPages = Math.ceil(totalRequests / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [filteredData, setFilteredData] = useState([]);
    const [notes, setNotes] = useState({});
    const authfetch = useAuthFetch();
    const [searchRollNo, setSearchRollNo] = useState('');

    useEffect(() => {
        getData();
    }, [pageNumber]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/ITStaffReceiveRequestResetPassword/GetAllRequestResetPassword?${requestDate}&pageNumber=1&pageSize=1000`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalRequests, requests } = result;

                // Sắp xếp toàn bộ dữ liệu theo yêu cầu
                const sortedData = requests
                    .map((item) => ({
                        ...item,
                        requestDate: moment(item.requestDate).format('YYYY-MM-DD HH:mm'),
                    }))
                    .sort((a, b) => {
                        const statusOrder = { pending: 1, resolved: 2, rejected: 3 };
                        if (statusOrder[a.resolveStatus] !== statusOrder[b.resolveStatus]) {
                            return statusOrder[a.resolveStatus] - statusOrder[b.resolveStatus];
                        }
                        return new Date(b.requestDate) - new Date(a.requestDate);
                    });

                const totalPages = Math.ceil(totalRequests / pageSize);
                const startIndex = (pageNumber - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, sortedData.length);
                const paginatedData = sortedData.slice(startIndex, endIndex);

                setData(sortedData);
                setFilteredData(paginatedData);
                setTotalRequests(totalRequests);

                const initialStatus = {};
                const initialNotes = {};
                sortedData.forEach((item, index) => {
                    initialNotes[index] = item.responseNote || '';
                });
                paginatedData.forEach((item, index) => {
                    initialStatus[index] = item.resolveStatus;
                });
                setStatus(initialStatus);
                setNotes(initialNotes);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleStatusChange = async (index, value) => {
        const newNotes = { ...notes };

        if (value === 'resolved') {
            newNotes[index] = '123456789';
        } else {
            newNotes[index] = '';
        }

        setStatus((prevStatus) => ({
            ...prevStatus,
            [index]: value,
        }));
        setNotes(newNotes);

        const statusUpdate = {
            studentIdNumber: data[index].studentIdNumber,
            resolveStatus: value,
            requestId: data[index].requestId,
            responseNote: newNotes[index] || '',
        };

        console.log(statusUpdate);

        try {
            const response = await authfetch(
                BACKEND_URL + '/ITStaffReceiveRequestResetPassword/HandleRequestResetPassword',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify([statusUpdate]),
                },
            );

            const contentType = response.headers.get('content-type');
            let responseData;

            if (contentType && contentType.indexOf('application/json') !== -1) {
                responseData = await response.json();
            } else {
                responseData = await response.text();
            }

            if (!response.ok) {
                throw new Error(responseData.message || responseData || 'Server error');
            }

            if (responseData.success) {
                toast.error('Failed to update status');
            } else {
                getData();
                toast.success('Status updated successfully');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while updating status: ${error.message}`);
        }
    };

    const handleNoteChange = (index, value) => {
        setNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
    };

    const handleSearch = () => {
        if (searchRollNo) {
            const filtered = data.filter((item) =>
                item.studentIdNumber.toLowerCase().includes(searchRollNo.toLowerCase()),
            );
            setFilteredData(filtered);
        } else {
            setFilteredData(data);
        }
    };
    console.log(data);
    const getStatusClass = (status) => {
        switch (status) {
            case 'pending':
                return 'status-pending';
            case 'resolved':
                return 'status-resolved';
            case 'rejected':
                return 'status-rejected';
            default:
                return '';
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-handlerequest">
                <div className="handlerequest-management-header">
                    <Link className="handlerequest-management-link" to="/itstaff">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Reset Password</span>{' '}
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        type="text"
                        placeholder="Search by Roll No"
                        value={searchRollNo}
                        onChange={(e) => setSearchRollNo(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                </div>
                <table className="handlerequest-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Roll No</th>
                            <th>Full Name</th>
                            <th>Subject</th>
                            <th>Room</th>
                            <th>Proctor</th>
                            <th>Request</th>
                            <th>Request Date</th>
                            <th>Status</th>
                            <th>Proctor's Note</th>
                            <th>Request Handler</th>
                            <th>Handler's Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0
                            ? filteredData.map((item, index) => (
                                  <tr key={index}>
                                      <td data-title="No">{index + startIndex}</td>
                                      <td data-title="Roll No">{item.studentIdNumber}</td>
                                      <td data-title="Full Name">{item.fullName}</td>
                                      <td data-title="Subject">{item.subjectCode}</td>
                                      <td data-title="Room Name">{item.roomName}</td>
                                      <td data-title="Proctor Name">{item.proctorEmail}</td>
                                      <td data-title="Request">{item.requestTitle}</td>
                                      <td data-title="Request">{item.requestDate}</td>
                                      <td>
                                          <Form.Select
                                              as="select"
                                              value={status[index]}
                                              onChange={(e) => handleStatusChange(index, e.target.value)}
                                          >
                                              <option value="pending">pending</option>
                                              <option value="resolved">resolved</option>
                                              <option value="rejected">rejected</option>
                                          </Form.Select>
                                      </td>
                                      <td>{item.note}</td>
                                      <td>{item.requestHandlerEmail}</td>
                                      <td>
                                          <input
                                              type="text"
                                              value={
                                                  notes[index] !== undefined ? notes[index] : item.responseNote || ''
                                              }
                                              onChange={(e) => handleNoteChange(index, e.target.value)}
                                          />
                                      </td>
                                  </tr>
                              ))
                            : 'No Data...'}
                    </tbody>
                </table>
                <div>
                    <ul className="pagination" style={{ marginTop: 10 }}>
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
        </Fragment>
    );
};

export default ResetPassword;
