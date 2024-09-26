import React from 'react';
import { Link } from 'react-router-dom';
import './adminpage.scss';

const AdminPage = () => {
    return (
        <table className="table-content">
            <tbody className="tbody-content">
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/admin/campusmanagement">
                            Campus Management
                        </Link>
                    </th>
                </tr>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/admin/usermanagement">
                            Examiner-Head Management
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};

export default AdminPage;
