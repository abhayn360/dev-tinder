import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '../hooks/useAuth';
import { getErrorMessage } from '../lib/errors';
import Alert from './Alert';
import Spinner from './Spinner';

// Wraps pages that need a logged-in user.
export default function ProtectedRoute() {
  const { data: user, isPending, isError, error } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <Spinner />;
  if (isError) return <Alert>{getErrorMessage(error)}</Alert>;
  if (!user) {
    // Remember where the user wanted to go, so we can send them back after login.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
