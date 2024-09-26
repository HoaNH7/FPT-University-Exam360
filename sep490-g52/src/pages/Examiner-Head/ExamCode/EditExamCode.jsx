import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect, Fragment } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
const EditExamCode = () => {
    const location = useLocation();
    const { campus } = location.state || {};
    const [editCampusId, setEditCampusId] = useState(campus?.campusId || '');
    const [editName, setEditName] = useState(campus?.name || '');
    const [editAddress, setEditAddress] = useState(campus?.address || '');
    const [editContact, setEditContact] = useState(campus?.contact || '');
    const { id } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        axios
            .get(BACKEND_URL + `/Admin/ManageCampus/GetCampusById/${id}`)
            .then((res) => {
                const campusData = res.data;
                setEditCampusId(campusData.campusId);
                setEditName(campusData.name);
                setEditAddress(campusData.address);
                setEditContact(campusData.contact);
            })
            .catch((err) => console.log(err));
    }, [id]);
    const handleUpdate = () => {
        const updatedCampus = {
            campusId: editCampusId,
            name: editName,
            address: editAddress,
            contact: editContact,
        };
        axios
            .put(BACKEND_URL + `/Admin/ManageCampus/UpdateCampus/${id}`, updatedCampus)
            .then(() => {
                navigate('/campusmanagement');
                toast.success('Campus updated successfully');
            })
            .catch((error) => {
                toast.error('Error updating campus');
                console.log(error);
            });
    };
    return (
        <Fragment>
            <ToastContainer />
            <div className="container">
                <div className="edit-user-header my-3">
                    <Link className="home-link text-primary" to="/admin">
                        Home
                    </Link>
                    {' > '}
                    <span className="text-secondary" style={{ fontSize: 14 }}>
                        Edit Exam Code
                    </span>
                    <h1>Edit Exam Code</h1>
                </div>
                <form className="form-edituser">
                    <div className="form-group row">
                        <label htmlFor="Name" className=" col-form-label">
                            Subject:
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
                            Exam Code:
                        </label>
                        <div className="col-sm-5">
                            <input
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
                            Slot:
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
                    </div>{' '}
                    <div className="form-group row">
                        <label htmlFor="Contact" className=" col-form-label">
                            Date:
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
                    </div>{' '}
                    <div className="form-group row">
                        <label htmlFor="Contact" className=" col-form-label">
                            Note:
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
                <Link to="/examcodemanagement">Back to List</Link>
            </div>
        </Fragment>
    );
};
export default EditExamCode;
