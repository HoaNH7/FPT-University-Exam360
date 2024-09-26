import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CampusManagement.scss';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthFetch } from '../../../auth';

const EditCampusPage = () => {
    const location = useLocation();
    const { campus } = location.state || {};
    console.log(campus);

    const [editCampusId, setEditCampusId] = useState(campus?.campusId || '');
    const [editName, setEditName] = useState(campus?.campusName || '');
    const [editAddress, setEditAddress] = useState(campus?.address || '');
    const [editContact, setEditContact] = useState(campus?.contact || '');

    const { id } = useParams();
    const navigate = useNavigate();
    const authfetch = useAuthFetch();

    useEffect(() => {
        authfetch(BACKEND_URL + `/Admin/ManageCampus/GetCampusById/${id}`)
            .then((res) => {
                const campusData = res.data;
                setEditCampusId(campusData.campusId);
                setEditName(campusData.name);
                setEditAddress(campusData.address);
                setEditContact(campusData.contact);
            })
            .catch((err) => console.log(err));
    }, [id]);

    const handleUpdate = async () => {
        const updatedCampus = {
            campusId: editCampusId,
            name: editName,
            address: editAddress,
            contact: editContact,
        };
        try {
            const response = await authfetch(BACKEND_URL + `/Admin/ManageCampus/UpdateCampus/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedCampus),
            });
            if (!response.ok) {
                toast.error('Error updating campus');
                console.log('response is not ok');
            }
            toast.success('Campus is updated successfully');
            setTimeout(() => {
                navigate('/admin/campusmanagement');
            }, 4000);
        } catch (error) {
            toast.error('Error updating campus');
            console.log('error from try catch');
        }
        // .then(() => {
        //     navigate('/admin/campusmanagement');
        //     toast.success('Campus updated successfully');
        // })
        // .catch((error) => {
        //     toast.error('Error updating campus');
        //     console.log(error);
        // });
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="container">
                <div className="edit-campus-header my-3">
                    <h1>Edit Campus</h1>
                </div>
                <form className="form-editcampus">
                    <div className="form-group row">
                        <label htmlFor="Name" className=" col-form-label">
                            Name:
                        </label>
                        <div className="col-sm-5">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label htmlFor="Address" className=" col-form-label">
                            Address:
                        </label>
                        <div className="col-sm-5">
                            <textarea
                                rows={4}
                                type="text"
                                className="form-control"
                                placeholder="Enter Address"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <label htmlFor="Contact" className=" col-form-label">
                            Contact:
                        </label>
                        <div className="col-sm-5">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Contact"
                                value={editContact}
                                onChange={(e) => setEditContact(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="form-group row">
                        <div className="col-sm-5">
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '22px' }}
                                onClick={handleUpdate}
                                type="button"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
                <Link to="/admin/campusmanagement">Back to List</Link>
            </div>
        </Fragment>
    );
};

export default EditCampusPage;
