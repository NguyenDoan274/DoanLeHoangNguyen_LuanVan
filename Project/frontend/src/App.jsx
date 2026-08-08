import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import InstructorLayout from './components/InstructorLayout';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import InstructorCourseGroups from './pages/InstructorCourseGroups';
import InstructorCourseDetail from './pages/InstructorCourseDetail';
import InstructorLessons from './pages/InstructorLessons';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminCourses from './pages/AdminCourses';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';
import AdminCoupons from './pages/AdminCoupons';
import AdminPromotions from './pages/AdminPromotions';
import AdminOrders from './pages/AdminOrders';
import AdminPayments from './pages/AdminPayments';
import AdminEnrollments from './pages/AdminEnrollments';
import AdminRevenue from './pages/AdminRevenue';
import InstructorEnrollments from './pages/InstructorEnrollments';
import InstructorRevenue from './pages/InstructorRevenue';
import CourseExplorer from './pages/CourseExplorer';
import CourseDetail from './pages/CourseDetail';
import Order from './pages/Order';
import OrderHistory from './pages/OrderHistory';
import Payment from './pages/Payment';
import PaymentCallback from './pages/PaymentCallback';
import MyCourses from './pages/MyCourses';
import LessonWorkspace from './pages/LessonWorkspace';
import RoadmapDetail from './pages/RoadmapDetail';
import RoadmapExplorer from './pages/RoadmapExplorer';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CourseExplorer />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      <Route path="/roadmaps" element={<RoadmapExplorer />} />
      <Route path="/roadmaps/:groupId" element={<RoadmapDetail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/order/:courseId" element={<Order />} />
      <Route path="/order-history" element={<OrderHistory />} />
      <Route path="/payment/:orderId" element={<Payment />} />
      <Route path="/payment-callback" element={<PaymentCallback />} />
      <Route path="/my-courses" element={<MyCourses />} />
      <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonWorkspace />} />
      
      {/* Instructor Portal */}
      <Route element={<InstructorLayout />}>
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/instructor/courses" element={<InstructorCourses />} />
        <Route path="/instructor/courses/:courseId" element={<InstructorCourseDetail />} />
        <Route path="/instructor/courses/:courseId/sections/:sectionId/lessons" element={<InstructorLessons />} />
        <Route path="/instructor/course-groups" element={<InstructorCourseGroups />} />
        <Route path="/instructor/students" element={<InstructorEnrollments />} />
        <Route path="/instructor/revenue" element={<InstructorRevenue />} />
        <Route path="/instructor/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Portal */}
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourses />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/coupons" element={<AdminCoupons />} />
        <Route path="/admin/promotions" element={<AdminPromotions />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/enrollments" element={<AdminEnrollments />} />
        <Route path="/admin/revenue" element={<AdminRevenue />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
