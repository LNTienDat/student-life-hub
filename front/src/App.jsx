import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import QuenMatKhau from './pages/QuenMatKhau';
import DatLaiMatKhau from './pages/DatLaiMatKhau';
import Dashboard from './pages/Dashboard';
import MonHoc from './pages/MonHoc';
import Deadline from './pages/Deadline';
import TaiChinh from './pages/TaiChinh';
import ThoiKhoaBieu from './pages/ThoiKhoaBieu';
import Profile from './pages/Profile';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
            <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/mon-hoc" element={<RequireAuth><MonHoc /></RequireAuth>} />
            <Route path="/deadline" element={<RequireAuth><Deadline /></RequireAuth>} />
            <Route path="/tai-chinh" element={<RequireAuth><TaiChinh /></RequireAuth>} />
            <Route path="/thoi-khoa-bieu" element={<RequireAuth><ThoiKhoaBieu /></RequireAuth>} />
            <Route path="/ho-so" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;