import { useQuery } from '@tanstack/react-query';
import { Link, NavLink } from 'react-router';
import { getReceivedRequests } from '../api/user';
import { useCurrentUser, useLogout } from '../hooks/useAuth';
import { queryKeys } from '../lib/queryKeys';
import Avatar from './Avatar';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-rose-50 text-rose-600' : 'text-slate-600 hover:bg-slate-100'}`;

export default function Navbar() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  // Shares its cache with the Requests page, so this costs no extra request there.
  const { data: requests } = useQuery({
    queryKey: queryKeys.receivedRequests,
    queryFn: getReceivedRequests,
    enabled: !!user, // only fetch when logged in
  });

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link to="/" className="text-xl font-extrabold text-rose-500">
          &lt;DevTinder/&gt;
        </Link>

        {user && (
          <div className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Feed
            </NavLink>
            <NavLink to="/requests" className={linkClass}>
              Requests
              {requests?.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-xs text-white">
                  {requests.length}
                </span>
              )}
            </NavLink>
            <NavLink to="/connections" className={linkClass}>
              Connections
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <span className="flex items-center gap-2">
                <Avatar user={user} className="h-6 w-6" />
                {user.firstName}
              </span>
            </NavLink>
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
