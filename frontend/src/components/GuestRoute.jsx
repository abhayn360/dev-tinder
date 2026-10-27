import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '../hooks/useAuth';
import Spinner from './Spinner';

// Wraps login/signup: logged-in users are sent to the app instead.
export default function GuestRoute() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <Spinner />;
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  return <Outlet />;
}
