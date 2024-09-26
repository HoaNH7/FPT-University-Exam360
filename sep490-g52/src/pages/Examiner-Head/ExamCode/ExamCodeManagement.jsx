import {BACKEND_URL} from '../../../constant';
/*
1. check subject code, name có trong db hay không
2. check examcode có trùng trong db kh, nếu trùng thì bỏ qua những cái trùng chi add những exam code kh trùng
3. show table default semester
*/

import './ExamCode.scss';
import { Link } from 'react-router-dom';
import React, { useState, useEffect, Fragment, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as XLSX from 'xlsx';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuthFetch } from '../../../auth';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';

const ExamCodeManagement = () => {
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
    const [dbData, setDbData] = useState([]);
    const [isEditingImport, setIsEditingImport] = useState(false);
    const [isEditable, setIsEditable] = useState(false);
    const [isEditTableImport, setIsEditTableImport] = useState(false);
    const [searchSubjectCode, setSearchSubjectCode] = useState('');
    const [searchSubjectName, setSearchSubjectName] = useState('');
    const [currentSemester, setCurrentSemester] = useState(getCurrentSemester());
    const [searchInput, setSearchInput] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [isDataImported, setIsDataImported] = useState(false);
    const fileInputRef = useRef(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteExamCodeId, setDeleteExamCodeId] = useState(null);
    const [isDataSubmitted, setIsDataSubmitted] = useState(false);
    const [processData, setProcessData] = useState([]);
    const [addToDatabaseSuccess, setAddToDatabaseSuccess] = useState(false);
    const [updateToDatabaseFailed, setUpdateToDatabaseFailed] = useState(false);
    const [filterData, setFilterData] = useState([]);
    const [subjectCodeFilter, setSubjectCodeFilter] = useState('');
    const [subjectNameFilter, setSubjectNameFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedSemester, setSelectedSemester] = useState([]);
    const [semesterOptions, setSemesterOptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const authfetch = useAuthFetch();
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;

    useEffect(() => {
        getData();
    }, [pageNumber]);

    useEffect(() => {
        getDataAll();
        if (searchSubjectCode || searchSubjectName) {
            handleSearch();
        } else {
            getData();
        }

        if (addToDatabaseSuccess) {
            setTimeout(() => {
                window.location.reload();
            }, 5000);
        }
    }, [searchSubjectCode, searchSubjectName, isDataSubmitted, addToDatabaseSuccess, updateToDatabaseFailed]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/ExaminerHead/ExamCode/GetAllExamCodes?pageNumber=${pageNumber}&pageSize=${pageSize}&semester=${currentSemester}`,
        )
            .then((response) => response.json())
            .then((data) => {
                const { totalCount, examCodes } = data;
                const newData = examCodes.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    startTime: moment(item.startTime).format('HH:mm'),
                    endTime: moment(item.endTime).format('HH:mm'),
                    status: item.status === true ? 'Happened' : 'Not Happened',
                }));
                setData(newData);
                setFilterData(newData);
                setTotalCount(totalCount);
            });
    };

    const getDataAll = () => {
        authfetch(BACKEND_URL + `/ExaminerHead/ExamCode/GetAllExamCodes?pageNumber=${pageNumber}`)
            .then((response) => response.json())
            .then((data) => {
                const { totalCount, examCodes } = data;
                const newData = examCodes.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                    startTime: moment(item.startTime).format('HH:mm'),
                    endTime: moment(item.endTime).format('HH:mm'),
                    status: item.status === true ? 'Happened' : 'Not Happened',
                }));
                setData(newData);
                setFilterData(newData);
                setDataExcelStudent(newData);
            });
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

            const processedData = worksheet.slice(1).map((row) => {
                const date = moment(new Date((row[6] - (25567 + 2)) * 86400 * 1000))
                    .subtract(7, 'hours')
                    .format('YYYY-MM-DD');
                const startTimeFull = moment(date + ' ' + row[7], 'YYYY-MM-DD H:mm');
                const endTimeFull = moment(date + ' ' + row[8], 'YYYY-MM-DD H:mm');

                return {
                    examCode: row[0],
                    openCode: row[1],
                    title: row[2],
                    section: row[3],
                    subjectName: row[4] || '',
                    subjectCode: row[5],
                    date: date,
                    startTime: startTimeFull.format('HH:mm'),
                    startTimeFull: startTimeFull.format('YYYY-MM-DD HH:mm'),
                    endTime: endTimeFull.format('HH:mm'),
                    endTimeFull: endTimeFull.format('YYYY-MM-DD HH:mm'),
                    status: 'Not Happened',
                    semester: selectedSemester,
                    isImported: true,
                };
            });

            setData(processedData);
            setProcessData(processedData);
            setIsEditable(true);
            setIsEditingImport(true);
            setIsDataImported(true);
            setIsEditTableImport(true);
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

    const handleInputChange = (index, field, value) => {
        console.log('Data in handleInputChange:', data);
        const newData = [...data];
        if (newData[index].isImported || (field !== 'subjectCode' && field !== 'subjectName')) {
            if (field === 'status') {
                newData[index][field] = value ? true : false;
            } else {
                newData[index][field] = value;
            }
        }
        setData(newData);
        console.log('Data after handleInputChange:', newData);
    };

    const handleSave = () => {
        setIsEditable(false);
        setIsEditingImport(false);
    };

    const handleEdit = () => {
        setIsEditable(true);
    };

    const handleUpdateToDatabase = async () => {
        console.log('Data to be sent to server:', data);

        const updatedData = data.map((item) => ({
            examCodeId: item.examCodeId,
            examCode: item.examCode,
            openCode: item.openCode,
            title: item.title,
            section: item.section,
            subjectName: item.subjectName,
            subjectCode: item.subjectCode,
            startTime: item.date + ' ' + item.startTime,
            endTime: item.date + ' ' + item.endTime,
            semester: item.semester,
            status: item.status === true,
        }));
        console.log('updateData to be sent to server:', updatedData);

        const url = BACKEND_URL + '/ExaminerHead/ExamCode/EditExamCode';
        const response = await authfetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        });
        console.log('response: ', response);
        setUpdateToDatabaseFailed(true);
        if (!response.ok) {
            toast.error('Failed to update data');
        } else {
            toast.success('Data updated successfully');
        }
    };

    const handleSearch = () => {
        if (searchInput.trim() === '' && searchSubjectName.trim() === '') {
            if (isDataImported) {
                setData(processData);
            } else {
                getData();
            }
            toast.success('Showing all data.');
        } else {
            if (isDataImported) {
                const filteredData = processData.filter((item) => {
                    return (
                        (searchInput.trim() === '' ||
                            (typeof item.subjectCode === 'string' &&
                                item.subjectCode.toLowerCase().includes(searchInput.toLowerCase()))) &&
                        (searchSubjectName.trim() === '' ||
                            (typeof item.subjectName === 'string' &&
                                item.subjectName.toLowerCase().includes(searchSubjectName.toLowerCase())))
                    );
                });
                setData(filteredData);
                toast.success('Search completed successfully!');
            } else {
                const queryString = `subjectCode=${encodeURIComponent(searchInput)}&subjectName=${encodeURIComponent(
                    searchSubjectName,
                )}&Date=${encodeURIComponent(searchDate)}`;
                const url = BACKEND_URL + `/ExaminerHead/ExamCode/SearchExamCode?${queryString}`;
                authfetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Failed to search data');
                        }
                        return response.json();
                    })
                    .then((responseData) => {
                        const searchData = responseData.map((item) => ({
                            ...item,
                            status: item.status === true ? 'Happened' : 'Not Happened',
                            examCode: item.code,
                        }));
                        setData(searchData);
                        toast.success('Search completed successfully!');
                    })
                    .catch((error) => {
                        console.error(error);
                        toast.error('Failed to search data!');
                    });
            }
        }
    };

    const handleSubmit = () => {
        console.log('data: ', data);

        const postData = data.map((item) => ({
            ...item,
            examCode: item.examCode,
            startTime: item.startTimeFull,
            endTime: item.endTimeFull,
            status: item.status === 'Happened' ? true : false,
        }));

        const duplicateData = data.filter((newItem) =>
            dbData.some((existingItem) => existingItem.examCode === newItem.examCode),
        );

        if (duplicateData.length > 0) {
            const duplicateExamCodes = duplicateData.map((item) => item.examCode).join(', ');
            toast.error(`Duplicate data found! Exam codes ${duplicateExamCodes} already exist in the database.`);

            return;
        }
        console.log('post data: ', postData);

        authfetch(BACKEND_URL + '/ExaminerHead/ExamCode/AddExamCode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to submit data');
                }
                setData([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }
                getData();
                toast.success('Import successfully');
                setAddToDatabaseSuccess(true);
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to submit data!');
            });
    };

    const handleConfirmDelete = (examCodeId) => {
        setDeleteExamCodeId(examCodeId);
        setShowConfirmDelete(true);
    };

    const handleDelete = async () => {
        try {
            const url = BACKEND_URL + `/ExaminerHead/ExamCode/DeleteByExamCodeId/${deleteExamCodeId}`;
            const response = await authfetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete exam code');
            } else {
                toast.success('Exam code deleted successfully!');
            }

            setShowConfirmDelete(false);
            setDeleteExamCodeId(null);

            const updatedData = data.filter((item) => item.examCodeId !== deleteExamCodeId);
            setData(updatedData);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete exam code!');
        }
    };

    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
        setDeleteExamCodeId(null);
    };

    const handleFilter = (subjectName, subjectCode, status) => {
        let filtered = filterData;

        if (subjectName) {
            filtered = filtered.filter((item) => item.subjectName === subjectName);
        }

        if (subjectCode) {
            filtered = filtered.filter((item) => item.subjectCode === subjectCode);
        }

        if (status) {
            const statusBool = status === true ? 'HAPPENED' : 'Not Happened';
            filtered = filtered.filter((item) => item.status === statusBool);
        }

        setData(filtered);

        if (filtered.length === 0) {
            toast.warn('No results found');
        } else {
            toast.success('Filter applied successfully!');
        }
    };

    const handleSubjectNameChange = (e) => {
        const selectedSubjectName = e.target.value;
        setSubjectNameFilter(selectedSubjectName);
        handleFilter(selectedSubjectName, subjectCodeFilter, statusFilter);
    };

    const handleSubjectCodeChange = (e) => {
        const selectedSubjectCode = e.target.value;
        setSubjectCodeFilter(selectedSubjectCode);
        handleFilter(subjectNameFilter, selectedSubjectCode, statusFilter);
    };

    const handleStatusChange = (e) => {
        const selectedStatus = e.target.value;
        setStatusFilter(selectedStatus);
        handleFilter(subjectNameFilter, subjectCodeFilter, selectedStatus);
    };

    const getUniqueSubjectNames = (data) => {
        const uniquesubjectNames = [...new Set(data.map((item) => item.subjectName))];
        return uniquesubjectNames;
    };

    const getUniqueSubjectCodes = (data) => {
        const uniqueSubjectCodes = [...new Set(data.map((item) => item.subjectCode))];
        return uniqueSubjectCodes;
    };

    const getUniqueStatus = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => (item.status === true ? 'Happened' : 'Not Happened')))];
        return uniqueStatus;
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            [
                'Exam Code',
                'Open Code',
                'Title',
                'Section',
                'Subject Name',
                'Subject Code',
                'Date',
                'Start Time',
                'End Time',
            ], // Headers
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'Template_Import.xlsx');
    };

    //Filter export examcode
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

    const [subjectOptionsStudent1, setSubjectOptionsStudent1] = useState([]);

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
                BACKEND_URL + `/api/Statistic/ExportExamCodesToExcel?fromDate=${fromDateString}&toDate=${endDateString}&subjectCode=${subjectFilterStudent1}&pageNumber=${pageNumber}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'ExamCode.xlsx');
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

    const updateRoomAndSubjectOptionsStudent = () => {
        const filteredData = dataExcelStudent;
        const subjects = getUniqueSubjectStudent(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));

        setSubjectOptionsStudent1(subjects);
    };

    const getUniqueSubjectStudent = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(data.map((item) => item.subjectCode).filter((subject) => subject !== undefined)),
        ];
        return uniqueSubjects;
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-examcode">
                <div className="examcode-management-header">
                    <Link className="examcode-management-link" to="/examinerhead">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Exam Code Management</span>{' '}
                </div>
                <div className="body-container-examcode">
                    <span style={{ marginRight: 10 }}>Name: </span>
                    <input
                        type="text"
                        placeholder="Search By Subject Code"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button
                        style={{ marginLeft: 5, marginRight: 5 }}
                        className="btn btn-primary"
                        onClick={handleSearch}
                    >
                        Search
                    </button>

                    <div className="btn-import-examcode">
                        <Button variant="primary" onClick={handleFileInputClick}>
                            Choose File
                        </Button>
                        <Form.Group controlId="formFile" className="mb-3" style={{ display: 'none' }}>
                            <Form.Control ref={fileInputRef} type="file" size="lg" onChange={handleFileUpload} />
                        </Form.Group>
                    </div>
                    <button className="btn btn-warning" onClick={() => setShowExportModal(true)}>
                        Export
                    </button>
                    <button className="btn btn-warning" onClick={handleDownloadTemplate}>
                        Download Template
                    </button>

                    <Modal show={showModal} onHide={handleModalClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Semester</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group controlId="formSemester" className="mb-3">
                                <Form.Control
                                    as="select"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                >
                                    {semesterOptions.map((semester) => (
                                        <option key={semester} value={semester}>
                                            {semester}
                                        </option>
                                    ))}
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
                </div>
                <div className="body-container-examcode">
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        onChange={handleSubjectNameChange}
                        value={subjectNameFilter}
                    >
                        <option value="">All Subject Name</option>
                        {filterData && filterData.length > 0
                            ? getUniqueSubjectNames(filterData).map((subjectName, index) => (
                                  <option key={index} value={subjectName}>
                                      {subjectName}
                                  </option>
                              ))
                            : 'Loadding...'}
                    </Form.Select>
                    <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        onChange={handleSubjectCodeChange}
                        value={subjectCodeFilter}
                    >
                        <option value="">All Subject Code</option>
                        {filterData && filterData.length > 0
                            ? getUniqueSubjectCodes(filterData).map((subjectCode, index) => (
                                  <option key={index} value={subjectCode}>
                                      {subjectCode}
                                  </option>
                              ))
                            : 'Loadding...'}
                    </Form.Select>
                    {/* <Form.Select
                        className="form-select-examcode"
                        style={{ marginRight: '20px' }}
                        aria-label="Default select example"
                        onChange={handleStatusChange}
                        value={statusFilter}
                    >
                        <option value="">All Status</option>
                        {filterData && filterData.length > 0
                            ? getUniqueStatus(filterData).map((status, index) => (
                                  <option key={index} value={status}>
                                      {status}
                                  </option>
                              ))
                            : 'No Data...'}
                    </Form.Select> */}
                </div>
                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    {isEditable ? (
                        isDataImported ? (
                            <div>
                                <button className="btn btn-primary button-examcode" onClick={handleSave}>
                                    Save
                                </button>
                            </div>
                        ) : (
                            <div>
                                <button className="btn btn-primary button-examcode" onClick={handleSave}>
                                    Save
                                </button>
                            </div>
                        )
                    ) : isDataImported ? (
                        <div>
                            <button
                                className="btn btn-primary button-examcode"
                                style={{ marginRight: 10 }}
                                onClick={handleEdit}
                            >
                                Edit
                            </button>
                            {!addToDatabaseSuccess && (
                                <button
                                    className="btn btn-primary button-examcode"
                                    style={{ marginRight: 10 }}
                                    onClick={handleSubmit}
                                >
                                    Add to Database
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            <button
                                className="btn btn-primary button-examcode"
                                style={{ marginRight: 10 }}
                                onClick={handleEdit}
                            >
                                Edit
                            </button>
                            <button
                                className="btn btn-primary button-examcode"
                                style={{ marginRight: 10 }}
                                onClick={handleUpdateToDatabase}
                            >
                                Update to Database
                            </button>
                        </div>
                    )}
                </div>
                <table className="examcode-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Exam Code</th>
                            <th>Open Code</th>
                            <th>Title</th>
                            <th>Section</th>
                            <th>Subject Name</th>
                            <th>Subject Code</th>
                            <th>Date</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td data-title="STT">{index + startIndex}</td>
                                    <td data-title="Exam Code">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                style={{ width: 180 }}
                                                type="text"
                                                value={item.examCode}
                                                onChange={(e) => handleInputChange(index, 'examCode', e.target.value)}
                                            />
                                        ) : (
                                            item.examCode
                                        )}
                                    </td>
                                    <td data-title="Open Code">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.openCode}
                                                onChange={(e) => handleInputChange(index, 'openCode', e.target.value)}
                                            />
                                        ) : (
                                            item.openCode
                                        )}
                                    </td>
                                    <td data-title="Title">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                                            />
                                        ) : (
                                            item.title
                                        )}
                                    </td>
                                    <td data-title="Section">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.section}
                                                onChange={(e) => handleInputChange(index, 'section', e.target.value)}
                                            />
                                        ) : (
                                            item.section
                                        )}
                                    </td>
                                    <td data-title="Subject Name">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.subjectName}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'subjectName', e.target.value)
                                                }
                                                disabled={!item.isImported}
                                            />
                                        ) : (
                                            item.subjectName
                                        )}
                                    </td>
                                    <td data-title="Subject Code">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.subjectCode}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'subjectCode', e.target.value)
                                                }
                                                disabled={!item.isImported}
                                            />
                                        ) : (
                                            item.subjectCode
                                        )}
                                    </td>
                                    <td data-title="Date">
                                        {isEditable ? (
                                            isEditTableImport ? (
                                                <input
                                                    className="input-examcode"
                                                    type="text"
                                                    value={item.date}
                                                    onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                                                />
                                            ) : (
                                                <input
                                                    className="input-examcode"
                                                    type="date"
                                                    value={item.date}
                                                    onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                                                />
                                            )
                                        ) : (
                                            item.date
                                        )}
                                    </td>
                                    <td data-title="Start Time">
                                        {isEditable ? (
                                            isEditTableImport ? (
                                                <input
                                                    className="input-examcode"
                                                    type="text"
                                                    value={item.startTime}
                                                    onChange={(e) =>
                                                        handleInputChange(index, 'startTime', e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <input
                                                    className="input-examcode"
                                                    type="time"
                                                    value={item.startTime}
                                                    onChange={(e) =>
                                                        handleInputChange(index, 'startTime', e.target.value)
                                                    }
                                                />
                                            )
                                        ) : (
                                            item.startTime
                                        )}
                                    </td>
                                    <td data-title="End Time">
                                        {isEditable ? (
                                            isEditTableImport ? (
                                                <input
                                                    className="input-examcode"
                                                    type="text"
                                                    value={item.endTime}
                                                    onChange={(e) =>
                                                        handleInputChange(index, 'endTime', e.target.value)
                                                    }
                                                />
                                            ) : (
                                                <input
                                                    className="input-examcode"
                                                    type="time"
                                                    value={item.endTime}
                                                    onChange={(e) =>
                                                        handleInputChange(index, 'endTime', e.target.value)
                                                    }
                                                />
                                            )
                                        ) : (
                                            item.endTime
                                        )}
                                    </td>
                                    <td data-title="Subject Code" hidden>
                                        {isEditable ? (
                                            <input
                                                hidden
                                                className="input-examcode"
                                                type="text"
                                                value={item.semester}
                                                onChange={(e) => handleInputChange(index, 'Semester', e.target.value)}
                                            />
                                        ) : (
                                            item.semester
                                        )}
                                    </td>
                                    <td data-title="Status">
                                        {isEditable ? (
                                            <input
                                                className="input-examcode"
                                                type="text"
                                                value={item.status}
                                                disabled={!item.isImported}
                                            />
                                        ) : (
                                            item.status
                                        )}
                                    </td>
                                    <td data-title="Action" className="action-icon">
                                        <FontAwesomeIcon
                                            icon={faTrash}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleConfirmDelete(item.examCodeId)}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11">No Data...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div>
                    <div style={{ marginTop: 20 }}>
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

                <Modal show={showConfirmDelete} onHide={handleCancelDelete}>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm Delete</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Are you sure you want to delete this exam code?</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </Fragment>
    );
};

export default ExamCodeManagement;
