import {BACKEND_URL} from '../../../constant';
import './AnalysisReport.scss';
import { Link } from 'react-router-dom';
import React, { Fragment, useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useAuthFetch } from '../../../auth';
import moment from 'moment/moment';
import Pagination from 'react-bootstrap/Pagination';
import Select from 'react-select';
//Export
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import * as FileSaver from 'file-saver';
import ExcelJS from 'exceljs';
import DatePicker from 'react-datepicker';

const AnalysisReport = () => {
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

    //Dùng chung
    const [semester] = useState(getCurrentSemester());
    const [semesterFilter, setSemesterFilter] = useState(getCurrentSemester());
    const [activeContent, setActiveContent] = useState('student');
    const [currentPage, setCurrentPage] = useState(1);
    const authfetch = useAuthFetch();
    const [pageSize, setPageSize] = useState(10);

    //Student
    const [dataStudent, setDataStudent] = useState([]);
    const [allDataStudent, setAllDataStudent] = useState([]);
    const [allDataStudentForExport, setAllDataStudentForExport] = useState([]);
    const [allDataStudentForFilter, setAllDataStudentForFilter] = useState([]);
    const [dataCountStudent, setDataCountStudent] = useState([]);
    const [roomFilterStudent, setRoomFilterStudent] = useState(null);
    const [subjectFilterStudent, setSubjectFilterStudent] = useState(null);
    const [semesterFilterStudent, setSemesterFilterStudent] = useState(getCurrentSemester());
    const [roomStudentOptions, setRoomStudentOptions] = useState([]);
    const [subjectStudentOptions, setSubjectStudentOptions] = useState([]);
    const [pageNumberStudent, setPageNumberStudent] = useState(1);
    const [totalCountStudent, setTotalCountStudent] = useState(0);
    const totalPageStudents = Math.ceil(totalCountStudent / pageSize);
    const startIndexStudent = (pageNumberStudent - 1) * pageSize + 1;
    const [allSemesterStudent, setAllSemesterStudent] = useState(new Set());
    const [allSemesterFilterStudent, setAllSemesterFilterStudent] = useState([]);

    //Filter Student
    const [dataExcelStudent, setDataExcelStudent] = useState([]);
    const [subjectFilterStudent1, setSubjectFilterStudent1] = useState([]);
    const [roomFilterStudent1, setRoomFilterStudent1] = useState([]);
    const [semesterFilterStudent1, setSemesterFilterStudent1] = useState([]);

    const [subjectOptionsStudent1, setSubjectOptionsStudent1] = useState([]);
    const [roomOptionsStudent1, setRoomOptionsStudent1] = useState([]);
    const [semesterOptionsStudent1, setSemesterOptionsStudent1] = useState([]);

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
                BACKEND_URL + `/api/Statistic/ExportAbsentStudentsToExcel?FromDate=${fromDateString}&ToDate=${endDateString}&room=${roomFilterStudent1}&subjectCode=${subjectFilterStudent1}&semester=${semesterFilterStudent1}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_statistic.xlsx');
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
    const handleRoomFilterChangeStudent = (e) => {
        const selectedOption = e.target.value;
        setRoomFilterStudent1(selectedOption);
    };
    const handleSemesterFilterChangeStudent = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilterStudent1(selectedOption);
    };

    const updateRoomAndSubjectOptionsStudent = () => {
        const filteredData = dataExcelStudent;
        const rooms = getUniqueRoomsStudent(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjectStudent(filteredData).map((subject) => ({
            value: subject,
            label: subject,
        }));
        const semesters = getUniqueSemesterStudent(filteredData).map((Semester) => ({
            value: Semester,
            label: Semester,
        }));

        setRoomOptionsStudent1(rooms);
        setSubjectOptionsStudent1(subjects);
        setSemesterOptionsStudent1(semesters);
    };

    const getUniqueSubjectStudent = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSubjects = [
            ...new Set(data.map((item) => item.subjectCode).filter((subject) => subject !== undefined)),
        ];
        return uniqueSubjects;
    };

    const getUniqueRoomsStudent = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueSemesterStudent = (data) => {
        const uniqueSemester = [...new Set(data.map((item) => item.semester))];
        return uniqueSemester;
    };

    //Request
    const [dataRequest, setDataRequest] = useState([]);
    const [allDataRequest, setAllDataRequest] = useState([]);
    const [dataCountRequest, setDataCountRequest] = useState([]);
    const [roomFilterRequest, setRoomFilterRequest] = useState('All Rooms');
    const [statusFilterRequest, setStatusFilterRequest] = useState('All Status');
    const [titleFilterRequest, setTitleFilterRequest] = useState('All Title');
    const [statusRequestOptions, setStatusRequestOptions] = useState([]);
    const [titleRequestOptions, setTitleRequestOptions] = useState([]);
    const [roomRequestOptions, setRoomRequestOptions] = useState([]);
    const [pageNumberRequest, setPageNumberRequest] = useState(1);
    const [totalCountRequest, setTotalCountRequest] = useState(0);
    const totalPageRequests = Math.ceil(totalCountRequest / pageSize);
    const startIndexRequest = (pageNumberRequest - 1) * pageSize + 1;

    //Filter Request
    const [dataExcelRequest, setDataExcelRequest] = useState([]);
    const [semesterFilterRequest1, setSemesterFilterRequest1] = useState([]);
    const [roomFilterRequest1, setRoomFilterRequest1] = useState([]);
    const [requestTitleFilterRequest1, setRequestTitleFilterRequest1] = useState([]);
    const [statusFilterRequest1, setStatusFilterRequest1] = useState([]);

    const [semesterOptionsRequest1, setSemesterOptionsRequest1] = useState([]);
    const [roomOptionsRequest1, setRoomOptionsRequest1] = useState([]);
    const [requestTitleOptionsRequest1, setRequestTitleOptionsRequest1] = useState([]);
    const [statusOptionsRequest1, setStatusOptionsRequest1] = useState([]);

    const handleExportExcelRequest = async () => {
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
                BACKEND_URL + `/api/Statistic/ExportRequestStatisticsToExcel?pageNumber=${pageNumberRequest}&FromDate=${fromDateString}&ToDate=${endDateString}&semester=${semesterFilterRequest1}&room=${roomFilterRequest1}&requestTitle=${requestTitleFilterRequest1}&status=${statusFilterRequest1}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'requests_statistic.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDataExcelRequest(response);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            // Handle error
        }
    };

    useEffect(() => {
        if (Array.isArray(dataExcelRequest)) {
            updateRoomAndSubjectOptionsRequest();
        } else {
            console.error('dataExcel is not an array:', dataExcelRequest);
        }
    }, [dataExcelRequest]);

    const handleSemesterFilterChangeRequest = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilterRequest1(selectedOption);
    };
    const handleRoomFilterChangeRequest = (e) => {
        const selectedOption = e.target.value;
        setRoomFilterRequest1(selectedOption);
    };

    const handleRequestFilterChangeRequest = (e) => {
        const selectedOption = e.target.value;
        setRequestTitleFilterRequest1(selectedOption);
    };

    const handleStatusFilterChangeRequest = (e) => {
        const selectedOption = e.target.value;
        setStatusFilterRequest1(selectedOption);
    };

    const updateRoomAndSubjectOptionsRequest = () => {
        const filteredData = dataExcelRequest;
        const semesters = getUniqueSemsetersRequest(filteredData).map((semester) => ({
            value: semester,
            label: semester,
        }));
        const rooms = getUniqueRoomsRequest(filteredData).map((room) => ({ value: room, label: room }));
        const requests = getUniqueRequestsRequest(filteredData).map((request) => ({ value: request, label: request }));
        const status = getUniqueStatusRequest(filteredData).map((status) => ({ value: status, label: status }));

        setSemesterOptionsRequest1(semesters);
        setRoomOptionsRequest1(rooms);
        setRequestTitleOptionsRequest1(requests);
        setStatusOptionsRequest1(status);
    };

    const getUniqueSemsetersRequest = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSemester = [
            ...new Set(data.map((item) => item.semester).filter((semester) => semester !== undefined)),
        ];
        return uniqueSemester;
    };

    const getUniqueRoomsRequest = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.examRoom))];
        return uniqueRooms;
    };

    const getUniqueRequestsRequest = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueRequests = [
            ...new Set(data.map((item) => item.requestTitle).filter((request) => request !== undefined)),
        ];
        console.log(uniqueRequests);
        return uniqueRequests;
    };

    const getUniqueStatusRequest = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.resolveStatus))];
        return uniqueStatus;
    };

    const getStatusClassRequest = (status) => {
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

    //Violation
    const [dataViolation, setDataViolation] = useState([]);
    const [allDataViolation, setAllDataViolation] = useState([]);
    const [dataCountViolation, setDataCountViolation] = useState([]);
    const [statusViolationOptions, setStatusViolationOptions] = useState([]);
    const [titleViolationOptions, setTitleViolationOptions] = useState([]);
    const [roomFilterViolation, setRoomFilterViolation] = useState('All Rooms');
    const [statusFilterViolation, setStatusFilterViolation] = useState('All Status');
    const [titleFilterViolation, setTitleFilterViolation] = useState('All Title');
    const [roomViolationOptions, setRoomViolationOptions] = useState([]);
    const [pageNumberViolation, setPageNumberViolation] = useState(1);
    const [totalCountViolation, setTotalCountViolation] = useState(0);
    const totalPageViolations = Math.ceil(totalCountViolation / pageSize);
    const startIndexViolation = (pageNumberViolation - 1) * pageSize + 1;

    //Filter Violation
    const [dataExcelViolation, setDataExcelViolation] = useState([]);
    const [semesterFilterViolation1, setSemesterFilterViolation1] = useState([]);
    const [roomFilterViolation1, setRoomFilterViolation1] = useState([]);
    const [violationTitleFilterViolation1, setViolationTitleFilterViolation1] = useState([]);
    const [statusFilterViolation1, setStatusFilterViolation1] = useState([]);

    const [semesterOptionsViolation1, setSemesterOptionsViolation1] = useState([]);
    const [roomOptionsViolation1, setRoomOptionsViolation1] = useState([]);
    const [violationTitleOptionsViolation1, setViolationTitleOptionsViolation1] = useState([]);
    const [statusOptionsViolation1, setStatusOptionsViolation1] = useState([]);

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
                BACKEND_URL + `/api/Statistic/ExportViolationStatisticsToExcel?pageNumber=${pageNumberViolation}&FromDate=${fromDateString}&ToDate=${endDateString}&semester=${semesterFilterViolation1}&room=${roomFilterViolation1}&violationTitle=${violationTitleFilterViolation1}&status=${statusFilterViolation1}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'violation_statistic.xlsx');
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

    const handleSemesterFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilterViolation1(selectedOption);
    };
    const handleRoomFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setRoomFilterViolation1(selectedOption);
    };

    const handleViolationFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setViolationTitleFilterViolation1(selectedOption);
    };

    const handleStatusFilterChangeViolation = (e) => {
        const selectedOption = e.target.value;
        setStatusFilterViolation1(selectedOption);
    };

    const updateRoomAndSubjectOptionsViolation = () => {
        const filteredData = dataExcelViolation;
        const semesters = getUniqueSemsetersViolation(filteredData).map((semester) => ({
            value: semester,
            label: semester,
        }));
        const rooms = getUniqueRoomsViolation(filteredData).map((room) => ({ value: room, label: room }));
        const requests = getUniqueRequestsViolation(filteredData).map((request) => ({
            value: request,
            label: request,
        }));
        const status = getUniqueStatusViolation(filteredData).map((status) => ({ value: status, label: status }));

        setSemesterOptionsViolation1(semesters);
        setRoomOptionsViolation1(rooms);
        setViolationTitleOptionsViolation1(requests);
        setStatusOptionsViolation1(status);
    };

    const getUniqueSemsetersViolation = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSemester = [
            ...new Set(data.map((item) => item.semester).filter((semester) => semester !== undefined)),
        ];
        return uniqueSemester;
    };

    const getUniqueRoomsViolation = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.examRoom))];
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

    const getStatusClassViolation = (status) => {
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

    //Proctor
    const [dataProctor, setDataProctor] = useState([]);
    const [allDataProctor, setAllDataProctor] = useState([]);
    const [dataCountProctor, setDataCountProctor] = useState([]);
    const [pageNumberProctor, setPageNumberProctor] = useState(1);
    const [totalCountProctor, setTotalCountProctor] = useState(0);
    const totalPageProctors = Math.ceil(totalCountProctor / pageSize);
    const startIndexProctor = (pageNumberProctor - 1) * pageSize + 1;

    //Filter Proctor
    const [dataExcelProctor, setDataExcelProctor] = useState([]);
    const [semesterFilterProctor1, setSemesterFilterProctor1] = useState([]);

    const [semesterOptionsProctor1, setSemesterOptionsProctor1] = useState([]);

    const handleExportExcelProctor = async () => {
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
                BACKEND_URL + `/api/Statistic/ExportProctorsWithTotalProctoringTimeToExcel?FromDate=${fromDateString}&ToDate=${endDateString}&semester=${semesterFilterProctor1}`,
            );
            console.log(response);
            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary link element to trigger the download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'proctor_statistic.xlsx');
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDataExcelProctor(response);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            // Handle error
        }
    };

    useEffect(() => {
        if (Array.isArray(dataExcelProctor)) {
            updateRoomAndSubjectOptionsProctor();
        } else {
            console.error('dataExcel is not an array:', dataExcelProctor);
        }
    }, [dataExcelProctor]);

    const handleSemesterFilterChangeProctor = (e) => {
        const selectedOption = e.target.value;
        setSemesterFilterProctor1(selectedOption);
    };

    const updateRoomAndSubjectOptionsProctor = () => {
        const filteredData = dataExcelProctor;
        const semesters = getUniqueSemsetersProctor(filteredData).map((semester) => ({
            value: semester,
            label: semester,
        }));
        setSemesterOptionsProctor1(semesters);
    };

    const getUniqueSemsetersProctor = (data) => {
        if (!Array.isArray(data)) return [];
        const uniqueSemester = [
            ...new Set(data.map((item) => item.semester).filter((semester) => semester !== undefined)),
        ];
        return uniqueSemester;
    };

    //Export Request
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFields, setExportFields] = useState({
        no: true,
        studentIdNumber: true,
        examRoom: true,
        date: true,
        timeDoing: true,
        requestTitle: true,
        resolveStatus: true,
        semester: true,
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

    //Export Student
    const [searchInputStudent, setSearchInputStudent] = useState('');
    const [showExportModalStudent, setShowExportModalStudent] = useState(false);
    const [exportFieldsStudent, setExportFieldsStudent] = useState({
        no: true,
        fullName: true,
        studentIdNumber: true,
        citizenIdentity: true,
        date: true,
        proctoringTime: true,
        roomName: true,
        subjectCode: true,
    });
    const [startDateStudent, setStartDateStudent] = useState(null);
    const [endDateStudent, setEndDateStudent] = useState(null);
    const [modalDataStudent, setModalDataStudent] = useState({
        semesters: [],
        rooms: [],
        statuses: [],
        requests: [],
    });
    const [filtersStudent, setFiltersStudent] = useState({
        semester: 'All',
        room: 'All',
        status: 'All',
        request: 'All',
    });

    //Export Violation
    const [searchInputViolation, setSearchInputViolation] = useState('');
    const [showExportModaViolation, setShowExportModalViolation] = useState(false);
    const [exportFieldsViolation, setExportFieldsViolation] = useState({
        no: true,
        studentIdNumber: true,
        examRoom: true,
        date: true,
        timeDoing: true,
        violationTitle: true,
        resolveStatus: true,
    });
    const [startDateViolation, setStartDateViolation] = useState(null);
    const [endDateViolation, setEndDateViolation] = useState(null);
    const [modalDataViolation, setModalDataViolation] = useState({
        semesters: [],
        rooms: [],
        statuses: [],
        requests: [],
    });
    const [filtersViolation, setFiltersViolation] = useState({
        semester: 'All',
        room: 'All',
        status: 'All',
        request: 'All',
    });

    //Export Proctor
    const [searchInputProctor, setSearchInputProctor] = useState('');
    const [showExportModaProctor, setShowExportModalProctor] = useState(false);
    const [exportFieldsProctor, setExportFieldsProctor] = useState({
        no: true,
        proctorEmail: true,
        totalProctoringTime: true,
    });
    const [startDateProctor, setStartDateProctor] = useState(null);
    const [endDateProctor, setEndDateProctor] = useState(null);
    const [modalDataProctor, setModalDataProctor] = useState({
        semesters: [],
        rooms: [],
        statuses: [],
        requests: [],
    });
    const [filtersProctor, setFiltersProctor] = useState({
        semester: 'All',
        room: 'All',
        status: 'All',
        request: 'All',
    });

    //Student
    useEffect(() => {
        getAllDataStudentForExport();
        getDataCountStudent();
        getAllDataStudent1();
    }, [
        semesterFilterStudent,
        roomFilterStudent,
        subjectFilterStudent,
        roomFilterStudent1,
        subjectFilterStudent1,
        semesterFilterStudent1,
    ]);

    useEffect(() => {
        getAllDataStudent();
    }, [pageNumberStudent]);

    useEffect(() => {
        updateRoomAndSubjectStudentOptions(semesterFilterStudent);
    }, [semesterFilterStudent, dataStudent]);

    useEffect(() => {
        getAllDataSemesterForStudent();
    }, []);

    useEffect(() => {
        if (allSemesterStudent.size > 0) {
            getAllDataStudentForFilter();
        }
    }, [allSemesterStudent]);

    //Request
    useEffect(() => {
        getDataCountRequest();
        getDataRequest1();
    }, [semesterFilterRequest1, roomFilterRequest1, requestTitleFilterRequest1, statusFilterRequest1]);

    useEffect(() => {
        getDataRequest();
    }, [pageNumberRequest]);

    useEffect(() => {
        updateRoomAndStatusAndTitleRequestOptions(semesterFilter);
    }, [allDataRequest]);

    useEffect(() => {
        handleFilterRequest();
    }, [semesterFilter, roomFilterRequest, statusFilterRequest, titleFilterRequest, allDataRequest]);

    //Violation
    useEffect(() => {
        getDataCountViolation();
        getDataViolation1();
    }, [semesterFilterViolation1, violationTitleFilterViolation1, roomFilterViolation1, statusFilterViolation1]);

    useEffect(() => {
        getDataViolation();
    }, [pageNumberViolation]);

    useEffect(() => {
        updateRoomAndStatusAndTitleViolationOptions(semesterFilter);
    }, [allDataViolation]);

    useEffect(() => {
        handleFilterViolation();
    }, [semesterFilter, roomFilterViolation, statusFilterViolation, titleFilterViolation, allDataViolation]);

    //Proctor
    useEffect(() => {
        getDataCountProctor();
        getDataProctor1();
    }, [semesterFilterViolation1]);

    useEffect(() => {
        getDataProctor();
    }, [pageNumberProctor]);

    useEffect(() => {
        handleFilterProctor();
    }, [semesterFilter]);

    const applyFilters = () => {
        // handleFilterStudent();
    };

    //Student
    const getAllDataStudent = () => {
        const queryParams = new URLSearchParams({
            pageNumber: pageNumberStudent,
            pageSize: pageSize,
            semester: semesterFilterStudent,
        });

        authfetch(BACKEND_URL + `/api/Statistic/GetAbsentStudents?${queryParams.toString()}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, absentStudent } = rs;
                const formattedData = absentStudent.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                }));
                setDataStudent(formattedData);
                setAllDataStudent(formattedData);
                setTotalCountStudent(totalCount);
            })
            .catch((err) => {
                console.error(err);
            });
    };
    //Api All Export Student
    const getAllDataStudent1 = () => {
        const queryParams = new URLSearchParams({
            pageNumber: pageNumberStudent,
            semester: semesterFilterStudent,
        });

        authfetch(BACKEND_URL + `/api/Statistic/GetAbsentStudents?${queryParams.toString()}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, absentStudent } = rs;
                const formattedData = absentStudent.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                }));
                setDataStudent(formattedData);
                setAllDataStudent(formattedData);
                setDataExcelStudent(formattedData);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const getAllDataStudentForFilter = () => {
        const queryParams = new URLSearchParams({
            pageNumber: pageNumberStudent,
            pageSize: pageSize,
            semester: semesterFilter,
        });

        if (roomFilterStudent) {
            queryParams.append('examRoomName', roomFilterStudent);
        }

        if (subjectFilterStudent) {
            queryParams.append('subjectCode', subjectFilterStudent);
        }

        const url = BACKEND_URL + `/api/Statistic/GetAbsentStudents?${queryParams.toString()}`;

        authfetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch filtered data');
                }
                return response.json();
            })
            .then((responseData) => {
                const { totalCount, absentStudent } = responseData;
                const formattedData = absentStudent.map((item) => ({
                    ...item,
                    date: moment(item.startTime).format('YYYY-MM-DD'),
                }));
                console.log(formattedData);
                setAllSemesterFilterStudent(formattedData);
                setDataStudent(formattedData);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const getAllDataSemesterForStudent = () => {
        const url = BACKEND_URL + `/api/Statistic/GetAbsentStudents`;

        authfetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch filtered data');
                }
                return response.json();
            })
            .then((responseData) => {
                const { totalCount, absentStudent } = responseData;
                const formattedData = absentStudent.map((item) => ({
                    ...item,
                }));
                const semesters = new Set(absentStudent.map((item) => item.semester));
                setAllSemesterStudent(semesters);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const getAllDataStudentForExport = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetAbsentStudents?semester=${semester}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, absentStudent } = rs;
                setAllDataStudentForExport(
                    absentStudent.map((item) => ({
                        ...item,
                        date: moment(item.startTime).format('YYYY-MM-DD'),
                    })),
                );
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getDataCountStudent = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetAbsentStudentsCount`)
            .then((res) => res.json())
            .then((rs) => {
                setDataCountStudent(rs);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    //Request
    const getDataRequest = () => {
        authfetch(
            BACKEND_URL + `/api/Statistic/GetRequestStatistics?pageNumber=${pageNumberRequest}&pageSize=${pageSize}&semester=${semester}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, requests } = rs;
                setAllDataRequest(
                    requests.map((item) => ({
                        ...item,
                        date: moment(item.startTime).format('YYYY-MM-DD'),
                    })),
                );
                handleFilterRequest(getCurrentSemester());
                setTotalCountRequest(totalCount);
            })
            .catch((err) => {
                console.log(err);
            });
    };
    //Api All Export Request
    const getDataRequest1 = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetRequestStatistics?pageNumber=${pageNumberRequest}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, requests } = rs;
                setAllDataRequest(
                    requests.map((item) => ({
                        ...item,
                        date: moment(item.startTime).format('YYYY-MM-DD'),
                    })),
                );
                handleFilterRequest(getCurrentSemester());
                setTotalCountRequest(totalCount);
                setDataExcelRequest(requests);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getDataCountRequest = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetRequestCount?semester=${semester}`)
            .then((res) => res.json())
            .then((rs) => {
                setDataCountRequest(rs);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    //Violation
    const getDataViolation = () => {
        authfetch(
            BACKEND_URL + `/api/Statistic/GetAllViolationStatistics?pageNumber=${pageNumberViolation}&pageSize=${pageSize}&semester=${semester}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, violations } = rs;
                setAllDataViolation(
                    violations.map((item) => ({
                        ...item,
                        date: moment(item.date).format('YYYY-MM-DD'),
                    })),
                );
                handleFilterViolation(getCurrentSemester());
                setTotalCountViolation(totalCount);
            })
            .catch((err) => {
                console.log(err);
            });
    };
    //Api All Export Violation
    const getDataViolation1 = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetAllViolationStatistics?pageNumber=${pageNumberViolation}`)
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, violations } = rs;
                setAllDataViolation(
                    violations.map((item) => ({
                        ...item,
                        date: moment(item.date).format('YYYY-MM-DD'),
                    })),
                );
                handleFilterViolation(getCurrentSemester());
                setTotalCountViolation(totalCount);
                setDataExcelViolation(violations);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getDataCountViolation = () => {
        authfetch(BACKEND_URL + `/api/Statistic/CountAllViolations?semester=${semester}`)
            .then((res) => res.json())
            .then((rs) => {
                setDataCountViolation(rs);
                console.log(rs);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    //Proctor
    const getDataProctor = () => {
        authfetch(
            BACKEND_URL + `/api/Statistic/GetProctorsWithTotalProctoringTime?pageNumber=${pageNumberProctor}&pageSize=${pageSize}&semester=${semester}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, timeProctors } = rs;
                setAllDataProctor(timeProctors);
                handleFilterProctor(getCurrentSemester());
                setTotalCountProctor(totalCount);
            })
            .catch((err) => {
                console.log(err);
            });
    };
    //Api All Export Proctor
    const getDataProctor1 = () => {
        authfetch(
            BACKEND_URL + `/api/Statistic/GetProctorsWithTotalProctoringTime?pageNumber=${pageNumberProctor}`,
        )
            .then((res) => res.json())
            .then((rs) => {
                const { totalCount, timeProctors } = rs;
                setAllDataProctor(timeProctors);
                handleFilterProctor(getCurrentSemester());
                setTotalCountProctor(totalCount);
                setDataExcelProctor(timeProctors);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const getDataCountProctor = () => {
        authfetch(BACKEND_URL + `/api/Statistic/GetProctorsCount`)
            .then((res) => res.json())
            .then((rs) => {
                setDataCountProctor(rs);
                console.log(rs);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleButtonClick = (content) => {
        setActiveContent(content);
        setCurrentPage(1);
    };

    const getUniqueSemester = (data) => {
        const uniqueSemester = [...new Set(data.map((item) => item.semester))];
        return uniqueSemester;
    };

    //Filter Student
    const handleSemesterStudentChange = (selectedOption) => {
        setSemesterFilter(selectedOption ? selectedOption.value : '');
    };

    const handleRoomFilterStudentChange = (selectedOption) => {
        setRoomFilterStudent(selectedOption ? selectedOption.value : null);
    };

    const handleSubjectFilterChange = (selectedOption) => {
        setSubjectFilterStudent(selectedOption ? selectedOption.value : null);
    };
    const updateRoomAndSubjectStudentOptions = (semester) => {
        const filteredData = allDataStudent.filter((item) => item.semester === semester);
        const rooms = getUniqueRooms(filteredData).map((room) => ({ value: room, label: room }));
        const subjects = getUniqueSubjects(filteredData).map((subject) => ({ value: subject, label: subject }));

        setRoomStudentOptions(rooms);
        setSubjectStudentOptions(subjects);
    };

    const semesterStudentOptions = Array.from(allSemesterStudent).map((semester) => ({
        value: semester,
        label: semester,
    }));

    const getUniqueRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.roomName))];
        return uniqueRooms;
    };

    const getUniqueSubjects = (data) => {
        const uniqueSubjects = [...new Set(data.map((item) => item.subjectCode))];
        return uniqueSubjects;
    };

    //Filter request
    const handleFilterRequest = () => {
        let filtered = allDataRequest;

        if (semesterFilter) {
            filtered = filtered.filter((item) => item.semester === semesterFilter);
        }

        if (roomFilterRequest && roomFilterRequest !== 'All Rooms') {
            filtered = filtered.filter((item) => item.examRoom === roomFilterRequest);
        }

        if (statusFilterRequest && statusFilterRequest !== 'All Status') {
            filtered = filtered.filter((item) => item.resolveStatus === statusFilterRequest);
        }

        if (titleFilterRequest && titleFilterRequest !== 'All Title') {
            filtered = filtered.filter((item) => item.requestTitle === titleFilterRequest);
        }

        if (filtered.length !== dataRequest.length || !filtered.every((item, index) => item === dataRequest[index])) {
            setDataRequest(filtered);
        }
    };

    const handleRoomFilterRequestChange = (selectedOption) => {
        setRoomFilterRequest(selectedOption ? selectedOption.value : '');
        handleFilterRequest();
    };

    const handleStatusRequestFilterChange = (selectedOption) => {
        setStatusFilterRequest(selectedOption ? selectedOption.value : '');
        handleFilterRequest();
    };

    const handleTitleRequestFilterChange = (selectedOption) => {
        setTitleFilterRequest(selectedOption ? selectedOption.value : '');
        handleFilterRequest();
    };

    const handleSemesterRequestChange = (selectedOption) => {
        setSemesterFilter(selectedOption ? selectedOption.value : '');
    };

    const getUniqueRequestStatus = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.resolveStatus))];
        return uniqueStatus;
    };

    const getUniqueRequestTitle = (data) => {
        const uniqueTitle = [...new Set(data.map((item) => item.requestTitle))];
        return uniqueTitle;
    };

    const getUniqueRequestRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.examRoom))];
        return uniqueRooms;
    };

    const updateRoomAndStatusAndTitleRequestOptions = (semester) => {
        const filteredData = allDataRequest.filter((item) => item.semester === semester);
        const rooms = getUniqueRequestRooms(filteredData).map((room) => ({ value: room, label: room }));
        const status = getUniqueRequestStatus(filteredData).map((status) => ({ value: status, label: status }));
        const title = getUniqueRequestTitle(filteredData).map((title) => ({ value: title, label: title }));

        setRoomRequestOptions(rooms);
        setStatusRequestOptions(status);
        setTitleRequestOptions(title);
    };

    const semesterRequestOptions = getUniqueSemester(allDataRequest).map((semester) => ({
        value: semester,
        label: semester,
    }));

    //Filter violation
    const handleFilterViolation = () => {
        let filtered = allDataViolation;

        if (semesterFilter) {
            filtered = filtered.filter((item) => item.semester === semesterFilter);
        }

        if (roomFilterViolation && roomFilterViolation !== 'All Rooms') {
            filtered = filtered.filter((item) => item.examRoom === roomFilterViolation);
        }

        if (statusFilterViolation && statusFilterViolation !== 'All Status') {
            filtered = filtered.filter((item) => item.resolveStatus === statusFilterViolation);
        }

        if (titleFilterViolation && titleFilterViolation !== 'All Title') {
            filtered = filtered.filter((item) => item.violationTitle === titleFilterViolation);
        }

        if (
            filtered.length !== dataViolation.length ||
            !filtered.every((item, index) => item === dataViolation[index])
        ) {
            setDataViolation(filtered);
        }
    };

    const handleRoomViolationFilterChange = (selectedOption) => {
        setRoomFilterViolation(selectedOption ? selectedOption.value : '');
        handleFilterViolation();
    };

    const handleStatusViolationFilterChange = (selectedOption) => {
        setStatusFilterViolation(selectedOption ? selectedOption.value : '');
        handleFilterViolation();
    };

    const handleTitleViolationFilterChange = (selectedOption) => {
        setTitleFilterViolation(selectedOption ? selectedOption.value : '');
        handleFilterViolation();
    };

    const handleSemesterViolationChange = (selectedOption) => {
        setSemesterFilter(selectedOption ? selectedOption.value : '');
        handleFilterViolation();
    };

    const getUniqueViolationRooms = (data) => {
        const uniqueRooms = [...new Set(data.map((item) => item.examRoom))];
        return uniqueRooms;
    };

    const getUniqueViolationStatus = (data) => {
        const uniqueStatus = [...new Set(data.map((item) => item.resolveStatus))];
        return uniqueStatus;
    };

    const getUniqueViolationTitle = (data) => {
        const uniqueTitle = [...new Set(data.map((item) => item.violationTitle))];
        return uniqueTitle;
    };

    const updateRoomAndStatusAndTitleViolationOptions = (semester) => {
        const filteredData = allDataViolation.filter((item) => item.semester === semester);
        const rooms = getUniqueViolationRooms(filteredData).map((room) => ({ value: room, label: room }));
        const status = getUniqueViolationStatus(filteredData).map((status) => ({ value: status, label: status }));
        const title = getUniqueViolationTitle(filteredData).map((title) => ({ value: title, label: title }));

        setRoomViolationOptions(rooms);
        setStatusViolationOptions(status);
        setTitleViolationOptions(title);
    };

    const semesterViolationOptions = getUniqueSemester(allDataViolation).map((semester) => ({
        value: semester,
        label: semester,
    }));

    //Filter proctor
    const handleFilterProctor = () => {
        let filtered = allDataProctor;

        if (semesterFilter) {
            filtered = filtered.filter((item) => item.semester === semesterFilter);
        }

        setDataProctor(filtered);
    };

    const handleSemesterProctorChange = (selectedOption) => {
        setSemesterFilter(selectedOption ? selectedOption.value : '');
    };

    const semesterProctorOptions = getUniqueSemester(allDataProctor).map((semester) => ({
        value: semester,
        label: semester,
    }));

    //Export Request
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

    const exportToXlsx = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Request');

        const columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Student Id Number', key: 'studentIdNumber', width: 20 },
            { header: 'Exam Room', key: 'examRoom', width: 15 },
            { header: 'Start Time', key: 'date', width: 20 },
            { header: 'Time Doing', key: 'timeDoing', width: 20 },
            { header: 'Request Title', key: 'requestTitle', width: 40 },
            { header: 'Resolve Status', key: 'resolveStatus', width: 20 },
        ];
        const selectedColumns = columns.filter((column) => {
            switch (column.key) {
                case 'no':
                case 'studentIdNumber':
                case 'examRoom':
                case 'date':
                case 'timeDoing':
                case 'requestTitle':
                case 'resolveStatus':
                    return exportFields[column.key];
                default:
                    return true;
            }
        });

        worksheet.columns = selectedColumns;

        dataRequest.forEach((item, index) => {
            const row = {
                no: index + 1,
                studentIdNumber: item.studentIdNumber,
                examRoom: item.examRoom,
                date: item.date,
                timeDoing: item.timeDoing,
                requestTitle: item.requestTitle,
                resolveStatus: item.resolveStatus,
            };

            const selectedRow = selectedColumns.reduce((acc, col) => {
                acc[col.key] = row[col.key];
                return acc;
            }, {});

            worksheet.addRow(selectedRow);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const dataBlob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const today = new Date();
        const filename = `Request_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}.xlsx`;
        FileSaver.saveAs(dataBlob, filename);

        setShowExportModal(false);
    };

    const handleSearch = () => {
        applyFilters();
    };

    //Export Student
    const handleFilterChangeStudent = (filterName, value) => {
        setFiltersStudent((prevFilters) => {
            const updatedFilters = { ...prevFilters, [filterName]: value };
            applyFiltersStudent(updatedFilters);
            return updatedFilters;
        });
    };

    const handleStartDateChangeStudent = (date) => {
        setStartDateStudent(date);
        applyFiltersStudent({ ...filters, startDate: date });
    };

    const handleEndDateChangeStudent = (date) => {
        if (date) {
            const updatedDate = new Date(date);
            updatedDate.setHours(23, 59, 59, 999); // Thêm 23:59:59
            setEndDateStudent(updatedDate);
            applyFiltersStudent({ ...filters, endDate: updatedDate });
        } else {
            setEndDateStudent(null);
            applyFiltersStudent({ ...filters, endDate: null });
        }
    };

    const exportToXlsxStudent = async () => {
        getAllDataStudentForExport();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Student');

        const columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Full Name', key: 'fullName', width: 40 },
            { header: 'Student Id Number', key: 'studentIdNumber', width: 20 },
            { header: 'Citizen Identity', key: 'citizenIdentity', width: 30 },
            { header: 'Date', key: 'date', width: 25 },
            { header: 'Rroctoring Time', key: 'proctoringTime', width: 25 },
            { header: 'Room Name', key: 'roomName', width: 20 },
            { header: 'Subject Code', key: 'subjectCode', width: 30 },
        ];
        const selectedColumns = columns.filter((column) => {
            switch (column.key) {
                case 'no':
                case 'fullName':
                case 'studentIdNumber':
                case 'citizenIdentity':
                case 'date':
                case 'proctoringTime':
                case 'roomName':
                case 'subjectCode':
                    return exportFieldsStudent[column.key];
                default:
                    return true;
            }
        });

        worksheet.columns = selectedColumns;

        allDataStudentForExport.forEach((item, index) => {
            const row = {
                no: index + 1,
                fullName: item.fullName,
                studentIdNumber: item.studentIdNumber,
                citizenIdentity: item.citizenIdentity,
                date: item.date,
                proctoringTime: item.proctoringTime,
                roomName: item.roomName,
                subjectCode: item.subjectCode,
            };

            const selectedRow = selectedColumns.reduce((acc, col) => {
                acc[col.key] = row[col.key];
                return acc;
            }, {});

            worksheet.addRow(selectedRow);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const dataBlob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const today = new Date();
        const filename = `Student_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}.xlsx`;
        FileSaver.saveAs(dataBlob, filename);

        setShowExportModalStudent(false);
    };

    const handleSearchStudent = () => {
        applyFiltersStudent();
    };

    const applyFiltersStudent = (updatedFilters = filters) => {
        let filtered = [...dataStudent]; // Create a copy of the data

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
        if (searchInputStudent) {
            filtered = filtered.filter((item) => item.rollNo.toLowerCase().includes(searchInputStudent.toLowerCase()));
        }

        // Filter by start date
        if (startDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) <= endDate);
        }

        setFiltersStudent(filtered); // Update the filtered data state
    };

    //Export Violation
    const handleFilterChangeViolation = (filterName, value) => {
        setFiltersViolation((prevFilters) => {
            const updatedFilters = { ...prevFilters, [filterName]: value };
            applyFiltersViolation(updatedFilters);
            return updatedFilters;
        });
    };

    const handleStartDateChangeViolation = (date) => {
        setStartDateViolation(date);
        applyFiltersViolation({ ...filters, startDate: date });
    };

    const handleEndDateChangeViolation = (date) => {
        if (date) {
            const updatedDate = new Date(date);
            updatedDate.setHours(23, 59, 59, 999); // Thêm 23:59:59
            setEndDateViolation(updatedDate);
            applyFiltersViolation({ ...filters, endDate: updatedDate });
        } else {
            setEndDateViolation(null);
            applyFiltersViolation({ ...filters, endDate: null });
        }
    };

    const exportToXlsxViolation = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Violation');

        const columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Student Id Number', key: 'studentIdNumber', width: 25 },
            { header: 'Exam Room', key: 'examRoom', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Time Doing', key: 'timeDoing', width: 20 },
            { header: 'Violation Title', key: 'violationTitle', width: 40 },
            { header: 'Resolve Status', key: 'resolveStatus', width: 20 },
        ];
        const selectedColumns = columns.filter((column) => {
            switch (column.key) {
                case 'no':
                case 'studentIdNumber':
                case 'examRoom':
                case 'date':
                case 'timeDoing':
                case 'violationTitle':
                case 'resolveStatus':
                    return exportFieldsViolation[column.key];
                default:
                    return true;
            }
        });

        worksheet.columns = selectedColumns;

        dataViolation.forEach((item, index) => {
            const row = {
                no: index + 1,
                studentIdNumber: item.studentIdNumber,
                examRoom: item.examRoom,
                date: item.date,
                timeDoing: item.timeDoing,
                violationTitle: item.violationTitle,
                resolveStatus: item.resolveStatus,
            };

            const selectedRow = selectedColumns.reduce((acc, col) => {
                acc[col.key] = row[col.key];
                return acc;
            }, {});

            worksheet.addRow(selectedRow);
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const dataBlob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const today = new Date();
        const filename = `Violation_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}.xlsx`;
        FileSaver.saveAs(dataBlob, filename);

        setShowExportModalViolation(false);
    };

    const handleSearchViolation = () => {
        applyFiltersViolation();
    };

    const applyFiltersViolation = (updatedFilters = filters) => {
        let filtered = [...dataViolation]; // Create a copy of the data

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
        if (searchInputStudent) {
            filtered = filtered.filter((item) => item.rollNo.toLowerCase().includes(searchInputStudent.toLowerCase()));
        }

        // Filter by start date
        if (startDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) <= endDate);
        }

        setFiltersStudent(filtered); // Update the filtered data state
    };

    //Export Proctor
    const handleFilterChangeProctor = (filterName, value) => {
        setFiltersProctor((prevFilters) => {
            const updatedFilters = { ...prevFilters, [filterName]: value };
            applyFiltersProctor(updatedFilters);
            return updatedFilters;
        });
    };

    const handleStartDateChangeProctor = (date) => {
        setStartDateProctor(date);
        applyFiltersProctor({ ...filters, startDate: date });
    };

    const handleEndDateChangeProctor = (date) => {
        if (date) {
            const updatedDate = new Date(date);
            updatedDate.setHours(23, 59, 59, 999); // Thêm 23:59:59
            setEndDateProctor(updatedDate);
            applyFiltersProctor({ ...filters, endDate: updatedDate });
        } else {
            setEndDateProctor(null);
            applyFiltersProctor({ ...filters, endDate: null });
        }
    };

    const exportToXlsxProctor = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Proctor');

        const columns = [
            { header: 'No', key: 'no', width: 10 },
            { header: 'Proctor Email', key: 'proctorEmail', width: 40 },
            { header: 'Total Proctoring Time', key: 'totalProctoringTime', width: 20 },
        ];

        const selectedColumns = columns.filter((column) => {
            switch (column.key) {
                case 'no':
                case 'proctorEmail':
                case 'totalProctoringTime':
                    return exportFieldsProctor[column.key];
                default:
                    return true;
            }
        });

        worksheet.columns = selectedColumns;

        dataProctor.forEach((item, index) => {
            const row = {
                no: index + 1,
                proctorEmail: item.proctorEmail,
                totalProctoringTime: item.totalProctoringTime,
            };

            const selectedRow = selectedColumns.reduce((acc, col) => {
                acc[col.key] = row[col.key];
                return acc;
            }, {});

            worksheet.addRow(selectedRow);
        });
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const dataBlob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const today = new Date();
        const filename = `Proctor_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}.xlsx`;
        FileSaver.saveAs(dataBlob, filename);

        setShowExportModalProctor(false);
    };

    const handleSearchProctor = () => {
        applyFiltersProctor();
    };

    const applyFiltersProctor = (updatedFilters = filters) => {
        let filtered = [...dataProctor]; // Create a copy of the data

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
        if (searchInputProctor) {
            filtered = filtered.filter((item) => item.rollNo.toLowerCase().includes(searchInputProctor.toLowerCase()));
        }

        // Filter by start date
        if (startDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) >= startDate);
        }

        // Filter by end date
        if (endDate) {
            filtered = filtered.filter((item) => new Date(item.requestDate) <= endDate);
        }

        setFiltersProctor(filtered); // Update the filtered data state
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-analysis">
                <div className="header-analysis" style={{ fontSize: '14px' }}>
                    <Link className="link-analysis" to="/examinerhead">
                        Home
                    </Link>
                    {' > '}
                    <span>Analysis Report</span>
                </div>

                <div className="statistics-container">
                    <button
                        className={`statistics-button ${activeContent === 'student' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('student')}
                    >
                        <p>Student Absent Statistics</p>
                        {dataCountStudent.totalCount !== undefined ? (
                            <p className="count-statistics">{dataCountStudent.totalCount}</p>
                        ) : (
                            <p>No Data...</p>
                        )}
                    </button>

                    <button
                        className={`statistics-button ${activeContent === 'request' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('request')}
                    >
                        <p>Request Statistics</p>
                        {dataCountRequest.totalCount !== undefined ? (
                            <p className="count-statistics">{dataCountRequest.totalCount}</p>
                        ) : (
                            <p>No Data...</p>
                        )}
                    </button>
                    <button
                        className={`statistics-button ${activeContent === 'violation' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('violation')}
                    >
                        <p>Violation Statistics</p>
                        {dataCountViolation.totalCount !== undefined ? (
                            <p className="count-statistics">{dataCountViolation.totalCount}</p>
                        ) : (
                            <p>No Data...</p>
                        )}
                    </button>
                    <button
                        className={`statistics-button ${activeContent === 'proctor' ? 'active' : ''}`}
                        onClick={() => handleButtonClick('proctor')}
                    >
                        <p>Proctor Statistics</p>
                        {dataCountProctor.proctorCount !== undefined ? (
                            <p className="count-statistics">{dataCountProctor.proctorCount}</p>
                        ) : (
                            <p>No Data...</p>
                        )}
                    </button>
                </div>
                {activeContent === 'student' && (
                    <div className="student-content">
                        <div className="body-container-analysis">
                            <span>Search: </span>
                            <input type="text" placeholder="Search By Roll No" />
                            <button className="btn btn-primary">Search</button>
                            <button
                                style={{ color: 'white' }}
                                className="btn btn-warning"
                                onClick={() => setShowExportModal(true)}
                            >
                                Export
                            </button>
                        </div>
                        <div className="body-container-assignproctor filter-container">
                            <span style={{ marginRight: 20 }}>Filter:</span>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={roomStudentOptions}
                                    onChange={handleRoomFilterStudentChange}
                                    isClearable
                                    placeholder="Select a room"
                                />
                            </Form.Group>
                            <Form.Group controlId="subjectFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={subjectStudentOptions}
                                    onChange={handleSubjectFilterChange}
                                    isClearable
                                    placeholder="Select a subject"
                                />
                            </Form.Group>
                            <Form.Group controlId="semesterFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={semesterStudentOptions}
                                    onChange={handleSemesterStudentChange}
                                    placeholder="Select a semester"
                                    defaultValue={{ value: getCurrentSemester(), label: getCurrentSemester() }}
                                />
                            </Form.Group>
                            <button className="btn btn-primary" onClick={getAllDataStudentForFilter}>
                                Filter
                            </button>
                        </div>
                        <table className="table-analysis-student">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Full Name</th>
                                    <th>Roll No</th>
                                    <th>ID Card</th>
                                    <th>Date</th>
                                    <th>Slot</th>
                                    <th>Room</th>
                                    <th>Subject</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataStudent && dataStudent.length > 0
                                    ? dataStudent.map((item, index) => (
                                          <tr key={index}>
                                              <td>{index + startIndexStudent}</td>
                                              <td>{item.fullName}</td>
                                              <td>{item.studentIdNumber}</td>
                                              <td>{item.citizenIdentity}</td>
                                              <td>{item.date}</td>
                                              <td>{item.proctoringTime}</td>
                                              <td>{item.roomName}</td>
                                              <td>{item.subjectCode}</td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>
                        {/* Export Modal */}
                        <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Export Student Options</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="body-container-handlerequest1">
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleSemesterFilterChangeStudent}
                                        >
                                            <option value="">Select Semester</option>
                                            {semesterOptionsStudent1.map((option, index) => (
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
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleRoomFilterChangeStudent}
                                        >
                                            <option value="">Select Room</option>
                                            {roomOptionsStudent1.map((option, index) => (
                                                <option key={index} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleSubjectFilterChangeStudent}
                                        >
                                            <option value="">Select Subject</option>
                                            {subjectOptionsStudent1.map((option, index) => (
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
                        <div>
                            <br />
                            <ul className="pagination">
                                <li className={`page-item ${pageNumberStudent === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberStudent(pageNumberStudent - 1)}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {Array.from({ length: totalPageStudents }, (_, index) => (
                                    <li
                                        key={index}
                                        className={`page-item ${pageNumberStudent === index + 1 ? 'active' : ''}`}
                                    >
                                        <button className="page-link" onClick={() => setPageNumberStudent(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${pageNumberStudent === totalPageStudents ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberStudent(pageNumberStudent + 1)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
                {activeContent === 'request' && (
                    <div className="request-content">
                        <div className="body-container-analysis">
                            <span>Search: </span>
                            <input type="text" placeholder="Search Roll No" />
                            <button className="btn btn-primary">Search</button>
                            <button
                                style={{ color: 'white' }}
                                className="btn btn-warning"
                                onClick={() => setShowExportModal(true)}
                            >
                                Export
                            </button>
                        </div>
                        <div className="body-container-assignproctor filter-container">
                            <span style={{ marginRight: 20 }}>Filter:</span>

                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={roomRequestOptions}
                                    onChange={handleRoomFilterRequestChange}
                                    isClearable
                                    placeholder="Select a room"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={titleRequestOptions}
                                    onChange={handleTitleRequestFilterChange}
                                    isClearable
                                    placeholder="Select a request Title"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={statusRequestOptions}
                                    onChange={handleStatusRequestFilterChange}
                                    isClearable
                                    placeholder="Select a status"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={semesterRequestOptions}
                                    onChange={handleSemesterRequestChange}
                                    placeholder="Select a semester"
                                    defaultValue={{ value: getCurrentSemester(), label: getCurrentSemester() }}
                                />
                            </Form.Group>
                            <button className="btn btn-primary">Filter</button>
                        </div>
                        <table className="table-analysis-request">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Roll No</th>
                                    <th>Room</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Request Title</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataRequest && dataRequest.length > 0
                                    ? dataRequest.map((item, index) => (
                                          <tr key={index}>
                                              <td>{index + startIndexRequest}</td>
                                              <td>{item.studentIdNumber}</td>
                                              <td>{item.examRoom}</td>
                                              <td>{item.date}</td>
                                              <td>{item.timeDoing}</td>
                                              <td>{item.requestTitle}</td>
                                              <td>
                                                  <span
                                                      className={`status-text ${getStatusClassRequest(
                                                          item.resolveStatus,
                                                      )}`}
                                                  >
                                                      {item.resolveStatus}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>
                        {/* Export Modal */}
                        <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Export Request Options</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="body-container-handlerequest1">
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleSemesterFilterChangeRequest}
                                        >
                                            <option value="">Select Semester</option>
                                            {semesterOptionsRequest1.map((option, index) => (
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
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleRoomFilterChangeRequest}
                                        >
                                            <option value="">Select Room</option>
                                            {roomOptionsRequest1.map((option, index) => (
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
                                            onChange={handleRequestFilterChangeRequest}
                                        >
                                            <option value="">Select Request Title</option>
                                            {requestTitleOptionsRequest1.map((option, index) => (
                                                <option key={index} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleStatusFilterChangeRequest}
                                        >
                                            <option value="">Select Status</option>
                                            {statusOptionsRequest1.map((option, index) => (
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
                                <Button variant="primary" onClick={handleExportExcelRequest}>
                                    Export
                                </Button>
                            </Modal.Footer>
                        </Modal>
                        <div>
                            <br />
                            <ul className="pagination">
                                <li className={`page-item ${pageNumberRequest === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberRequest(pageNumberRequest - 1)}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {Array.from({ length: totalPageRequests }, (_, index) => (
                                    <li
                                        key={index}
                                        className={`page-item ${pageNumberRequest === index + 1 ? 'active' : ''}`}
                                    >
                                        <button className="page-link" onClick={() => setPageNumberRequest(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${pageNumberRequest === totalPageRequests ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberRequest(pageNumberRequest + 1)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
                {activeContent === 'violation' && (
                    <div className="violation-content">
                        <div className="body-container-analysis">
                            <span>Search: </span>
                            <input type="text" placeholder="Search Roll No" />
                            <button className="btn btn-primary">Search</button>
                            <button
                                style={{ color: 'white' }}
                                className="btn btn-warning"
                                onClick={() => setShowExportModal(true)}
                            >
                                Export
                            </button>
                        </div>

                        <div className="body-container-assignproctor filter-container">
                            <span style={{ marginRight: 20 }}>Filter:</span>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={roomViolationOptions}
                                    onChange={handleRoomViolationFilterChange}
                                    isClearable
                                    placeholder="Select a room"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={titleViolationOptions}
                                    onChange={handleTitleViolationFilterChange}
                                    isClearable
                                    placeholder="Select a violation title"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={statusViolationOptions}
                                    onChange={handleStatusViolationFilterChange}
                                    isClearable
                                    placeholder="Select a status"
                                />
                            </Form.Group>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={semesterViolationOptions}
                                    onChange={handleSemesterViolationChange}
                                    placeholder="Select a semester"
                                    defaultValue={{ value: getCurrentSemester(), label: getCurrentSemester() }}
                                />
                            </Form.Group>
                            <button className="btn btn-primary">Filter</button>
                        </div>
                        <table className="table-analysis-violation">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Roll No</th>
                                    <th>Room</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Violation Title</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataViolation && dataViolation.length > 0
                                    ? dataViolation.map((item, index) => (
                                          <tr key={index}>
                                              <td>{index + startIndexViolation}</td>
                                              <td>{item.studentIdNumber}</td>
                                              <td>{item.examRoom}</td>
                                              <td>{item.date}</td>
                                              <td>{item.timeDoing}</td>
                                              <td>{item.violationTitle}</td>
                                              <td>
                                                  <span
                                                      className={`status-text ${getStatusClassViolation(
                                                          item.resolveStatus,
                                                      )}`}
                                                  >
                                                      {item.resolveStatus}
                                                  </span>
                                              </td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>
                        {/* Export Modal */}
                        <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Export Violation Options</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="body-container-handlerequest1">
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleSemesterFilterChangeViolation}
                                        >
                                            <option value="">Select Semester</option>
                                            {semesterOptionsViolation1.map((option, index) => (
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
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleRoomFilterChangeViolation}
                                        >
                                            <option value="">Select Room</option>
                                            {roomOptionsViolation1.map((option, index) => (
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
                                            onChange={handleViolationFilterChangeViolation}
                                        >
                                            <option value="">Select Violation Title</option>
                                            {violationTitleOptionsViolation1.map((option, index) => (
                                                <option key={index} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleStatusFilterChangeViolation}
                                        >
                                            <option value="">Select Status</option>
                                            {statusOptionsViolation1.map((option, index) => (
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
                        <div>
                            <br />
                            <ul className="pagination">
                                <li className={`page-item ${pageNumberViolation === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberViolation(pageNumberViolation - 1)}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {Array.from({ length: totalPageViolations }, (_, index) => (
                                    <li
                                        key={index}
                                        className={`page-item ${pageNumberViolation === index + 1 ? 'active' : ''}`}
                                    >
                                        <button className="page-link" onClick={() => setPageNumberViolation(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${
                                        pageNumberViolation === totalPageViolations ? 'disabled' : ''
                                    }`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberViolation(pageNumberViolation + 1)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
                {activeContent === 'proctor' && (
                    <div className="violation-content">
                        <div className="body-container-analysis">
                            <span>Search: </span>
                            <input type="text" placeholder="Search Proctor Email" />
                            <button className="btn btn-primary">Search</button>
                            <button
                                style={{ color: 'white' }}
                                className="btn btn-warning"
                                onClick={() => setShowExportModal(true)}
                            >
                                Export
                            </button>
                        </div>

                        <div className="body-container-assignproctor filter-container">
                            <span style={{ marginRight: 20 }}>Filter:</span>
                            <Form.Group controlId="roomFilter">
                                <Select
                                    className="fixed-width-input"
                                    options={semesterProctorOptions}
                                    onChange={handleSemesterProctorChange}
                                    placeholder="Select a semester"
                                    defaultValue={{ value: getCurrentSemester(), label: getCurrentSemester() }}
                                />
                            </Form.Group>
                            <button className="btn btn-primary">Filter</button>
                        </div>
                        <table className="table-analysis-violation">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Proctor Email</th>
                                    <th>Total Proctoring Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allDataProctor && allDataProctor.length > 0
                                    ? allDataProctor.map((item, index) => (
                                          <tr key={index}>
                                              <td>{index + startIndexProctor}</td>
                                              <td>{item.proctorEmail}</td>
                                              <td>{item.totalProctoringTime} minutes</td>
                                          </tr>
                                      ))
                                    : 'No Data...'}
                            </tbody>
                        </table>
                        <div>
                            <br />
                            <ul className="pagination">
                                <li className={`page-item ${pageNumberProctor === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberProctor(pageNumberProctor - 1)}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {Array.from({ length: totalPageProctors }, (_, index) => (
                                    <li
                                        key={index}
                                        className={`page-item ${pageNumberProctor === index + 1 ? 'active' : ''}`}
                                    >
                                        <button className="page-link" onClick={() => setPageNumberProctor(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li
                                    className={`page-item ${pageNumberProctor === totalPageProctors ? 'disabled' : ''}`}
                                >
                                    <button
                                        className="page-link"
                                        onClick={() => setPageNumberProctor(pageNumberProctor + 1)}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </div>
                        {/* Export Modal */}
                        <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Export Proctor Options</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <div className="body-container-handlerequest1">
                                    <Form.Group controlId="subjectFilter">
                                        <Form.Select
                                            className="fixed-width-input"
                                            onChange={handleSemesterFilterChangeProctor}
                                        >
                                            <option value="">Select Semester</option>
                                            {semesterOptionsProctor1.map((option, index) => (
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
                                <Button variant="primary" onClick={handleExportExcelProctor}>
                                    Export
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    </div>
                )}
            </div>
        </Fragment>
    );
};

export default AnalysisReport;
