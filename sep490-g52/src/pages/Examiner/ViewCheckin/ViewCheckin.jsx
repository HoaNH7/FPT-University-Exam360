import {BACKEND_URL} from '../../../constant';
import './ViewCheckin.scss';
import { ToastContainer } from 'react-toastify';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment/moment';
import ListStudentCheckIn from './ListStudentCheckInPopup';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as FileSaver from 'file-saver';
import ExcelJS from 'exceljs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ViewCheckin = () => {
    const [data, setData] = useState([]);
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');
    const room = query.get('roomName');
    const authfetch = useAuthFetch();
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + pageSize - 1, totalCount);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const defaultImage = '/default-avatar.jpg';

    //filter
    const [dataExcel, setDataExcel] = useState([]);
    const [semesterFilter, setSemesterFilter] = useState([]);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [roomFilter, setRoomFilter] = useState('');

    const [semesterOptions, setSemesterOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [roomOptions, setRoomOptions] = useState([]);

    const [showExportModal, setShowExportModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        fetchData();
        fetchData1();
    }, [pageNumber, roomFilter, subjectFilter, semesterFilter]);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
    };

    //Export
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
                BACKEND_URL + `/api/Export/ExportCheckInToExcel?FromDate=${fromDateString}&ToDate=${endDateString}&room=${roomFilter}&subjectCode=${subjectFilter}&semester=${semesterFilter}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'CheckIn.xlsx');
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

    const updateRoomAndSubjectOptions = () => {
        const filteredData = dataExcel;
        const rooms = getUniqueRooms(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjects(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));
        const semesters = getUniqueSemester(filteredData).map((semester) => ({ value: semester, label: semester }));

        setRoomOptions(rooms);
        setSubjectOptions(subjects);
        setSemesterOptions(semesters);
    };

    const getUniqueSubjects = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(
                data
                    .map((item) => item.students.map((students) => students.subjectCode))
                    .filter((subject) => subject !== undefined),
            ),
        ];
        return uniqueSubjects;
    };

    const getUniqueRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueSemester = (data) => {
        const uniqueSemester = [...new Set(data.map((item) => item.semester))];
        return uniqueSemester;
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

    const [filters, setFilters] = useState({
        semester: 'All',
        room: 'All',
        status: 'All',
        request: 'All',
    });

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
            filtered = filtered.filter((item) => item.rollNo.toLowerCase().includes(searchInput.toLowerCase()));
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

    //---------------

    const fetchData = () => {
        authfetch(
            BACKEND_URL + `/Examiner/ListStudentCheckIn/GetAllStudentsGroupedBySchedule?pageNumber=${pageNumber}`,
        )
            .then((res) => res.json())
            .then((result) => {
                setData(result.studentRecords);
                setTotalCount(result.totalCount);
                console.log('this is data in view student page :', result.studentRecords);
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const fetchData1 = () => {
        authfetch(BACKEND_URL + `/Examiner/ListStudentCheckIn/GetAllStudentsGroupedBySchedule`)
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, groupedResult } = result;

                const updatedData = groupedResult.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    time: moment(item.startTime).format('HH:mm') + ' - ' + moment(item.endTime).format('HH:mm'),
                }));

                // setData(updatedData);
                setTotalCount(totalCount);
                setDataExcel(updatedData);
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-viewcheckin">
                <div className="viewcheckin-management-header">
                    <Link className="viewcheckin-management-link" to={'/examiner'}>
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}>View Check In</span>
                </div>
                <div className="body-container-viewcheckin">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input style={{ width: 250 }} type="text" placeholder="Search by Roll No." />
                    <button className="btn btn-primary">Search</button>
                    <button className="btn btn-warning" onClick={() => setShowExportModal(true)}>
                        Export
                    </button>
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 22 }}>Filter: </span>
                    <Form.Select
                        className="form-select-examcode fs-6"
                        aria-label="Default select example"
                        style={{ marginRight: 16 }}
                    >
                        <option value="All">All Status</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </Form.Select>
                    <Form.Select
                        className="form-select-examcode fs-6"
                        aria-label="Default select example"
                        style={{ marginRight: 16 }}
                    >
                        <option value="All">All Room</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </Form.Select>
                    <Form.Select
                        className="form-select-examcode fs-6"
                        aria-label="Default select example"
                        style={{ marginRight: 16 }}
                    >
                        <option value="All">All Subject</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </Form.Select>
                    <Form.Select
                        className="form-select-examcode fs-6"
                        aria-label="Default select example"
                        style={{ marginRight: 16 }}
                    >
                        <option value="All">All Time</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </Form.Select>
                </div>
                <div>
                    <table className="viewcheckin-table table-striped">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Roll No</th>
                                <th>Room</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Citizen Identity</th>
                                <th>IsCheckIn</th>
                                <th>Subject Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr key={item.studentId}>
                                        <td>{index}</td>
                                        <td>
                                            <img
                                                src={item.image || defaultImage}
                                                alt="User Image"
                                                className="user-image"
                                                style={{ width: '100px', height: '100px' }}
                                            />
                                        </td>
                                        <td>{item.fullName}</td>
                                        <td>{item.email}</td>
                                        <td>{item.rollNo}</td>
                                        <td
                                        // Uncomment to add functionality for handling room clicks
                                        // onClick={() => handleRoomClick(item)}
                                        // style={{ cursor: 'pointer', color: '#1A6BED' }}
                                        >
                                            {item.roomName}
                                        </td>
                                        <td>{item.startTime}</td>
                                        <td>{item.endTime}</td>
                                        <td>{item.citizenIdentity}</td>
                                        <td>{item.isCheckin ? 'Present' : 'Absent'}</td>
                                        <td>{item.subjectCode}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10">No Data...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div>
                        <p>
                            Showing {startIndex} to {endIndex} of {totalCount} students
                        </p>
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

                {/* Export Modal */}
                <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Export CheckIn Options</Modal.Title>
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
                                    onChange={handleSubjectFilterChange}
                                >
                                    <option value="">Select Subject Code</option>
                                    {subjectOptions.map((option, index) => (
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
                <div>
                    {selectedRoom && <ListStudentCheckIn room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
                </div>
            </div>
        </Fragment>
    );
};

export default ViewCheckin;
