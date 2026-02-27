import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusManagement from './pages/BusManagement';
import BusDetails from './pages/BusDetails';
import Fleet from './pages/Fleet';
import RouteManagement from './pages/RouteManagement';
import TransportRequests from './pages/TransportRequests';
import TransportDues from './pages/TransportDues';
import UserManagement from './pages/UserManagement';
import AdminRaiseRequest from './pages/AdminRaiseRequest';
import Concessions from './pages/Concessions';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/buses" element={<BusManagement />} />
          <Route path="/buses/:id" element={<BusDetails />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/routes" element={<RouteManagement />} />
          <Route path="/transport-requests" element={<TransportRequests />} />
          <Route path="/transport-dues" element={<TransportDues />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/raise-request" element={<AdminRaiseRequest />} />
          <Route path="/concessions" element={<Concessions />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
