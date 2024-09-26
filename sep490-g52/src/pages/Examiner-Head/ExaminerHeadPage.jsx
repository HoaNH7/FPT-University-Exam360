import React from 'react';
import { Link } from 'react-router-dom';
import './examinerheadpage.scss';

const ExaminerHeadPage = () => {
    return (
        <table className="table-content">
            <tbody className="tbody-content">
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/examinerhead/usermanagement">
                            Campus User Management
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/examcodemanagement">
                            Exam Code Management
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/assignProctor">
                            Assign Proctor To Exam Room
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/importRetakeExamSchedule">
                            Import Retake Exam Schedule
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/getExamScheduleByFAP">
                            Get Exam Schedule From FAP
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/analysisReport">
                            Analysis Report
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};

export default ExaminerHeadPage;
