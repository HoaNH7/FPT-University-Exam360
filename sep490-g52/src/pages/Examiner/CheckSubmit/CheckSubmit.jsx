import {BACKEND_URL} from '../../../constant';
import './CheckSubmit.scss';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import Form from 'react-bootstrap/Form';
const CheckSubmit = () => {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchCampus, setSearchCampus] = useState('');
    const [reloadPage, setReloadPage] = useState(false);
    useEffect(() => {
        if (searchCampus) {
            searchData(searchCampus);
        } else {
            getData();
        }
        getData();
    }, [reloadPage, searchCampus]);
    const getData = () => {
        axios
            .get(BACKEND_URL + '/Admin/ManageCampus/GetAllCampuses')
            .then((result) => {
                setData(result.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };
    const handleDetail = (campus) => {
        navigate(`/detailCampus/${campus.campusId}`, { state: { campus } });
    };
    const searchData = (campus) => {
        axios
            .get(BACKEND_URL + `/Admin/ManageCampus/SearchCampuses?searchString=${searchCampus}`)
            .then((result) => {
                console.log(result.data);
                setData(result.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };
    const handleSearch = () => {
        setSearchCampus(searchInput);
        // setReloadPage(!reloadPage);
    };
    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-checksubmit">
                <div className="checksubmit-management-header">
                    <Link className="handrequest-management-link" to="/proctor">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Check Submit</span>{' '}
                </div>
                <div className="body-container-checksubmit">
                    <span style={{ marginRight: 10 }}>Search: </span>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                    <div>
                        {/* <label>Filter:</label> */}
                        <Form.Select className=" filter-checksubmit" style={{ padding: 8, fontSize: 14 }}>
                            <option className="filter-checksubmit">All</option>
                            <option value="1">Submitted</option>
                            <option value="2">Not Submit</option>
                        </Form.Select>
                    </div>
                </div>
                <table className="checksubmit-table table-grey-checksubmit table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            {/* <th>IMAGE</th> */}
                            <th>Room No</th>
                            <th>Roll No.</th>
                            <th>Full Name</th>
                            <th>ID Card</th>
                            <th>Class</th>
                            <th>Subject</th>
                            <th>Proctor Name</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-title="No">1</td>
                            {/* <td data-title="Image"></td> */}
                            <td data-title="Room No">AL-101</td>
                            <td data-title="Roll No">HE164018</td>
                            <td data-title="Full Name">Nguyen Dinh Cuong</td>
                            <td data-title="ID Card">12443</td>
                            <td data-title="Class">SE1630</td>
                            <td data-title="Subject">TRANS6</td>
                            <td data-title="Proctor Name">KHUONGPT</td>
                            <td data-title="Status" className="text-center">
                                <Form>
                                    {['radio'].map((type) => (
                                        <div key={`inline-${type}`} className="mb-3">
                                            <Form.Check
                                                inline
                                                label="Submitted"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-1`}
                                            />
                                            <Form.Check
                                                inline
                                                label="Not Submit"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-2`}
                                            />
                                        </div>
                                    ))}
                                </Form>
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            {/* <td></td> */}
                            <td>AL-102</td>
                            <td>HE153566</td>
                            <td>Nguyen Tuan Viet</td>
                            <td>0376201567</td>
                            <td>SE1630</td>
                            <td>TRANS6</td>
                            <td>TUANVM</td>
                            <td className="text-center">
                                <Form>
                                    {['radio'].map((type) => (
                                        <div key={`inline-${type}`} className="mb-3">
                                            <Form.Check
                                                inline
                                                label="Submitted"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-1`}
                                            />
                                            <Form.Check
                                                inline
                                                label="Not Submit"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-2`}
                                            />
                                        </div>
                                    ))}
                                </Form>
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            {/* <td></td> */}
                            <td>AL-103</td>
                            <td>HE153566</td>
                            <td>Hoang Tien Thanh</td>
                            <td>0376201567</td>
                            <td>SE1630</td>
                            <td>TRANS6</td>
                            <td>TAMNT</td>
                            <td className="text-center">
                                <Form>
                                    {['radio'].map((type) => (
                                        <div key={`inline-${type}`} className="mb-3">
                                            <Form.Check
                                                inline
                                                label="Submitted"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-1`}
                                            />
                                            <Form.Check
                                                inline
                                                label="Not Submit"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-2`}
                                            />
                                        </div>
                                    ))}
                                </Form>
                            </td>
                        </tr>
                        <tr>
                            <td>4</td>
                            {/* <td></td> */}
                            <td>AL-105</td>
                            <td>HE153566</td>
                            <td>Nguyen Huu Hoa</td>
                            <td>0376201567</td>
                            <td>SE1630</td>
                            <td>TRANS6</td>
                            <td>SONNT</td>
                            <td className="text-center">
                                <Form>
                                    {['radio'].map((type) => (
                                        <div key={`inline-${type}`} className="mb-3">
                                            <Form.Check
                                                inline
                                                label="Submitted"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-1`}
                                            />
                                            <Form.Check
                                                inline
                                                label="Not Submit"
                                                name="group1"
                                                type={type}
                                                id={`inline-${type}-2`}
                                            />
                                        </div>
                                    ))}
                                </Form>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="body-container">
                <button className="btn btn-primary">Submit</button>
                <button className="btn btn-primary">Edit</button>
            </div>
        </Fragment>
    );
};
export default CheckSubmit;
