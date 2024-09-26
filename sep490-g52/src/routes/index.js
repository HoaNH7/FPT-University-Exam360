import LoginPage from '../pages/Login/LoginPage';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage';
//Admin
import AdminPage from '../pages/Admin/AdminPage';
import Course from '../pages/Admin/Course/Course';
import NewSemester from '../pages/Admin/NewSemester/NewSemester';
import CRUDAdminPage from '../pages/Admin/CRUDAdminPage';
import UserManagement from '../pages/Admin/UserManagement/UserManagement';
import AddUser from '../pages/Admin/UserManagement/AddUser';

import DetailUser from '../pages/Admin/UserManagement/DetailUser';
import EditUser from '../pages/Admin/UserManagement/EditUser';
import CampusManagement from '../pages/Admin/Campus/CampusManagement';
import AddCampus from '../pages/Admin/Campus/AddCampus';
import DetailCampus from '../pages/Admin/Campus/DetailCampus';
import EditCampus from '../pages/Admin/Campus/EditCampus';
// IT
import ITPage from '../pages/IT/ITPage';
import ITSTAFFPAGE from '../pages/IT/ITPage';
import ResetPassword from '../pages/IT/ResetPassword/ResetPassword';

//Examiner
import ExaminerPage from '../pages/Examiner/ExaminerPage';
import HandleRequest from '../pages/Examiner/HandleRequest/HandleRequest';
import CheckSubmit from '../pages/Examiner/CheckSubmit/CheckSubmit';
import ViewRecordsViolations from '../pages/Examiner/ViewRecordsViolations/ViewRecordsViolations';
import ViewCheckin from '../pages/Examiner/ViewCheckin/ViewCheckin';
import ViewCheckout from '../pages/Examiner/ViewCheckout/ViewCheckout';

//Proctor
import ExamSchedule from '../pages/Proctor/ExamSchedule/ExamSchedule';
import ExamCode from '../pages/Proctor/ExamCode/ExamCode';
import CheckIn from '../pages/Proctor/CheckIn/CheckIn';
import ReceiveExamCode from '../pages/Proctor/ReceiveExamCode/ReceiveExamCode';
import ViewRequest from '../pages/Proctor/ViewRequest/ViewRequest';
import SendRequest from '../pages/Proctor/SendRequest/SendRequest';
import CheckOut from '../pages/Proctor/CheckOut/CheckOut';
import MakeRecordsViolations from '../pages/Proctor/MakeRecordsViolations/MakeRecordsViolations';
import ViewRecordsViolationsProctor from '../pages/Proctor/ViewRecordsViolations/ViewRecordsViolationsProctor';
import ViewFileDatProctor from '../pages/Proctor/ViewFileDatProctor/ViewFileDatProctor';
import SendRequestToHallwayProctor from '../pages/Proctor/SendRequestToHallwayProctor/SendRequestToHallwayProctor';

//Examiner-Head
import UserCampusManagement from '../pages/Examiner-Head/UserCampusManagement/UserManagement';
import ExaminerHeadPage from '../pages/Examiner-Head/ExaminerHeadPage';
import ExamCodeManagement from '../pages/Examiner-Head/ExamCode/ExamCodeManagement';
import DetailExamCode from '../pages/Examiner-Head/ExamCode/DetailExamCode';
import EditExamCode from '../pages/Examiner-Head/ExamCode/EditExamCode';
import AddUserCampus from '../pages/Examiner-Head/UserCampusManagement/AddUser';
import EditUserCampus from '../pages/Examiner-Head/UserCampusManagement/EditUser';
import DetailUserCampus from '../pages/Examiner-Head/UserCampusManagement/DetailUser';
import AssignProctor from '../pages/Examiner-Head/AssignProctor/AssignProctor';
import GetExamSchedule from '../pages/Examiner-Head/GetExamScheduleByFAP/GetExamSchedule';
import GetStudents from '../pages/Examiner-Head/GetExamScheduleByFAP/GetStudentFromFAP';
import ViewFileDat from '../pages/Examiner/ViewFileDat/ViewFileDat';
import SubmitFileDat from '../pages/Examiner/SubmitFileDat/SubmitFileDat';
//Student
import StudentPage from '../pages/Student/StudentPage';
import AnalysisReport from '../pages/Examiner-Head/AnalysisReport/AnalysisReport';
import ExamScheduleManagePage from '../pages/Proctor/ExamScheduleManage/ExamScheduleManage';
import ExamScheduleManage from '../pages/Proctor/ExamScheduleManage/ExamScheduleManage';
//Hallway Proctor
import HallwayProctor from '../pages/HallwayProctor/HallwayProctor';
import ReceiveRequest from '../pages/HallwayProctor/HandleRequest/ReceiveRequest';
import ImportRetakeExamSchedule from '../pages/Examiner-Head/ImportRetakeExamSchedule/ImportRetakeExamSchedule';
import SendNotification from '../pages/Examiner/SendNotification/SendNotification';

