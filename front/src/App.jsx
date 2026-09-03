import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
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
import NotFound from './pages/NotFound';

function AuthenticatedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
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
            <Route element={<AuthenticatedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mon-hoc" element={<MonHoc />} />
              <Route path="/deadline" element={<Deadline />} />
              <Route path="/tai-chinh" element={<TaiChinh />} />
              <Route path="/thoi-khoa-bieu" element={<ThoiKhoaBieu />} />
              <Route path="/ho-so" element={<Profile />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;