import React from 'react';
import { Link } from 'react-router-dom';
const HallwayProctor = () => {
    return (
        <table className="table-content">
            <tbody>
                <tr>
                    <th className="th-content" scope="row">
                        <Link className="link-content" to="/receiveRequest">
                            Receive Request
                        </Link>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};
export default HallwayProctor;
