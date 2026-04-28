import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GuardDashboard from './pages/GuardDashboard';
import TripTicketForm from './pages/TripTicketForm';
import PRFForm from './pages/PRFForm';
import RRFForm from './pages/RRFForm';
import History from './pages/History';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ApprovedRecords from './pages/ApprovedRecords';
import ArchivedRecords from './pages/ArchivedRecords';
import PendingRecords from './pages/PendingRecords';
import Vehicles from './pages/Vehicles';
import Layout from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const isAuthenticated = () => !!localStorage.getItem('token');

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" />;
}

function DashboardRoute() {
  const user = getStoredUser();
  if (user?.role === 'Guard') {
    return <Navigate to="/guard-dashboard" replace />;
  }

  return <Layout><Dashboard /></Layout>;
}

function App() {

  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Authenticated Routes wrapped in Layout */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} 
            />
            <Route 
              path="/guard-dashboard" 
              element={<ProtectedRoute><Layout><GuardDashboard /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/trip-ticket" 
              element={<ProtectedRoute><Layout><TripTicketForm /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/prf" 
              element={<ProtectedRoute><Layout><PRFForm /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/rrf" 
              element={<ProtectedRoute><Layout><RRFForm /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/history" 
              element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/users" 
              element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/approved" 
              element={<ProtectedRoute><Layout><ApprovedRecords /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/archived" 
              element={<ProtectedRoute><Layout><ArchivedRecords /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/pending" 
              element={<ProtectedRoute><Layout><PendingRecords /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/vehicles" 
              element={<ProtectedRoute><Layout><Vehicles /></Layout></ProtectedRoute>} 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
