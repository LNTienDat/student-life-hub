import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Code-splitting (Lazy loading) các trang để giảm dung lượng bundle ban đầu
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const QuenMatKhau = lazy(() => import('./pages/QuenMatKhau'));
const DatLaiMatKhau = lazy(() => import('./pages/DatLaiMatKhau'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MonHoc = lazy(() => import('./pages/MonHoc'));
const Deadline = lazy(() => import('./pages/Deadline'));
const TaiChinh = lazy(() => import('./pages/TaiChinh'));
const ThoiKhoaBieu = lazy(() => import('./pages/ThoiKhoaBieu'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-3 border-ink-200 dark:border-ink-800 border-t-ink-600 dark:border-t-ink-400 rounded-full animate-spin" />
      <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Đang tải trang...</span>
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;