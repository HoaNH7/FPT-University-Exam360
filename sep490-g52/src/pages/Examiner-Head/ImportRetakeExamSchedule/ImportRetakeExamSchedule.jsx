import {BACKEND_URL} from '../../../constant';
import './ImportRetakeExamSchedule.scss';
import { Link } from 'react-router-dom';
import React, { Fragment, useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useAuthFetch } from '../../../auth';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as XLSX from 'xlsx';
import moment from 'moment';
import Select from 'react-select';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';

const ImportRetakeExamSchedule = () => {
    const getSemester = () => {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const currentYear = year;

        const summerStart = new Date(`June 1, ${year}`);
        const summerEnd = new Date(`August 31, ${year}`);
        const fallStart = new Date(`September 1, ${year}`);
        const fallEnd = new Date(`December 31, ${year}`);
        const springStart = new Date(`January 1, ${year}`);
        const springEnd = new Date(`May 31, ${year}`);

        let currentSemester;
        if (currentDate >= summerStart && currentDate <= summerEnd) {
            currentSemester = `Summer${currentYear}`;
        } else if (currentDate >= fallStart && currentDate <= fallEnd) {
            currentSemester = `Fall${currentYear}`;
        } else if (currentDate >= springStart && currentDate <= springEnd) {
            currentSemester = `Spring${currentYear + 1}`;
        }

        return [`Spring${currentYear + 1}`, `Fall${currentYear}`, `Summer${currentYear}`]
            .filter((semester) => semester !== currentSemester)
            .concat(currentSemester);
    };

    const [data, setData] = useState([]);
    const [dataAll, setDataAll] = useState([]);
    const fileInputRef = useRef(null);
    const authfetch = useAuthFetch();
    const [showModal, setShowModal] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState([]);
    const [semesterOptions, setSemesterOptions] = useState([]);
    const [processData, setProcessData] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState('APHL');
    const [errorMessage, setErrorMessage] = useState('');
    const [errorIndex, setErrorIndex] = useState(null);
    const [dataTotalCount, setDataTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(dataTotalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;
    const [searchProctor, setSearchProctor] = useState('');
    const [roomNameFilter, setRoomNameFilter] = useState(null);
    const [roomOptions, setRoomOptions] = useState([]);
    const maxPageButtons = 5;

    useEffect(() => {
        getData();
        getDataAll();
    }, [pageNumber, roomNameFilter]);

    const getData = () => {
        let queryString = `proctorName=${encodeURIComponent(searchProctor)}`;
        if (roomNameFilter) {
            queryString += `&roomName=${encodeURIComponent(roomNameFilter)}`;
        }

        authfetch(
            BACKEND_URL + `/api/ExamRoom/ListExamRoomsOf2NDSchedules?${queryString}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, rooms } = rs;
                const newData = rooms.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    startTime: moment(item.startTime).format('HH:mm'),
                    endTime: moment(item.endTime).format('HH:mm'),
                }));

                setData(newData);
                setDataTotalCount(totalCount);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getDataAll = () => {
        authfetch(BACKEND_URL + `/api/ExamRoom/ListExamRoomsOf2NDSchedules?$pageNumber=${pageNumber}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, rooms } = rs;
                const newData = rooms.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    startTime: moment(item.startTime).format('HH:mm'),
                    endTime: moment(item.endTime).format('HH:mm'),
                }));

                const uniqueRooms = getUniqueRooms(newData);
                setRoomOptions(uniqueRooms.map((room) => ({ value: room, label: room })));
                setDataAll(newData);
                setTotalCount(totalCount);
                setDataExcelStudent(newData);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleSearchProctor = () => {
        setPageNumber(1);
        getData();
    };

    const getUniqueRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const handleRoomFilterChange = (selectedOption) => {
        setPageNumber(1);
        setRoomNameFilter(selectedOption ? selectedOption.value : null);
    };

    const importRetakeExamSchedule = async () => {
        const postData = data.map((item) => ({
            rollNo: item.rollNo,
            examRoom: item.roomName,
            subjectCode: item.subjectCode,
            note: item.note || '',
            attempt: item.attempt || '',
            startTime: item.startTimeFull,
            endTime: item.endTimeFull,
            proctorMail: item.email,
            semester: selectedSemester,
            placeName: selectedPlace,
        }));

        function splitArray(originalArr, chunkSize) {
            const newArr = [];
            for (let i = 0; i < originalArr.length / chunkSize; i++) {
                const newObj = {};
                newObj.data = originalArr.slice(i * chunkSize, (i + 1) * chunkSize);
                newObj.startIndex = i * chunkSize + 1;
                newObj.endIndex =
                    (i + 1) * chunkSize < originalArr.length ? (i + 1) * chunkSize : originalArr.length;
                newArr.push(newObj);
            }
            return newArr;
        }

        const splited = splitArray(postData, 100);
        try {
            for (const chunk of splited) {
                const response = await authfetch(
                    BACKEND_URL + '/ExaminerHead/ExamScheduleFromFAP/Import2NDExamSchedule',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(chunk.data),
                    }
                );
                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMessage = 'Failed to submit data';

                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        errorMessage = errorText;
                    }

                    setErrorMessage(errorMessage);
                    toast.error(errorMessage); // Display error message using toast
                    throw new Error(errorMessage);
                }

                toast.success(`${chunk.startIndex} - ${chunk.endIndex} import successfully!`);
            }
            setErrorMessage('');
            toast.success('Import successfully');
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage(error.message || 'Failed to submit data!');
            toast.error(error.message || 'Failed to submit data!'); // Display error message using toast
        } finally {
            setData([]);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
            getData();
            setErrorMessage('');
        }
    };

    const handleFileUpload = (e) => {
        if (!selectedSemester) {
            alert('Please select a semester before uploading the file.');
            return;
        }

        const file = e.target.files[0];
        if (!file) {
            console.warn('No file selected');
            return;
        }
        const reader = new FileReader();

        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            console.log('Sheet Data:', worksheet);
            const processedData = worksheet.slice(1).map((row) => {
                const date = moment(new Date((row[5] - (25567 + 2)) * 86400 * 1000))
                    .subtract(7, 'hours')
                    .format('YYYY-MM-DD');
                const startTimeFull = moment(date + ' ' + row[6], 'YYYY-MM-DD HH:mm');
                const endTimeFull = moment(date + ' ' + row[7], 'YYYY-MM-DD HH:mm');

                return {
                    rollNo: row[1],
                    roomName: row[2],
                    subjectCode: row[3],
                    note: row[4],
                    date: date,
                    startTime: startTimeFull.format('HH:mm'),
                    endTime: endTimeFull.format('HH:mm'),
                    startTimeFull: startTimeFull.format('YYYY-MM-DD HH:mm'),
                    endTimeFull: endTimeFull.format('YYYY-MM-DD HH:mm'),
                    attempt: row[8],
                    email: row[9],
                    semester: selectedSemester,
                    placeName: selectedPlace,
                    isImported: true,
                };
            });

            setData(processedData);
            setProcessData(processedData);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleFileInputClick = () => {
        const semester = getSemester();
        setSemesterOptions(semester);
        setSelectedSemester(semester[semester.length - 1]);
        setShowModal(true);
    };

    const handleModalClose = () => setShowModal(false);

    const handleModalSave = () => {
        setShowModal(false);
        fileInputRef.current.click();
    };

    const getPageButtons = () => {
        let pages = [];
        if (totalPages <= maxPageButtons) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (pageNumber <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (pageNumber >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = pageNumber - 1; i <= pageNumber + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    // Filter export exam code
    const [showExportModal, setShowExportModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
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

        // Filter by start date
        if (startDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) <= endDate);
        }

        setFilters(filtered); // Update the filtered data state
    };

    const handleStartDateChange = (date) => {
        setStartDate(date);
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

    const [dataExcelStudent, setDataExcelStudent] = useState([]);
    const [subjectFilterStudent1, setSubjectFilterStudent1] = useState([]);
    const [roomFilter1, setRoomFilter1] = useState('');

    const [subjectOptionsStudent1, setSubjectOptionsStudent1] = useState([]);
    const [roomOptions1, setRoomOptions1] = useState([]);

    const handleExportExcelStudent = async () => {
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
                BACKEND_URL + `/api/Statistic/ExportRetakeExamToExcel?fromDate=${fromDateString}&toDate=${endDateString}&subjectCode=${subjectFilterStudent1}&pageNumber=${pageNumber}&room=${roomFilter1}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Retake_Exam.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDataExcelStudent(response);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            // Handle error
        }
    };

    useEffect(() => {
        if (Array.isArray(dataExcelStudent)) {
            updateRoomAndSubjectOptionsStudent();
        } else {
            console.error('dataExcel is not an array:', dataExcelStudent);
        }
    }, [dataExcelStudent]);

    const handleSubjectFilterChangeStudent = (e) => {
        const selectedOption = e.target.value;
        setSubjectFilterStudent1(selectedOption);
    };

    const handleRoomFilterChange1 = (e) => {
        const selectedOption = e.target.value;
        setRoomFilter1(selectedOption);
    };

    const updateRoomAndSubjectOptionsStudent = () => {
        const filteredData = dataExcelStudent;
        const rooms = getUniqueRooms1(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjectStudent(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));

        setRoomOptions1(rooms);
        setSubjectOptionsStudent1(subjects);
    };

    const getUniqueSubjectStudent = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(data.map((item) => item.subjectCode).filter((subject) => subject !== undefined)),
        ];
        return uniqueSubjects;
    };

    const getUniqueRooms1 = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-retakeexam">
                <div className="retakeexam-management-header">
                    <Link className="retakeexam-management-link" to="/examinerhead">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}>Import Retake Exam Schedule</span>
                </div>
                <div className="body-container-retakeexam">
                    <span style={{ marginRight: 10 }}>Search Proctor: </span>
                    <input
                        type="text"
                        placeholder="Enter Proctor Email"
                        value={searchProctor}
                        onChange={(e) => setSearchProctor(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearchProctor}>
                        Search
                    </button>
                    <Button variant="primary" onClick={handleFileInputClick}>
                        Choose File
                    </Button>
                    <button className="btn btn-warning" onClick={() => setShowExportModal(true)}>
                        Export
                    </button>
                    <Form.Group controlId="formFile" className="mb-3" style={{ display: 'none' }}>
                        <Form.Control ref={fileInputRef} type="file" size="lg" onChange={handleFileUpload} />
                    </Form.Group>
                </div>
                <Modal show={showModal} onHide={handleModalClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Semester</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="formSemester" className="mb-3">
                            <Form.Control
                                as="select"
                                className="mb-3"
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                            >
                                {semesterOptions.map((semester) => (
                                    <option key={semester} value={semester}>
                                        {semester}
                                    </option>
                                ))}
                            </Form.Control>
                            <Form.Control
                                as="select"
                                value={selectedPlace}
                                onChange={(e) => setSelectedPlace(e.target.value)}
                            >
                                <option>APHL</option>
                            </Form.Control>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleModalClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleModalSave} disabled={!selectedSemester}>
                            Save and Continue
                        </Button>
                    </Modal.Footer>
                </Modal>
                <div className="body-container-retakeexam filter-container">
                    {/* search, filter API */}
                    <Form.Group controlId="formRoomName">
                        <Form.Label>Filter Room Name</Form.Label>
                        <Select
                            className="fixed-width-input"
                            options={roomOptions}
                            onChange={handleRoomFilterChange}
                            isClearable
                            placeholder="Select a room"
                        />
                    </Form.Group>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={importRetakeExamSchedule}
                    type="button"
                    style={{ padding: '8px 16px' }}
                >
                    Save
                </button>
                {errorMessage && (
                    <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                        {errorMessage}
                    </div>
                )}
                <div className="body-container-assignproctor assignproctor-table-container">
                    <table className="assignproctor-table table-responsive">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Roll No</th>
                                <th>Exam Room</th>
                                <th>Subject Code</th>
                                <th>Note</th>
                                <th>Date</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Attempt</th>
                                {/* <th>Extra Proctor Email</th> */}
                                <th>Proctor Email</th>
                                <th>Semester</th>
                                <th>Place</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index}>
                                    <td>{index + startIndex}</td>
                                    <td>{item.rollNo}</td>
                                    <td>{item.roomName}</td>
                                    <td>{item.subjectCode}</td>
                                    <td>{item.note}</td>
                                    <td>{item.date}</td>
                                    <td>{item.startTime}</td>
                                    <td>{item.endTime}</td>
                                    <td>{item.attempt}</td>
                                    {/* <td>{item.email}</td> */}
                                    <td>
                                        {item.email ? <li>{item.email}</li> : null}
                                        {item.proctors && item.proctors.mainProctorEmail ? (
                                            <li>{item.proctors.mainProctorEmail}</li>
                                        ) : null}
                                        {item.proctors && item.proctors.additionalProctors
                                            ? item.proctors.additionalProctors.map((proctor, index) => (
                                                  <li key={index}>{proctor}</li>
                                              ))
                                            : null}
                                    </td>
                                    <td>{item.semester}</td>
                                    <td>{item.placeName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <ul className="pagination">
                        <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPageNumber(pageNumber - 1)}>
                                Previous
                            </button>
                        </li>
                        {getPageButtons().map((page, index) => (
                            <li key={index} className={`page-item ${page === pageNumber ? 'active' : ''}`}>
                                {page === '...' ? (
                                    <span className="page-link">...</span>
                                ) : (
                                    <button className="page-link" onClick={() => setPageNumber(page)}>
                                        {page}
                                    </button>
                                )}
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
                    <Modal.Title>Export ExamCode Options</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="body-container-handlerequest1">
                        <Form.Group controlId="subjectFilter">
                            <Form.Select className="fixed-width-input" onChange={handleSubjectFilterChangeStudent}>
                                <option value="">Select Subject</option>
                                {subjectOptionsStudent1.map((option, index) => (
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
                    <div className="body-container-handlerequest1">
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
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleExportExcelStudent}>
                        Export
                    </Button>
                </Modal.Footer>
            </Modal>
        </Fragment>
    );
};

export default ImportRetakeExamSchedule;
