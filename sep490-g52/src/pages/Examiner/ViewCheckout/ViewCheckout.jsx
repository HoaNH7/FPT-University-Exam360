import {BACKEND_URL} from '../../../constant';
import './ViewCheckout.scss';
import { ToastContainer } from 'react-toastify';
import { useCurrentUserInfo } from '../../../auth';
import { useAuthFetch } from '../../../auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import Form from 'react-bootstrap/Form';
import moment from 'moment';
import Select from 'react-select';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as FileSaver from 'file-saver';
import ExcelJS from 'exceljs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ListStudentCheckoutPopup from './ListStudentCheckoutPopup';

const ViewCheckout = () => {
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

    const [data, setData] = useState([]);
    const [dataAll, setDataAll] = useState([]);
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
    const defaultImage = '/default-avatar.jpg';
    const [roomFilter, setRoomFilter] = useState('');
    const [roomStudentOptions, setRoomStudentOptions] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);

    //filter
    const [dataExcel, setDataExcel] = useState([]);
    const [semesterFilter, setSemesterFilter] = useState(getCurrentSemester());
    const [subjectFilter, setSubjectFilter] = useState('');
    const [roomFilter1, setRoomFilter1] = useState('');
    const [isCheckoutFilter, setIsCheckoutFilter] = useState('');

    const [semesterOptions, setSemesterOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [roomOptions1, setRoomOptions1] = useState([]);
    const [isCheckoutOptions, setIsCheckoutOptions] = useState([]);

    const [showExportModal, setShowExportModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {
        fetchData();
        getAllData();
    }, [pageNumber, roomFilter, semesterFilter, subjectFilter, roomFilter1, isCheckoutFilter]);

    useEffect(() => {
        handleFilter();
    }, [data]);

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
                BACKEND_URL + `/api/Export/ExportCheckOutToExcel?fromDate=${fromDateString}&endDate=${endDateString}&subjectCode=${subjectFilter}&room=${roomFilter1}&isCheckout=${isCheckoutFilter}&semester=${semesterFilter}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'checkout.xlsx');
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
    const handleRoomFilterChange1 = (e) => {
        const selectedOption = e.target.value;
        setRoomFilter1(selectedOption);
    };
    const handleIsCheckoutFilterChange = (e) => {
        const selectedOption = e.target.value;
        setIsCheckoutFilter(selectedOption);
    };

    const updateRoomAndSubjectOptions = () => {
        const filteredData = dataExcel;
        const rooms = getUniqueRooms1(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjects(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));
        const semesters = getUniqueSemester(filteredData).map((semester) => ({ value: semester, label: semester }));
        const isCheckouts = getUniqueIsCheckout(filteredData).map((isCheckout) => ({
            value: isCheckout,
            label: isCheckout,
        }));

        setRoomOptions1(rooms);
        setSubjectOptions(subjects);
        setSemesterOptions(semesters);
        setIsCheckoutOptions(isCheckouts);
    };

    // const getUniqueSemester = (data) => {
    //     const allSemester = data.flatMap((item) => item.students.map((student) => student.semester));
    //     const uniqueSemester = [...new Set(allSemester)];
    //     console.log(uniqueSemester);
    //     return uniqueSemester;
    // };

    const getUniqueSemester = (data) => {
        const uniqueSemester = [...new Set(data.flatMap((item) => item.students.map((student) => student.semester)))];
        console.log(uniqueSemester);
        return uniqueSemester;
    };

    const getUniqueRooms1 = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueSubjects = (data) => {
        const allSubjectCodes = data.flatMap((item) => item.students.map((student) => student.subjectCode));
        const uniqueSubjects = [...new Set(allSubjectCodes)];
        console.log(uniqueSubjects);
        return uniqueSubjects;
    };

    const getUniqueIsCheckout = (data) => {
        // Dùng flatMap để kết hợp và map để duyệt qua từng sinh viên trong mỗi mục
        const allCheckout = data.flatMap((item) =>
            item.students.map((student) => (student.isCheckout ? 'Checked Out' : 'Not CheckedOut')),
        );
        // Dùng Set để loại bỏ các giá trị trùng lặp
        const uniqueIsCheckout = [...new Set(allCheckout)];
        console.log(uniqueIsCheckout);
        return uniqueIsCheckout;
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
        const queryParams = new URLSearchParams({
            pageNumber: pageNumber,
            pageSize: pageSize,
        });

        if (roomFilter) {
            queryParams.append('room', roomFilter);
        }
        const url = BACKEND_URL + `/Examiner/ListStudentCheckOut/GetAllStudentsGroupedBySchedule?${queryParams.toString()}`;
        authfetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, groupedResult } = result;

                const updatedData = groupedResult.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    time: moment(item.startTime).format('HH:mm') + ' - ' + moment(item.endTime).format('HH:mm'),
                }));

                setData(updatedData);
                setTotalCount(totalCount);
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const getAllData = () => {
        authfetch(
            BACKEND_URL + `/Examiner/ListStudentCheckOut/GetAllStudentsGroupedBySchedule?pageNumber=${pageNumber}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, groupedResult } = result;

                const updatedData = groupedResult.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    time: moment(item.startTime).format('HH:mm') + ' - ' + moment(item.endTime).format('HH:mm'),
                }));

                setDataAll(updatedData);
                setTotalCount(totalCount);
                setDataExcel(updatedData);
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const handleRoomFilterChange = (selectedOption) => {
        setRoomFilter(selectedOption ? selectedOption.value : '');
    };

    const handleFilter = () => {
        const filteredData = dataAll;
        const rooms = getUniqueRooms(filteredData).map((room) => ({ value: room, label: room }));

        setRoomStudentOptions(rooms);
    };

    const getUniqueRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const handleRoomClick = (room) => {
        const selectedRoomData = data.find((r) => r.roomName === room.roomName);
        console.log('Room clicked:', selectedRoomData);
        setSelectedRoom(selectedRoomData);
    };

    const handleClosePopup = () => {
        setSelectedRoom(null);
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-viewcheckout">
                <div className="viewcheckout-management-header">
                    <Link className="viewcheckout-management-link" to={'/examiner'}>
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}>View Check Out</span>
                </div>
                <div className="body-container-viewcheckout">
                    <span style={{ marginRight: 10 }}>Roll No: </span>
                    <input style={{ width: 250 }} type="text" placeholder="Search by Roll No." />
                    <button className="btn btn-primary">Search</button>
                    <button className="btn btn-warning" onClick={() => setShowExportModal(true)}>
                        Export
                    </button>
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 22 }}>Filter: </span>
                    <Form.Group controlId="roomFilter">
                        <Select
                            className="fixed-width-input"
                            options={roomStudentOptions}
                            onChange={handleRoomFilterChange}
                            isClearable
                            placeholder="Select a room"
                        />
                    </Form.Group>
                    <button className="btn btn-primary" onClick={fetchData}>
                        Filter
                    </button>
                </div>
                <div>
                    <table className="viewcheckout-table table-striped">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Room</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr key={index}>
                                        <td>{startIndex + index}</td>
                                        <td>{item.date}</td>
                                        <td>{item.time}</td>
                                        <td
                                            data-title="Room No"
                                            onClick={() => handleRoomClick(item)}
                                            style={{ cursor: 'pointer', color: '#1A6BED' }}
                                        >
                                            {item.roomName}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="12">No Data...</td>
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
            </div>
            {/* Export Modal */}
            <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Export CheckOut Options</Modal.Title>
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
                            <Form.Select className="fixed-width-input" onChange={handleRoomFilterChange1}>
                                <option value="">Select Room</option>
                                {roomOptions1.map((option, index) => (
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
            {selectedRoom && <ListStudentCheckoutPopup room={selectedRoom} onClose={handleClosePopup} />}
        </Fragment>
    );
};

export default ViewCheckout;
