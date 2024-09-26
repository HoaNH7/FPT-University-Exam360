import React from 'react';
import { Link } from 'react-router-dom';
import './examinerpage.scss';

const ExaminerPage = () => {
    return (
        <table className="table-content">
            <tbody className="tbody-content">
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/handlerequest">
                            Handle Request
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewRecordsViolation">
                            Handle Violation Record
                        </Link>
                    </th>
                </tr>
                {/* <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewcheckin">
                            View Check in
                        </Link>
                    </th>
                </tr> */}
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewcheckout">
                            View Check out
                        </Link>
                    </th>
                </tr>
                <tr>
                        <th className="th-content" scope="row">
                            <Link className="link-content" to="/sendnotification">
                                Send Notification
                            </Link>
                        </th>
                    </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/viewfiledat">
                            View Submit File Dat Of Student
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};

export default ExaminerPage;
