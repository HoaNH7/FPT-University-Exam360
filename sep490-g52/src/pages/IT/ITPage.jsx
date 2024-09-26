import React from 'react';
import { Link } from 'react-router-dom';
import './itpage.scss';

const ITPage = () => {
    return (
        <table className="table-content">
            <tbody className="tbody-content">
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/">
                            Receive Support From Invigilators And Examiners
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/resetPassword">
                            Reset Password
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/">
                            Add Student's Mac Address
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};

export default ITPage;
