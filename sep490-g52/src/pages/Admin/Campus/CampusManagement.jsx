import {BACKEND_URL} from '../../../constant';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './CampusManagement.scss';
import { ToastContainer, toast } from 'react-toastify';
import { useAuthFetch } from '../../../auth';

const CampusManagement = () => {
    const [data, setData] = useState([]);
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchCampus, setSearchCampus] = useState('');
    const [reloadPage, setReloadPage] = useState(false);
    const authfetch = useAuthFetch();
    useEffect(() => {
        if (searchCampus) {
            searchData(searchCampus);
        } else {
            getData();
        }
        getData();
    }, [reloadPage, searchCampus]);

    const getData = () => {
        authfetch(BACKEND_URL + '/Admin/ManageCampus/GetAllCampuses')
            .then((res) => res.json())
            .then((result) => {
                setData(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleDetail = (campus) => {
        navigate(`/admin/campusmanagement/detailCampus/${campus.campusId}`, { state: { campus } });
    };
    const handleAdd = () => {
        navigate(`/admin/campusmanagement/addCampus`);
    };

    const searchData = () => {
        authfetch(BACKEND_URL + `/Admin/ManageCampus/SearchCampuses?searchString=${searchCampus}`)
            .then((res) => res.json())
            .then((result) => {
                // console.log(result.json());
                setData(result);
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
            <div className="main-container-campus">
                <div className="campus-management-header">
                    <Link className="campus-management-link" to="/admin">
                        Home
                    </Link>
                    {' > '}
                    <span style={{ fontSize: 14 }}> Campus Management</span>{' '}
                </div>
                <div className="body-container-campus">
                    <span style={{ marginRight: 10 }}>Name: </span>
                    <input
                        type="text"
                        placeholder="Enter Campus"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />

                    <button className="btn btn-primary campus-button" onClick={handleSearch}>
                        Search
                    </button>
                    <div>
                        <button className="btn btn-primary campus-button" onClick={handleAdd}>
                            Add New Campus
                        </button>
                    </div>
                </div>

                <table className="campus-table table-grey-campus table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0
                            ? data.map((item, index) => (
                                  <tr>
                                      <td data-title="No">{index + 1}</td>
                                      <td data-title="Campus Name">
                                          <button className="campus-name-button" onClick={() => handleDetail(item)}>
                                              {item.campusName}
                                          </button>
                                      </td>
                                      <td data-title="Address">{item.address}</td>
                                      <td data-title="Contact">{item.contact}</td>
                                  </tr>
                              ))
                            : 'Loadding...'}
                    </tbody>
                </table>
            </div>
        </Fragment>
    );
};

export default CampusManagement;
