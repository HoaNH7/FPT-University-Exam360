import {BACKEND_URL} from '../../../constant';
import './ReceiveRequest.scss';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment, Select } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch } from '../../../auth';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const ReceiveRequest = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const requestDate = query.get('requestDate');
    const [status, setStatus] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [totalRequests, setTotalRequests] = useState(0);
    const totalPages = Math.ceil(totalRequests / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [isEditMode, setIsEditMode] = useState(false);
    const [notes, setNotes] = useState({});

    //filter
    const [semesterFilter, setSemesterFilter] = useState([]);
    const [requestTitleFilter, setrequestTitleFilter] = useState('');
    const [resolveStatusFilter, setResolveStatusFilter] = useState('');

    const [modalData, setModalData] = useState({
        semesters: [],
        rooms: [],
        statuses: [],
        requests: [],
    });
    const [filters, setFilters] = useState({
        semester: 'All',
        room: 'All',
        status: 'All',
        request: 'All',
    });

    const authfetch = useAuthFetch();

    useEffect(() => {
        getData();
        getModalData();

        // const intervalId = setInterval(() => {
        //     getData();
        // }, 60000);
        // console.log(intervalId);

        // return () => clearInterval(intervalId);
    }, [pageNumber, requestTitleFilter, resolveStatusFilter, semesterFilter]);

    useEffect(() => {
        applyFilters();
    }, [data, filters]);

    useEffect(() => {
        const start = (pageNumber - 1) * pageSize;
        const end = start + pageSize;
        setFilteredData(data.slice(start, end));
    }, [pageNumber, data]);

    const getData = async () => {
        try {
            const response = await authfetch(BACKEND_URL + '/api/HallwayProctor/GetRequestsByTitle');
            const result = await response.json();
            const { totalRequests, requests } = result;

            const sortedData = requests
                .map((item) => ({
                    ...item,
                    requestDate: moment(item.requestDate).format('YYYY-MM-DD HH:mm'),
                }))
                .sort((a, b) => {
                    const statusOrder = {
                        pending: 1,
                        resolved: 2,
                        rejected: 3,
                    };
                    if (statusOrder[a.resolveStatus] !== statusOrder[b.resolveStatus]) {
                        return statusOrder[a.resolveStatus] - statusOrder[b.resolveStatus];
                    }

                    return new Date(b.requestDate) - new Date(a.requestDate);
                });

            const start = (pageNumber - 1) * pageSize;
            const end = start + pageSize;
            const paginatedData = sortedData.slice(start, end);

            setData(sortedData);
            setFilteredData(paginatedData);
            setTotalRequests(totalRequests);
            const initialNotes = {};
            sortedData.forEach((item, index) => {
                initialNotes[index] = item.responseNote || '';
            });

            const initialStatus = {};
            paginatedData.forEach((item, index) => {
                initialStatus[index] = item.resolveStatus;
            });
            setStatus(initialStatus);
            setNotes(initialNotes);
        } catch (error) {
            console.log(error);
        }
    };

    const getModalData = () => {
        authfetch(BACKEND_URL + '/api/HallwayProctor/SearchRequests')
            .then((res) => res.json())
            .then((result) => {
                const semesters = [...new Set(result.map((item) => item.semester))];
                const rooms = [...new Set(result.map((item) => item.roomName))];
                const statuses = [...new Set(result.map((item) => item.resolveStatus))];
                const requests = [...new Set(result.map((item) => item.requestTitle))];
                setModalData({ semesters, rooms, statuses, requests });

                setModalData({
                    semesters,
                    rooms,
                    statuses,
                    requests,
                });
            })
            .catch((error) => {
                console.log(error);
            });
    };

    //----------------------
    const handleSearch = () => {
        const updatedFilters = { ...filters, studentIdNumber: searchInput };
        applyFilters(updatedFilters);
    };

    const applyFilters = (updatedFilters = filters) => {
        let filtered = [...data]; // Create a copy of the data

        if (updatedFilters.status !== 'All') {
            filtered = filtered.filter((item) => item.resolveStatus === updatedFilters.status);
        }

        // Filter by request
        if (updatedFilters.request !== 'All') {
            filtered = filtered.filter((item) => item.requestTitle === updatedFilters.request);
        }

        if (updatedFilters.studentIdNumber) {
            filtered = filtered.filter((item) =>
                item.studentIdNumber.toLowerCase().includes(updatedFilters.studentIdNumber.toLowerCase()),
            );
        }

        setFilteredData(filtered); // Update the filtered data state
    };

    const handleFilterChange = (filterName, value) => {
        setFilters((prevFilters) => {
            const updatedFilters = { ...prevFilters, [filterName]: value };
            applyFilters(updatedFilters);
            return updatedFilters;
        });
    };

    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
    };

    const handleNoteChange = (index, value) => {
        setNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
    };

    const handleStatusChange = async (index, value) => {
        const newNotes = { ...notes };
        setStatus((prevStatus) => ({
            ...prevStatus,
            [index]: value,
        }));

        const statusUpdates = filteredData
            .map((item, idx) => ({
                studentIdNumber: data[index].studentIdNumber,
                resolveStatus: value,
                requestId: data[index].requestId,
                responseNote: newNotes[index] || '',
            }))
            .filter(
                (update) =>
                    update.resolveStatus &&
                    (isEditMode || update.resolveStatus !== 'Pending' || update.requestTitle === 'Reset Password'),
            );

        console.log('Status updates to send:', statusUpdates);

        try {
            const response = await authfetch(BACKEND_URL + '/api/HallwayProctor/UpdateRequests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(statusUpdates),
            });

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
                // No need to change isEditMode here if it should remain in edit mode
                await getData();
                toast.success('Status updated successfully');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while updating status: ${error.message}`);
        }
    };

    const handleRefreshButtonClick = () => {
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
            default:
                return '';
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-handlerequest">
                <div className="handlerequest-management-header">
                    <Link className="handlerequest-management-link" to="/hallwayProctor">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Receive Request</span>{' '}
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        type="text"
                        placeholder="Search by Roll No"
                        value={searchInput}
                        onChange={handleSearchInputChange}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleRefreshButtonClick}
                        style={{ marginLeft: '10px' }}
                    >
                        Refresh
                    </button>
                </div>
                <div className="body-container-examcode">
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="All">All Status</option>
                        {modalData.statuses.map((status, index) => (
                            <option key={index} value={status}>
                                {status}
                            </option>
                        ))}
                    </Form.Select>
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        value={filters.requestTitle}
                        onChange={(e) => handleFilterChange('request', e.target.value)}
                    >
                        <option value="All">All Request</option>
                        {modalData.requests.map((request, index) => (
                            <option key={index} value={request}>
                                {request}
                            </option>
                        ))}
                    </Form.Select>
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
                                      <td data-title="Request Date">{item.requestDate}</td>
                                      <td data-title="Status">
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
                                      <td data-title="Note">{item.note}</td>
                                      <td>
                                          <input
                                              type="text"
                                              value={notes[index] !== undefined ? notes[index] : item.responseNote}
                                              onChange={(e) => handleNoteChange(index, e.target.value)}
                                          />
                                      </td>
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
        </Fragment>
    );
};

export default ReceiveRequest;
