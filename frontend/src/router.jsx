import { createBrowserRouter } from 'react-router';
import GuestRoute from './components/GuestRoute';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionsPage from './pages/ConnectionsPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/ProfilePage';
import RequestsPage from './pages/RequestsPage';
import SignupPage from './pages/SignupPage';

// Nested routes: Layout wraps everything; GuestRoute / ProtectedRoute act as "gates".
export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <GuestRoute />, // only for logged-OUT users
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
        ],
      },
      {
        element: <ProtectedRoute />, // only for logged-IN users
        children: [
          { path: '/', element: <FeedPage /> },
          { path: '/requests', element: <RequestsPage /> },
          { path: '/connections', element: <ConnectionsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
