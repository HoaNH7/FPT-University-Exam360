import {BACKEND_URL} from '../../../constant';
import React, { useState, useEffect, Fragment, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthFetch } from '../../../auth';
import * as XLSX from 'xlsx';
import moment from 'moment';
import Form from 'react-bootstrap/Form';

const UserManagement = () => {
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const authfetch = useAuthFetch();
    const [processData, setProcessData] = useState([]);
    const fileInputRef = useRef(null);
    const [showModal, setShowModal] = useState(false);
    const [dataImport, setDataImport] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (pageNumber - 1) * pageSize + 1;

    useEffect(() => {
        getData();
        getRoles();
    }, [pageNumber]);

    const getData = () => {
        setLoading(true);
        authfetch(BACKEND_URL + `/Admin/ManageUser/GetAllUsers?pageNumber=${pageNumber}&pageSize=${pageSize}`)
            .then((res) => res.json())
            .then((data) => {
                const { totalCount, users } = data;

                const updatedData = users.map((item) => ({
                    ...item,
                }));
                setData(updatedData);
                setLoading(false);
                setTotalCount(totalCount);
            })
            .catch((error) => {
                console.error('Error fetching users:', error);
                setLoading(false);
                toast.error('Failed to fetch users');
            });
    };

    const getRoles = () => {
        authfetch(BACKEND_URL + '/Admin/ManageUser/GetAllRoles')
            .then((res) => res.json())
            .then((data) => setRoles(data))
            .catch((error) => {
                console.error('Error fetching roles:', error);
                toast.error('Failed to fetch roles');
            });
    };

    const handleDetail = (user) => {
        navigate(`/admin/usermanagement/detailUser/${user.userId}`, { state: { user } });
    };

    const handleSearch = () => {
        authfetch(BACKEND_URL + `/Admin/ManageUser/SearchUsers?searchString=${searchInput}`)
            .then((res) => res.json())
            .then((data) => setData(data))
            .catch((error) => {
                console.error('Error searching users:', error);
                toast.error('Failed to search users');
            });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.warn('No file selected');
            return;
        }
        const reader = new FileReader();

        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

            const processedData = worksheet.slice(1).map((row) => {
                const email = row[0];
                const roleName = row[1];
                const campusName = row[2];
                return {
                    email: email,
                    roles: [{ roleName: roleName }],
                    campus: { campusName: campusName },
                    isActive: true,
                };
            });

            setData(processedData);
            setProcessData(processedData);
            setDataImport(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImportUser = () => {
        // Logic to assign proctor using the form inputs
        const postData = data.map((item) => ({
            email: item.email,
            roleName: item.roles[0].roleName,
            campusName: item.campus.campusName,
        }));

        console.log(postData);

        authfetch(BACKEND_URL + '/Admin/ManageUser/ImportUserByExcel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to submit data');
                }
                setData([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = null;
                }
                toast.success('Import successfully');
                getData();
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to submit data!');
            });
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            ['Email', 'RoleName', 'CampusName'], // Headers
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'Template_Import.xlsx');
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-userexaminerhead">
                <div className="userexaminerhead-management-header">
                    <Link className="userexaminerhead-management-link" to="/admin">
                        Home
                    </Link>
                    <span style={{ fontSize: 14 }}> {'>'} User Management</span>
                </div>
                <div className="body-container-userexaminerhead">
                    <span style={{ marginRight: 10 }}>User: </span>
                    <input
                        type="text"
                        placeholder="Enter email"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={handleSearch}>
                        Search
                    </button>
                    {/* <div>
                        <button className="btn btn-primary" onClick={handleAdd}>
                            Add New User
                        </button>
                    </div> */}
                    <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
                        Import
                    </button>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                    <button className="btn btn-warning" onClick={handleDownloadTemplate}>
                        Download Template
                    </button>
                </div>
                <table className="userexaminerhead-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Email</th>
                            <th>Role Name</th>
                            <th>Campus</th>
                            <th>isActive</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>
                                    No Data...
                                </td>
                            </tr>
                        ) : data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td data-title="No">{index + startIndex}</td>
                                    <td data-title="Email">
                                        <button className="button-examinerhead" onClick={() => handleDetail(item)}>
                                            {item.email}
                                        </button>
                                    </td>
                                    <td data-title="Role Name">
                                        {item.roles && item.roles.length > 0 ? (
                                            <ul>
                                                {item.roles.map((role) => (
                                                    <li key={role.roleId}>{role.roleName}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'N/A'
                                        )}
                                    </td>
                                    <td data-title="Campus Name">{item.campus?.campusName ?? 'N/A'}</td>
                                    <td data-title="Is Active">{item.isActive ? 'Active' : 'Inactive'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center' }}>
                                    No users found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <div style={{ marginTop: 20 }}>
                    <ul className="pagination">
                        <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPageNumber(pageNumber - 1)}>
                                Previous
                            </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <li key={index} className={`page-item ${pageNumber === index + 1 ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => setPageNumber(index + 1)}>
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${pageNumber === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPageNumber(pageNumber + 1)}>
                                Next
                            </button>
                        </li>
                    </ul>
                </div>
                <div>
                    {dataImport && (
                        <button className="btn btn-primary" onClick={handleImportUser} type="button">
                            Save
                        </button>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

export default UserManagement;
