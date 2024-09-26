import {BACKEND_URL} from '../../../constant';
import './userManagerment.scss';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, Fragment, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { useAuthFetch } from '../../../auth';
import * as XLSX from 'xlsx';

const UserManagement = () => {
    const [data, setData] = useState([]);
    const [roles, setRoles] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const navigate = useNavigate();
    const [reloadPage, setReloadPage] = useState(false);
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
        if (searchEmail) {
            searchData(searchEmail);
        } else {
            getData();
        }
        // getRoles();
    }, [reloadPage, searchEmail, pageNumber]);

    const getData = () => {
        authfetch(
            BACKEND_URL + `/api/ManageCampusUser/GetAllCampusUsers?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        )
            .then((res) => res.json())
            .then((result) => {
                const { totalCount, users } = result;

                const updatedData = users.map((item) => ({
                    ...item,
                }));
                console.log(updatedData);
                setData(updatedData);
                setTotalCount(totalCount);
            })
            .catch((error) => {
                console.log('Error fetching data:', error);
            });
    };

    const searchData = (email) => {
        authfetch(BACKEND_URL + `/api/ManageCampusUser/SearchCampusUser?searchString=${searchEmail}`)
            .then((res) => res.json())
            .then((result) => {
                console.log(result);
                setData(result);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    // const getRoles = () => {
    //     authfetch(BACKEND_URL + '/Admin/ManageUser/GetAllRoles')
    //         .then((res) => res.json())
    //         .then((result) => {
    //             setRoles(result);
    //         })
    //         .catch((error) => {
    //             console.log(error);
    //         });
    // };

    const handleDetail = (user) => {
        navigate(`/examinerhead/usermanagement/detailUser/${user.userId}`, { state: { user } });
    };

    const handleSearch = () => {
        setSearchEmail(searchInput);
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
                // const campusName = row[2];
                return {
                    email: email,
                    roles: [{ roleName: roleName }],
                    // campus: { campusName: campusName },
                    isActive: true,
                };
            });

            setData(processedData);
            setDataImport(true);
            setProcessData(processedData);
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleImportUser = () => {
        const postData = data.map((item) => ({
            email: item.email,
            roleName: item.roles[0].roleName,
            // campusName: item.campus.campusName,
        }));

        console.log(postData);

        authfetch(BACKEND_URL + '/api/ManageCampusUser/ImportUserByExcelRoleEH', {
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
            ['Email', 'RoleName'], // Headers
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'Template_Import.xlsx');
    };

    return (
        <Fragment>
            <ToastContainer />
            <div className="main-container-usercampus">
                <div className="usercampus-management-header">
                    <Link className="usercampus-management-link" to="/examinerhead">
                        Home
                    </Link>
                    <span style={{ fontSize: 14 }}> {'>'} User Management</span>
                </div>
                <div className="body-container-usercampus">
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
                            Add new user
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

                <table className="usercampus-table table-striped">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Email</th>
                            <th>Role Name</th>
                            <th>isActive</th>
                            {/* <th>Campus</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0
                            ? data.map((item, index) => (
                                  <tr key={item.userId}>
                                      <td data-title="No">{index + startIndex}</td>
                                      <td data-title="Email">
                                          <button
                                              className="usercampus-name-button"
                                              style={{ border: 0, fontWeight: 'normal', textDecoration: 'none' }}
                                              onClick={() => handleDetail(item)}
                                          >
                                              {item.email}
                                          </button>
                                      </td>
                                      <td data-title="Role Name">
                                          {item.roles && item.roles.length > 0
                                              ? item.roles?.map((role) => <li key={role.roleId}>{role.roleName}</li>)
                                              : 'N/A'}
                                      </td>
                                      <td data-title="Is Active">{item.isActive ? 'Active' : 'inActive'}</td>
                                      {/* <td data-title="Campus Name">{item.campus?.campusName ?? 'N/A'}</td> */}
                                  </tr>
                              ))
                            : 'No Data...'}
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
