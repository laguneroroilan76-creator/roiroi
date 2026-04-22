import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TripTicketForm from './pages/TripTicketForm';
import PRFForm from './pages/PRFForm';
import History from './pages/History';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import './index.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Authenticated Routes wrapped in Layout */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/trip-ticket" 
          element={isAuthenticated ? <Layout><TripTicketForm /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/prf" 
          element={isAuthenticated ? <Layout><PRFForm /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/history" 
          element={isAuthenticated ? <Layout><History /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/users" 
          element={isAuthenticated ? <Layout><Users /></Layout> : <Navigate to="/" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Layout><Profile /></Layout> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
