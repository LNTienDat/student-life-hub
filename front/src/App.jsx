import { t as tr } from './i18n/language';
import useLanguage from './hooks/useLanguage';
import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import { FinanceCategoryProvider } from './context/FinanceCategoryContext';
import { SemesterProvider } from './context/SemesterContext';
import { TimetableImportProvider } from './context/TimetableImportContext';
import ErrorBoundary from './components/ErrorBoundary';
import PwaStatus from './components/PwaStatus';
import BackendStatus from './components/BackendStatus';

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
const TaiLieu = lazy(() => import('./pages/TaiLieu'));
const Profile = lazy(() => import('./pages/Profile'));


const ChiaSeTKB = lazy(() => import('./pages/ChiaSeTKB'));
const RandomPicker = lazy(() => import('./pages/RandomPicker'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  useLanguage();
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-3 border-ink-200 dark:border-ink-800 border-t-ink-600 dark:border-t-ink-400 rounded-full animate-spin" />
      <span className="text-xs font-medium text-ink-500 dark:text-ink-400">{tr("Đang tải trang...")}</span>
    </div>
  );
}

function SessionToastProvider({ children }) {
  useLanguage();
  const { user } = useAuth();
  return <ToastProvider key={user?.id || 'guest'}>{children}</ToastProvider>;
}

function AuthenticatedLayout() {
  useLanguage();
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return (
    <SemesterProvider key={user.id}><FinanceCategoryProvider><TimetableImportProvider><Layout key={user.id}>
      <Outlet />
    </Layout></TimetableImportProvider></FinanceCategoryProvider></SemesterProvider>
  );
}

function LegacyTimetableRedirect() {
  useLanguage();
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: '/lich-hoc', search, hash }} replace />;
}

function App() {
  useLanguage();
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <SessionToastProvider>
                <PwaStatus />
                <BackendStatus />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
                    <Route path="/dat-lai-mat-khau" element={<DatLaiMatKhau />} />
                    <Route path="/chia-se-tkb/:token" element={<ChiaSeTKB />} />
                    <Route path="/chon-ngau-nhien" element={<RandomPicker />} />

                    {/* Authenticated routes */}
                    <Route element={<AuthenticatedLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/mon-hoc" element={<MonHoc />} />
                      <Route path="/deadline" element={<Deadline />} />
                      <Route path="/tai-chinh" element={<TaiChinh />} />
                      <Route path="/lich-hoc" element={<ThoiKhoaBieu />} />
                      <Route path="/thoi-khoa-bieu" element={<LegacyTimetableRedirect />} />


                      <Route path="/tai-lieu" element={<TaiLieu />} />
                      <Route path="/ho-so" element={<Profile />} />
                    </Route>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </SessionToastProvider>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
