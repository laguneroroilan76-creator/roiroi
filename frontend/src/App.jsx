import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import GuardDashboard from './pages/GuardDashboard/GuardDashboard';
import TripTicketForm from './modules/TripTicket/TripTicketForm';
import PRFForm from './modules/PRF/PRFForm';
import RFPForm from './modules/RFP/RFPForm';
import History from './pages/History/History';
import Users from './pages/Users/Users';
import Profile from './pages/Profile/Profile';
import ApprovedRecords from './pages/ApprovedRecords/ApprovedRecords';
import ArchivedRecords from './pages/ArchivedRecords/ArchivedRecords';
import PendingRecords from './pages/PendingRecords/PendingRecords';
import OngoingRecords from './pages/OngoingRecords/OngoingRecords';
import TodayRecords from './pages/TodayRecords/TodayRecords';
import Vehicles from './pages/Vehicles/Vehicles';
import DriverSchedule from './pages/DriverSchedule/DriverSchedule';
import ActiveDrivers from './pages/ActiveDrivers/ActiveDrivers';
import SupportLog from './pages/SupportLog/SupportLog';
import CompanyManagement from './pages/CompanyManagement/CompanyManagement';
import Layout from './components/layout/Layout';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const isAuthenticated = () => !!localStorage.getItem('user');

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
              path="/rfp" 
              element={<ProtectedRoute><Layout><RFPForm /></Layout></ProtectedRoute>} 
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
              path="/ongoing" 
              element={<ProtectedRoute><Layout><OngoingRecords /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/today" 
              element={<ProtectedRoute><Layout><TodayRecords /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/vehicles" 
              element={<ProtectedRoute><Layout><Vehicles /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/driver-schedule" 
              element={<ProtectedRoute><Layout><DriverSchedule /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/active-drivers" 
              element={<ProtectedRoute><Layout><ActiveDrivers /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/support" 
              element={<ProtectedRoute><Layout><SupportLog /></Layout></ProtectedRoute>} 
            />
            <Route 
              path="/companies" 
              element={<ProtectedRoute><Layout><CompanyManagement /></Layout></ProtectedRoute>} 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
