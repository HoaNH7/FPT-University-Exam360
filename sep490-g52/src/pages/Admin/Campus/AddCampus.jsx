import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../UserManagement/userManagerment.scss';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const AddCampusPage = () => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [contact, setContact] = useState('');
    const authfetch = useAuthFetch();

    const [data, setData] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getData();
        getCampuses();
    }, []);

    const getData = () => {
        // axios
        //     .get(BACKEND_URL + '/Admin/ManageUser/GetAllUsers')
        //     .then((result) => {
        //         setData(result.data);
        //     })
        //     .catch((error) => {
        //         console.log(error);
        //     });
        authfetch(BACKEND_URL + '/Admin/ManageUser/GetAllUsers')
            .then((res) => res.json())
            .then((data) => setData(data));
    };

    const getCampuses = () => {
        authfetch(BACKEND_URL + '/Admin/ManageCampus/GetAllCampuses')
            .then((res) => res.json())
            .then((result) => {
                setCampuses(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const handleSave = async (event) => {
        try {
            event.preventDefault();
            if (!name || !address || !contact) {
                toast.error('All fields are required');
                return;
            }
            const url = BACKEND_URL + '/Admin/ManageCampus/AddCampus';
            const data = {
                name: name,
                address: address,
                contact: contact,
            };
            console.log('this is data:', data);
            const response = await authfetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                console.log('response is not ok');
                toast.error('campus is not added');
            }
            toast.success('campus is added');
            setTimeout(() => {
                navigate('/admin/campusmanagement');
            }, 4000);
        } catch (error) {
            toast.error('campus is not added');
        }
    };

    return (
        <div className="container">
            <ToastContainer />
            <div className="add-campus-header my-3">
                <h1>Add Campus</h1>
            </div>
            <form className="form-addcampus" onSubmit={handleSave}>
                <div className="form-group-campus row">
                    <label htmlFor="name" className=" col-form-label">
                        Campus:
                    </label>
                    <div className="col-sm-5">
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            placeholder="Enter Campus"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group-campus row">
                    <label htmlFor="address" className="col-form-label">
                        Address:
                    </label>
                    <div className="col-sm-5">
                        <textarea
                            rows={4}
                            type="text"
                            className="form-control"
                            id="address"
                            placeholder="Enter Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group-campus row">
                    <label htmlFor="contact" className=" col-form-label">
                        Contact:
                    </label>
                    <div className="col-sm-5">
                        <input
                            type="text"
                            className="form-control"
                            id="contact"
                            placeholder="Enter Contact"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group-campus row">
                    <div className="col-sm-5 ">
                        <button style={{ marginTop: '22px' }} className="btn btn-primary" type="submit">
                            Create
                        </button>
                    </div>
                </div>
            </form>
            <Link to="/admin/campusmanagement">Back to List</Link>
        </div>
    );
};

export default AddCampusPage;
