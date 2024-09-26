import React from 'react';
import { Link } from 'react-router-dom';
const StudentPage = () => {
    return (
        <table className="table-content">
            <tbody>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/submitfiledat">
                            Submit File Dat
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};
export default StudentPage;
