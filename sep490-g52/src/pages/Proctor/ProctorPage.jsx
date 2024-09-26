import React from 'react';
import { Link } from 'react-router-dom';
import './proctorpage.scss';

const ProctorPage = () => {
    return (
        <table className="table-content">
            <tbody className="tbody-content">
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/examschedule">
                            Exam Schedule
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewrequest">
                            View Request
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewRecordsViolationsProctor">
                            View Records Violations
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewfiledat">
                            View Submit File Dat
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};

export default ProctorPage;