// eslint-disable-next-line no-sparse-arrays
export const routes = [
    {
        path: '/',
        page: LoginPage,
        roles: ['Anonymous'],
    },
    {
        path: '/login',
        page: LoginPage,
        roles: ['Anonymous'],
    },
    //Admin routes
    {
        path: '/admin',
        page: AdminPage,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/newsemester',
        page: NewSemester,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/course',
        page: Course,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/crudadmin',
        page: CRUDAdminPage,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/usermanagement',
        page: UserManagement,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/usermanagement/detailUser/:id',
        component: { DetailUser },
        page: DetailUser,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/management/adduser',
        page: AddUser,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/usermanagement/editUser/:id',
        component: { EditUser },
        page: EditUser,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/campusmanagement',
        page: CampusManagement,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/campusmanagement/addCampus',
        page: AddCampus,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/campusmanagement/detailCampus/:id',
        component: { DetailCampus },
        page: DetailCampus,
        isShowHeader: true,
        roles: ['Admin'],
    },
    {
        path: '/admin/campusmanagement/editCampus/:id',
        component: { EditCampus },
        page: EditCampus,
        isShowHeader: true,
        roles: ['Admin'],
    },
    //Examiner
    {
        path: '/examiner',
        page: ExaminerPage,
        isShowHeader: true,
        roles: ['Examiner'],
    },
    {
        path: '/viewcheckin',
        page: ViewCheckin,
        isShowHeader: true,
        roles: ['Examiner', 'Admin'],
    },
    {
        path: '/sendnotification',
        page: SendNotification,
        isShowHeader: true,
        roles: ['Examiner', 'Admin'],
    },
    {
        path: '/viewcheckout',
        page: ViewCheckout,
        isShowHeader: true,
        roles: ['Examiner', 'Admin'],
    },
    {
        path: '/handlerequest',
        page: HandleRequest,
        isShowHeader: true,
        roles: ['Examiner', 'Admin'],
    },
    {
        path: '/checksubmit',
        page: CheckSubmit,
        isShowHeader: true,
        roles: ['Examiner'],
    },
    {
        path: '/viewfiledat',
        page: ViewFileDat,
        isShowHeader: true,
        roles: ['Examiner'],
    },
    {
        path: '/submitfiledat',
        page: SubmitFileDat,
        isShowHeader: true,
        roles: ['Student'],
    },
    {
        path: '/viewRecordsViolation',
        page: ViewRecordsViolations,
        isShowHeader: true,
        roles: ['Examiner'],
    },
    //IT
    {
        path: '/it',
        page: ITPage,
        isShowHeader: true,
        roles: ['ITStaff'],
    },
    {
        path: '/itstaff',
        page: ITSTAFFPAGE,
        isShowHeader: true,
        roles: ['ITStaff'],
    },
    {
        path: '/ResetPassword',
        page: ResetPassword,
        isShowHeader: true,
        roles: ['ITStaff'],
    },
    //Proctor
    {
        path: '/examschedulemanage',
        page: ExamScheduleManage,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/examschedule',
        page: ExamSchedule,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/examcode',
        page: ExamCode,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/checkin',
        page: CheckIn,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/receiveExamCode',
        page: ReceiveExamCode,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/viewrequest',
        page: ViewRequest,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/sendrequest',
        page: SendRequest,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/checkout',
        page: CheckOut,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/makeRecordViolation',
        page: MakeRecordsViolations,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/viewRecordsViolationsProctor',
        page: ViewRecordsViolationsProctor,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/viewfiledatproctor',
        page: ViewFileDatProctor,
        isShowHeader: true,
        roles: ['Proctor'],
    },
    {
        path: '/sendRequestToHallwayProctor',
        page: SendRequestToHallwayProctor,
        isShowHeader: true,
        roles: ['Proctor'],
    },

    //Hallway Proctor
    {
        path: '/hallwayProctor',
        page: HallwayProctor,
        isShowHeader: true,
        roles: ['HallwayProctor'],
    },
    {
        path: '/receiveRequest',
        page: ReceiveRequest,
        isShowHeader: true,
        roles: ['HallwayProctor'],
    },
    //Examiner-Head
    {
        path: '/examinerhead',
        page: ExaminerHeadPage,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/analysisReport',
        page: AnalysisReport,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/examcodemanagement',
        page: ExamCodeManagement,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/detailExamCode',
        page: DetailExamCode,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/editExamCode',
        page: EditExamCode,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/examinerhead/usermanagement',
        page: UserCampusManagement,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/examinerhead/usermanagement/detailUser/:id',
        component: { DetailUser },
        page: DetailUserCampus,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/examinerhead/management/adduser',
        page: AddUserCampus,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/examinerhead/usermanagement/editUser/:id',
        component: { EditUserCampus },
        page: EditUserCampus,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/getExamScheduleByFAP',
        page: GetExamSchedule,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/GetStudentsFromFAP',
        page: GetStudents,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    ,
    {
        path: '/assignProctor',
        page: AssignProctor,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    {
        path: '/importRetakeExamSchedule',
        page: ImportRetakeExamSchedule,
        isShowHeader: true,
        roles: ['ExaminerHead'],
    },
    // student
    {
        path: '/student',
        page: StudentPage,
        isShowHeader: true,
        roles: ['Student'],
    },
    // not found page
    {
        path: '*',
        page: NotFoundPage,
        roles: ['Anonymous'],
    },
];
