import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes } from './routes';
import DefaultComponent from './components/DefaultComponent/DefaultComponent';
import { UserProvider } from './components/Context/UserContext';
import { PrivateRoute } from './auth';

function App() {
    return (
        <div>
            <UserProvider>
                <Router>
                    <Routes>
                        {routes.map((route) => {
                            const Page = route.page;
                            const Layout = route.isShowHeader ? DefaultComponent : Fragment;
                            return (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={
                                        <PrivateRoute allowedRoles={route.roles}>
                                            <Layout>
                                                <Page />
                                            </Layout>
                                        </PrivateRoute>
                                    }
                                ></Route>
                            );
                        })}
                    </Routes>
                </Router>
            </UserProvider>
        </div>
    );
}

export default App;
