import {BACKEND_URL} from '../../../constant';
import './ViewRecordsViolations.scss';
import { Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as FileSaver from 'file-saver';
import ExcelJS from 'exceljs';
import { useAuthFetch } from '../../../auth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

const ViewRecordsViolations = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const [isEditMode, setIsEditMode] = useState(false);
    const [status, setStatus] = useState({});
    const authfetch = useAuthFetch();
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalViolations, setTotalViolations] = useState(0);
    const totalPages = Math.ceil(totalViolations / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [refreshTime, setRefreshTime] = useState(sessionStorage.getItem('refreshTime') || null);
    const [notes, setNotes] = useState({});
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFields, setExportFields] = useState({
        no: true,
        fullName: true,
        subjectName: true,
        semester: true,
        roomName: true,
        resolvedEmail: true,
        violationTitle: true,
        reportDate: true,
        resolveDate: true,
        status: true,
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
    const [startDateResolved, setStartDateResolved] = useState(null);
    const [startDateRequest, setStartDateRequest] = useState(null);

    //Filter Violation
    const getCurrentSemester = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const currentYear = year;

        const summerStart = new Date(`May 2, ${year}`);
        const summerEnd = new Date(`August 31, ${year}`);
        const fallStart = new Date(`September 3, ${year}`);
        const fallEnd = new Date(`December 31, ${year}`);
        const springStart = new Date(`January 2, ${year}`);
        const springEnd = new Date(`April 31, ${year}`);

        let currentSemester;
        if (currentDate >= summerStart && currentDate <= summerEnd) {
            currentSemester = `Summer${currentYear}`;
        } else if (currentDate >= fallStart && currentDate <= fallEnd) {
            currentSemester = `Fall${currentYear}`;
        } else if (currentDate >= springStart && currentDate <= springEnd) {
            currentSemester = `Spring${currentYear + 1}`;
        } else {
            currentSemester = `Fall${currentYear}`;
        }

        return currentSemester;
    };
    const [dataExcelViolation, setDataExcelViolation] = useState([]);
    const [timeFilterViolation, setTimeFilterViolation] = useState('');
    const [roomFilterViolation1, setRoomFilterViolation1] = useState('');
    const [violationTitleFilterViolation, setViolationTitleFilterViolation] = useState('');
    const [resolveStatusFilterViolation, setResolveStatusFilterViolation] = useState('');
    const [semesterFilterViolation, setSemesterFilterViolation] = useState([]);

    const [timeOptionsViolation, setTimeOptionsViolation] = useState([]);
    const [roomOptionsViolation, setRoomOptionsViolation] = useState([]);
    const [violationOptionsViolation, setViolationOptionsViolation] = useState([]);
    const [resolveStatusOptionsViolation, setResolveStatusOptionsViolation] = useState([]);
    const [semesterOptionsViolation, setSemesterOptionsViolation] = useState([]);

    const handleExportExcelViolation = async () => {
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
                BACKEND_URL + `/Examiner/ReceiveViolation/ExportViolationStatisticsToExcel?pageNumber=${pageNumber}&FromDate=${fromDateString}&ToDate=${endDateString}&room=${roomFilterViolation1}&violationTitle=${violationTitleFilterViolation}&status=${resolveStatusFilterViolation}&semester=${semesterFilterViolation}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'violation.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDataExcelViolation(response);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            // Handle error
        }
    };

    useEffect(() => {
        if (Array.isArray(dataExcelViolation)) {
            updateRoomAndSubjectOptionsViolation();
        } else {
            console.error('dataExcel is not an array:', dataExcelViolation);
        }
    }, [dataExcelViolation]);

    const handleTimeFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setTimeFilterViolation(selectedOption);
    };
    const handleRoomFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setRoomFilterViolation1(selectedOption);
    };

    const handleRequestFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setViolationTitleFilterViolation(selectedOption);
    };

    const handleResolveStatusFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setResolveStatusFilterViolation(selectedOption);
    };

    const handleSemesterFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilterViolation(selectedOption);
    };

    const updateRoomAndSubjectOptionsViolation = () => {
        const filteredData = dataExcelViolation;
        console.log(filteredData);
        const rooms = getUniqueRoomsViolation(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueTimesViolation(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));
        const requests = getUniqueRequestsViolation(filteredData).map((request) => ({
            value: request,
            label: request,
        }));
        const status = getUniqueStatusViolation(filteredData).map((status) => ({ value: status, label: status }));
        const semesters = getUniqueSemesterViolation(filteredData).map((semester) => ({
            value: semester,
            label: semester,
        }));

        setRoomOptionsViolation(rooms);
        setTimeOptionsViolation(subjects);
        setViolationOptionsViolation(requests);
        setResolveStatusOptionsViolation(status);
        setSemesterOptionsViolation(semesters);
    };

    const getUniqueTimesViolation = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(data.map((item) => item.subjectName).filter((subject) => subject !== undefined)),
        ];
        return uniqueSubjects;
    };

    const getUniqueRoomsViolation = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueRequestsViolation = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueRequests = [
            ...new Set(data.map((item) => item.violationTitle).filter((request) => request !== undefined)),
        ];
        console.log(uniqueRequests);
        return uniqueRequests;
    };

    const getUniqueStatusViolation = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.resolveStatus))];
        return uniqueStatus;
    };
    const getUniqueSemesterViolation = (data) => {
        const uniqueSemester = [...new Set(data.map((item) => item.semester))];
        return uniqueSemester;
    };

    useEffect(() => {
        getData();
        getModalData();
    }, [pageNumber, roomFilterViolation1, violationTitleFilterViolation, resolveStatusFilterViolation]);

    useEffect(() => {
        applyFilters();
    }, [data, filters, searchInput]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/Examiner/ReceiveViolation/GetAllViolationByProctorId?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalViolations, violations } = result;
                const sortedData = violations
                    .map((item) => ({
                        ...item,
                        reportDate: moment(item.reportDate).format('YYYY-MM-DD HH:mm'),
                    }))
                    .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));
                const initialStatus = {};
                sortedData.forEach((item) => {
                    initialStatus[item.violationId] = item.resolveStatus;
                });

                setData(sortedData);
                setFilteredData(sortedData);
                setTotalViolations(totalViolations);
                setStatus(initialStatus);
                console.log('Initial Status:', initialStatus);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const getModalData = () => {
        authfetch(BACKEND_URL + '/Examiner/ReceiveViolation/SearchViolations')
            .then((res) => res.json())
            .then((result) => {
                const semesters = [...new Set(result.map((item) => item.semester))].filter(Boolean);
                const rooms = [...new Set(result.map((item) => item.roomName))].filter(Boolean);
                const statuses = [...new Set(result.map((item) => item.resolveStatus))].filter(Boolean);
                const requests = [...new Set(result.map((item) => item.violationTitle))].filter(Boolean);

                setModalData({
                    semesters,
                    rooms,
                    statuses,
                    requests,
                });
                setDataExcelViolation(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

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
            filtered = filtered.filter((item) => new Date(item.reportDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.reportDate) <= endDate);
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

    const handleStartDateChange = (date) => {
        setStartDate(date);
        applyFilters({ ...filters, startDate: date });
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);
        applyFilters({ ...filters, endDate: date });
    };

    const handleStatusChange = (violationId, value) => {
        setStatus((prevStatus) => ({
            ...prevStatus,
            [violationId]: value,
        }));
    };

    const handleNoteChange = (index, value) => {
        setNotes((prevNotes) => ({
            ...prevNotes,
            [index]: value,
        }));
    };

    const handleSave = async () => {
        const statusUpdates = data
            .map((item, index) => ({
                studentIdNumber: item.studentIdNumber,
                resolveStatus: status[item.violationId] || item.resolveStatus,
                violationId: item.violationId,
                responseNote: notes[index] || '',
            }))
            .filter((update) => update.resolveStatus);

        console.log('Status updates to send:', statusUpdates);

        try {
            const response = await authfetch(BACKEND_URL + '/Examiner/ReceiveViolation/UpdateViolations', {
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
        setIsEditMode(!isEditMode);
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
            <div className="main-container-viewRecord">
                <div className="viewRecord-management-header">
                    <Link className="viewRecord-management-link" to="/examiner">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Handle Violations Records</span>{' '}
                </div>
                <div className="body-container-viewRecord">
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
                <div className="body-container-viewRecord">
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
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        value={filters.room}
                        onChange={(e) => handleFilterChange('room', e.target.value)}
                    >
                        <option value="All">All Room</option>
                        {modalData.rooms.map((room, index) => (
                            <option key={index} value={room}>
                                {room}
                            </option>
                        ))}
                    </Form.Select>
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
                        value={filters.request}
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
                <table className="viewRecord-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Full Name</th>
                            <th>Roll No</th>
                            <th>Subject</th>
                            <th>Room</th>
                            <th>Time</th>
                            <th>Proctor</th>
                            <th>Violation Content</th>
                            <th>Handing Result</th>
                            <th>Violation Handler</th>
                            <th>Resolve Date</th>
                            <th>Proctor's Note</th>
                            <th>Handler's Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0
                            ? filteredData.map((item, index) => (
                                  <tr key={index}>
                                      <td>{index + startIndex}</td>
                                      <td>{item.fullName}</td>
                                      <td>{item.studentIdNumber}</td>
                                      <td>{item.subjectCode}</td>
                                      <td>{item.roomName}</td>
                                      <td>{item.reportDate}</td>
                                      <td>{item.proctorEmail}</td>
                                      <td>{item.violationTitle}</td>
                                      <td>
                                          {isEditMode && item.violationTitle !== 'pending' ? (
                                              <Form.Select
                                                  aria-label="Default select example"
                                                  value={status[item.violationId]}
                                                  onChange={(e) => handleStatusChange(item.violationId, e.target.value)}
                                              >
                                                  <option value="Pending">Pending</option>
                                                  <option value="Warning">Warning</option>
                                                  <option value="Exam suspension">Exam suspension</option>
                                                  <option value="Academic suspension">Academic suspension</option>
                                                  <option value="rejected">rejected</option>
                                              </Form.Select>
                                          ) : item.resolveStatus === 'pending' ? (
                                              <Form.Select
                                                  aria-label="Default select example"
                                                  value={status[item.violationId]}
                                                  onChange={(e) => handleStatusChange(item.violationId, e.target.value)}
                                              >
                                                  <option value="Pending">Pending</option>
                                                  <option value="Warning">Warning</option>
                                                  <option value="Exam suspension">Exam suspension</option>
                                                  <option value="Academic suspension">Academic suspension</option>
                                                  <option value="rejected">rejected</option>
                                              </Form.Select>
                                          ) : (
                                              <span className={`status-text ${getStatusClass(item.resolveStatus)}`}>
                                                  {item.resolveStatus}
                                              </span>
                                          )}
                                      </td>
                                      <td>{item.resolvedEmail}</td>
                                      <td>{item.resolveDate}</td>
                                      <td>{item.note ? item.note : ''}</td>
                                      <td>
                                          {isEditMode || !item.responseNote ? (
                                              <input
                                                  type="text"
                                                  value={notes[index] !== undefined ? notes[index] : item.responseNote}
                                                  onChange={(e) => handleNoteChange(index, e.target.value)}
                                              />
                                          ) : (
                                              <span>{item.responseNote}</span>
                                          )}
                                      </td>
                                  </tr>
                              ))
                            : 'No Data...'}
                    </tbody>
                </table>
                <div>
                    <div className="body-container-handlerequest">
                        {/* <button className="btn btn-primary" onClick={handleSave}>
                            Save
                        </button> */}
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
                    </div>
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
                            <Form.Select className="fixed-width-input" onChange={handleSemesterFilterChangeViolation}>
                                <option value="">Select Semester</option>
                                {semesterOptionsViolation.map((option, index) => (
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
                            <Form.Select className="fixed-width-input" onChange={handleRoomFilterChangeViolation}>
                                <option value="">Select Room</option>
                                {roomOptionsViolation.map((option, index) => (
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
                                onChange={handleRequestFilterChangeViolation}
                            >
                                <option value="">Select Violation Title</option>
                                {violationOptionsViolation.map((option, index) => (
                                    <option key={index} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group controlId="subjectFilter">
                            <Form.Select
                                className="fixed-width-input"
                                onChange={handleResolveStatusFilterChangeViolation}
                            >
                                <option value="">Select Status</option>
                                {resolveStatusOptionsViolation.map((option, index) => (
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
                    <Button variant="primary" onClick={handleExportExcelViolation}>
                        Export
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default ViewRecordsViolations;
