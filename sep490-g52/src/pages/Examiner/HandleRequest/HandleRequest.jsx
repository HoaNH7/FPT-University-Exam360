import {BACKEND_URL} from '../../../constant';
import './HandleRequest.scss';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment, Select } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as FileSaver from 'file-saver';
import ExcelJS from 'exceljs';
import DatePicker from 'react-datepicker';
import { useAuthFetch } from '../../../auth';
import 'react-datepicker/dist/react-datepicker.css';
import { useCurrentUserInfo } from '../../../auth';
import moment from 'moment';

const HandleRequest = () => {
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
    const [refreshTime, setRefreshTime] = useState(sessionStorage.getItem('refreshTime') || null);
    const [notes, setNotes] = useState({});
    const [responseNotes, setResponseNotes] = useState({});
    const user = useCurrentUserInfo();

    //filter
    const [dataExcel, setDataExcel] = useState([]);
    const [semesterFilter, setSemesterFilter] = useState([]);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [roomFilter, setRoomFilter] = useState('');
    const [requestTitleFilter, setrequestTitleFilter] = useState('');
    const [resolveStatusFilter, setResolveStatusFilter] = useState('');

    const [semesterOptions, setSemesterOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [roomOptions, setRoomOptions] = useState([]);
    const [requestOptions, setRequestOptions] = useState([]);
    const [resolveStatusOptions, setResolveStatusOptions] = useState([]);
    //----------------------

    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFields, setExportFields] = useState({
        no: true,
        fullName: true,
        subjectName: true,
        semester: true,
        roomName: true,
        proctorEmail: true,
        requestDate: true,
        resolveDate: true,
        requestTitle: true,
        resolveStatus: true,
    });
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
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
    }, [pageNumber]);

    useEffect(() => {
        getData();
        getModalData();

        const intervalId = setInterval(() => {
            getData();
        }, 60000);
        console.log(intervalId);

        return () => clearInterval(intervalId);
    }, [roomFilter, subjectFilter, requestTitleFilter, resolveStatusFilter, semesterFilter]);

    useEffect(() => {
        applyFilters();
    }, [data, filters]);

    const handleExportExcel = async () => {
        const fromDateString = startDate
            ? startDate.getFullYear() +
              '-' +
              (startDate.getMonth() + 1).toString().padStart(2, '0') +
              '-' +
              startDate.getDate().toString().padStart(2, '0')
            : '';
        const endDateString = endDate
            ? endDate.getFullYear() +
              '-' +
              (endDate.getMonth() + 1).toString().padStart(2, '0') +
              '-' +
              endDate.getDate().toString().padStart(2, '0')
            : '';

        try {
            const response = await authfetch(
                BACKEND_URL + `/Examiner/ReceiveRequest/ExportRequestsToExcel?FromDate=${fromDateString}&ToDate=${endDateString}&requestTitle=${requestTitleFilter}&room=${roomFilter}&status=${resolveStatusFilter}&semester=${semesterFilter}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'requests.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDataExcel(response);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            // Handle error
        }
    };

    const getData = () => {
        authfetch(
            BACKEND_URL + `/Examiner/ReceiveRequest/GetAllRequestByProctorId?&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalRequests, requests } = result;

                const statusPriority = {
                    pending: 1,
                    resolved: 2,
                    reassigned: 3,
                    submitted: 4,
                    rejected: 5,
                    'not reassigned': 6,
                    'not submitted': 7,
                };

                const sortedData = requests
                    .map((item) => ({
                        ...item,
                        requestDate: moment(item.requestDate).format('YYYY-MM-DD HH:mm'),
                    }))
                    .sort((a, b) => {
                        const statusComparison = statusPriority[a.resolveStatus] - statusPriority[b.resolveStatus];
                        if (statusComparison !== 0) {
                            return statusComparison;
                        }

                        return new Date(b.requestDate) - new Date(a.requestDate);
                    });

                setData(sortedData);
                setFilteredData(sortedData);
                setTotalRequests(totalRequests);
                setStatus(sortedData.map((item) => item.resolveStatus));
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const getModalData = () => {
        authfetch(BACKEND_URL + '/Examiner/ReceiveRequest/SearchRequests')
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
                setDataExcel(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    //Filter
    useEffect(() => {
        if (Array.isArray(dataExcel)) {
            updateRoomAndSubjectOptions();
        } else {
            console.error('dataExcel is not an array:', dataExcel);
        }
    }, [dataExcel]);

    const handleSemesterFilterChange = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilter(selectedOption);
    };

    const handleSubjectFilterChange = (e) => {
        const selectedOption = e.target.value;
        setSubjectFilter(selectedOption);
    };
    const handleRoomFilterChange = (e) => {
        const selectedOption = e.target.value;
        setRoomFilter(selectedOption);
    };

    const handleRequestFilterChange = (e) => {
        const selectedOption = e.target.value;
        setrequestTitleFilter(selectedOption);
    };

    const handleResolveStatusFilterChange = (e) => {
        const selectedOption = e.target.value;
        setResolveStatusFilter(selectedOption);
    };

    const updateRoomAndSubjectOptions = () => {
        const filteredData = dataExcel;
        const rooms = getUniqueRooms(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjects(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));
        const requests = getUniqueRequests(filteredData).map((request) => ({ value: request, label: request }));
        const status = getUniqueStatus(filteredData).map((status) => ({ value: status, label: status }));
        const semesters = getUniqueSemester(filteredData).map((semester) => ({ value: semester, label: semester }));

        setRoomOptions(rooms);
        setSubjectOptions(subjects);
        setRequestOptions(requests);
        setResolveStatusOptions(status);
        setSemesterOptions(semesters);
    };

    const getUniqueSubjects = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(data.map((item) => item.subjectName).filter((subject) => subject !== undefined)),
        ];
        return uniqueSubjects;
    };

    const getUniqueRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueRequests = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueRequests = [
            ...new Set(data.map((item) => item.requestTitle).filter((request) => request !== undefined)),
        ];
        return uniqueRequests;
    };

    const getUniqueStatus = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.resolveStatus))];
        return uniqueStatus;
    };

    // const getUniqueSemester = (data) => {
    //     const uniqueSemester = [...new Set(data.map((item) => item.semester))];
    //     return uniqueSemester;
    // };

    const getUniqueSemester = (data) => {
        const uniqueSemester = [...new Set(data.map((item) => item.semester))];
        return uniqueSemester;
    };

    //----------------------
    const handleSearch = () => {
        applyFilters();
    };

    const applyFilters = (updatedFilters = filters) => {
        let filtered = [...data]; // Create a copy of the data

        // Filter by semester
        if (updatedFilters.semester !== 'All') {
            filtered = filtered.filter((item) => item.semester === updatedFilters.semester);
        }

        // Filter by room
        if (updatedFilters.room !== 'All') {
            filtered = filtered.filter((item) => item.roomName === updatedFilters.room);
        }

        // Filter by status
        if (updatedFilters.status !== 'All') {
            filtered = filtered.filter((item) => item.resolveStatus === updatedFilters.status);
        }

        // Filter by request
        if (updatedFilters.request !== 'All') {
            filtered = filtered.filter((item) => item.requestTitle === updatedFilters.request);
        }

        // Filter by search input
        if (searchInput) {
            filtered = filtered.filter((item) =>
                item.studentIdNumber.toLowerCase().includes(searchInput.toLowerCase()),
            );
        }

        // Filter by start date
        if (startDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) <= endDate);
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
        const value = e.target.value;
        setSearchInput(value);
        applyFilters({ ...filters, searchInput: value });
    };

    const handleExportCheckboxChange = (e) => {
        setExportFields({
            ...exportFields,
            [e.target.name]: e.target.checked,
        });
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);
        console.log(date);
        applyFilters({ ...filters, startDate: date });
    };

    const handleEndDateChange = (date) => {
        if (date) {
            const updatedDate = new Date(date);
            updatedDate.setHours(23, 59, 59, 999); // Thêm 23:59:59
            setEndDate(updatedDate);
            applyFilters({ ...filters, endDate: updatedDate });
        } else {
            setEndDate(null);
            applyFilters({ ...filters, endDate: null });
        }
    };

    const handleStatusChange = async (index, value) => {
        const newStatus = [...status];
        newStatus[index] = value;
        setStatus(newStatus);

        const currentItem = filteredData[index];
        const statusUpdate = {
            studentIdNumber: currentItem.studentIdNumber,
            resolveStatus: value,
            responseNote: responseNotes[index] || '',
            requestId: currentItem.requestId,
        };

        console.log(statusUpdate);

        try {
            const response = await authfetch(BACKEND_URL + '/Examiner/ReceiveRequest/UpdateRequests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([statusUpdate]),
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
                toast.success('Status updated successfully');
                getData();
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while updating status: ${error.message}`);
        }
    };

    const handleSave = async () => {
        const statusUpdates = filteredData.map((item, index) => ({
            studentIdNumber: item.studentIdNumber,
            resolveStatus: status[index] || item.resolveStatus,
            responseNote: responseNotes[index] || '',
            requestId: item.requestId,
        }));
        // .filter(
        //     (update) =>
        //         update.resolveStatus &&
        //         update.resolveStatus !==
        //             filteredData.find((item) => item.requestId === update.requestId)?.resolveStatus, // Chỉ gửi các bản cập nhật nếu trạng thái đã thay đổi
        // );

        try {
            const response = await authfetch(BACKEND_URL + '/Examiner/ReceiveRequest/UpdateRequests', {
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
                setIsEditMode(false);
                getData();
                toast.success('Status updated successfully');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while updating status: ${error.message}`);
        }
    };

    const handleEdit = () => {
        if (!isEditMode) {
            setStatus(filteredData.map((item) => item.resolveStatus));
        }
        setIsEditMode(!isEditMode);
    };

    const handleRefreshButtonClick = () => {
        const currentTime = new Date().toLocaleTimeString();
        sessionStorage.setItem('refreshTime', currentTime);
        setRefreshTime(currentTime);
        window.location.reload();
    };

    const handleNoteChange = (index, value) => {
        setNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
    };
    const handleResponseNoteChange = (index, value) => {
        setResponseNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
    };

    const saveResponseNote = async (index, note) => {
        const currentItem = filteredData[index];
        const statusUpdate = {
            studentIdNumber: currentItem.studentIdNumber,
            resolveStatus: status[index],
            responseNote: note,
            requestId: currentItem.requestId,
        };

        console.log(statusUpdate);

        try {
            const response = await authfetch(BACKEND_URL + '/Examiner/ReceiveRequest/UpdateRequests', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([statusUpdate]),
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
                toast.success('Response note saved successfully');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`An error occurred while saving response note: ${error.message}`);
        }
    };

    // const handleKeyDown = (index, event) => {
    //     if (event.key === 'Enter') {
    //         event.preventDefault();
    //         saveResponseNote(index, responseNotes[index]);
    //     }
    // };
    const handleBlur = (index, event) => {
        if (responseNotes[index] !== filteredData[index].responseNote) {
            saveResponseNote(index, responseNotes[index]);
        }
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

    const textStatusTitles = [
        'Reset Password',
        'Provide scratch paper',
        'Proctor the exam on behalf of the exam room invigilator',
        'Issue a violation report',
        'Provide exam tools (pen, ruler, calculator)',
    ];

    const getSelectOptions = (title) => {
        switch (title) {
            case 'Reassign':
                return (
                    <>
                        <option value="pending">pending</option>
                        <option value="reassigned">reassigned</option>
                        <option value="not reassigned">not reassigned</option>
                    </>
                );
            case 'Check Submit':
                return (
                    <>
                        <option value="pending">pending</option>
                        <option value="submitted">submitted</option>
                        <option value="not submitted">not submitted</option>
                    </>
                );
            default:
                return (
                    <>
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                        <option value="rejected">rejected</option>
                    </>
                );
        }
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-handlerequest">
                <div className="handlerequest-management-header">
                    <Link className="handlerequest-management-link" to="/examiner">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Handle Request</span>{' '}
                </div>
                <div className="body-container-handlerequest">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input
                        type="text"
                        placeholder="Search by Roll No"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                    <button className="btn btn-warning" onClick={() => setShowExportModal(true)}>
                        Export
                    </button>
                </div>
                <div className="body-container-handlerequest">
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
                <div className="body-container-handlerequest">
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
                            {/* <th>Exam Code</th> */}
                            <th>Subject</th>
                            <th>Room</th>
                            <th>Proctor</th>
                            <th>Request</th>
                            <th>Request Date</th>
                            <th>Status</th>
                            <th>Request Handler</th>
                            <th>Resolve Date</th>
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
                                      {/* <td data-title="Exam Code">{item.examCode}</td> */}
                                      <td data-title="Subject">{item.subjectCode}</td>
                                      <td data-title="Room Name">{item.roomName}</td>
                                      <td data-title="Proctor Name">{item.proctorEmail}</td>
                                      <td data-title="Request">{item.requestTitle}</td>
                                      <td data-title="Request Date">{item.requestDate}</td>
                                      <td data-title="Status">
                                          {textStatusTitles.includes(item.requestTitle) ? (
                                              <span className={`status-text ${getStatusClass(item.resolveStatus)}`}>
                                                  {item.resolveStatus}
                                              </span>
                                          ) : (
                                              <Form.Select
                                                  as="select"
                                                  value={status[index]}
                                                  onChange={(e) => handleStatusChange(index, e.target.value)}
                                              >
                                                  {getSelectOptions(item.requestTitle)}
                                              </Form.Select>
                                          )}
                                      </td>
                                      <td>{item.requestHandlerEmail}</td>
                                      <td>{item.resolveDate}</td>
                                      <td>{item.note}</td>
                                      <td data-title="Handler's Note">
                                          {textStatusTitles.includes(item.requestTitle) ? (
                                              <span>{item.responseNote || '-'}</span>
                                          ) : (
                                              <Form.Control
                                                  as="textarea"
                                                  rows={1}
                                                  value={responseNotes[index] || item.responseNote || ''}
                                                  onChange={(e) => handleResponseNoteChange(index, e.target.value)}
                                                  onBlur={(e) => handleBlur(index, e)}
                                              />
                                          )}
                                      </td>
                                  </tr>
                              ))
                            : 'No Data...'}
                    </tbody>
                </table>
                <div>
                    {/* <div className="body-container-handlerequest">
                        {!isEditMode && (
                            <div>
                                <button style={{ marginRight: 10 }} className="btn btn-primary" onClick={handleEdit}>
                                    Edit
                                </button>
                                <button className="btn btn-primary" onClick={handleSave}>
                                    Save
                                </button>
                            </div>
                        )}
                        {isEditMode && (
                            <button className="btn btn-primary" onClick={handleSave}>
                                Save
                            </button>
                        )}
                    </div> */}
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

            {/* Export Modal */}
            <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Export Request Options</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="body-container-handlerequest1">
                        <Form.Group controlId="subjectFilter">
                            <Form.Select className="fixed-width-input" onChange={handleSemesterFilterChange}>
                                <option value="">Select Semester</option>
                                {semesterOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <div>
                            <label>From Date</label>
                            <DatePicker
                                className="form-select-datepicker"
                                selected={startDate}
                                onChange={handleStartDateChange}
                                placeholderText="Start Date"
                            />
                        </div>
                        <div>
                            <label>To Date</label>
                            <DatePicker
                                className="form-select-datepicker"
                                selected={endDate}
                                onChange={handleEndDateChange}
                                placeholderText="End Date"
                            />
                        </div>
                    </div>
                    <div className="body-container-handlerequest">
                        <Form.Group controlId="subjectFilter">
                            <Form.Select className="fixed-width-input" onChange={handleRoomFilterChange}>
                                <option value="">Select Room</option>
                                {roomOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="subjectFilter">
                            <Form.Select
                                style={{ marginRight: '14px' }}
                                className="fixed-width-input"
                                onChange={handleRequestFilterChange}
                            >
                                <option value="">Select A Request Title</option>
                                {requestOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="subjectFilter">
                            <Form.Select className="fixed-width-input" onChange={handleResolveStatusFilterChange}>
                                <option value="">Select Status</option>
                                {resolveStatusOptions.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleExportExcel}>
                        Export
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default HandleRequest;
