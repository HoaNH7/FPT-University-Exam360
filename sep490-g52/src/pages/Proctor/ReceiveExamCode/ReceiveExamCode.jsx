import {BACKEND_URL} from '../../../constant';
import './ReceiveExamCode.scss';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
import { useAuthFetch } from '../../../auth';
import { useCurrentUserInfo } from '../../../auth';

const ReceiveExamCode = () => {
    const [data, setData] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const authfetch = useAuthFetch();
    const user = useCurrentUserInfo();
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const startTime = query.get('startTime');
    const endTime = query.get('endTime');

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/ReceiveExamCode/GetExamCodeByProctorId/${user.userId}/${startTime}/${endTime}`,
        )
            .then((response) => response.json())
            .then((result) => {
                setData(result);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <Fragment>
            <ToastContainer />
            <div>
                <div className="user-management-header">
                    <Link className="user-management-link" to="/proctor">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Receive Exam Code</span>{' '}
                </div>
                <div className="body-container">
                    <span style={{ marginRight: 10 }}>Search: </span>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary">Search</button>
                    <div>
                        {/* <label>Filter:</label> */}
                        <Form.Select className="w-100 fs-4" aria-label="Default select example">
                            <option>All</option>
                            <option value="1">Da thi</option>
                            <option value="2">Chua thi</option>
                        </Form.Select>
                    </div>
                </div>
                <table className="user-table table-grey table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Subject Code</th>
                            <th>Subject Name</th>
                            <th>Exam Code</th>
                            <th>Open Code</th>
                            <th>Title</th>
                            <th>Note</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data && data.length > 0
                            ? data.map((item, index) => (
                                  <tr key={index}>
                                      <td>{index + 1}</td>
                                      <td>{item.startTime}</td>
                                      <td>
                                          <tr>{item.endTime}</tr>
                                      </td>
                                      <td>
                                          <tr>{item.subjectCode}</tr>
                                      </td>

                                      <td>
                                          <tr>{item.subjectName}</tr>
                                      </td>
                                      <td>
                                          <tr>{item.code}</tr>
                                      </td>
                                      <td>
                                          <tr>{item.openCode}</tr>
                                      </td>
                                      <td>
                                          <tr>{item.title}</tr>
                                      </td>
                                      <td>
                                          <tr>offline docs</tr>
                                      </td>
                                      <td>
                                          <tr>da thi</tr>
                                      </td>
                                  </tr>
                              ))
                            : 'Loadding...'}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};
export default ReceiveExamCode;
