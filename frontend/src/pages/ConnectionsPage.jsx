import { useQuery } from '@tanstack/react-query';
import { getConnections } from '../api/user';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { EmptyState } from './FeedPage';

export default function ConnectionsPage() {
  const connections = useQuery({ queryKey: queryKeys.connections, queryFn: getConnections });

  if (connections.isPending) return <Spinner />;
  if (connections.isError) return <Alert>{getErrorMessage(connections.error)}</Alert>;
  if (connections.data.length === 0) {
    return (
      <EmptyState title="No connections yet" text="Head to the feed and show some interest!" />
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Your connections ({connections.data.length})</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {connections.data.map((user) => (
          <li key={user._id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <Avatar user={user} className="h-12 w-12" />
              <div>
                <p className="font-semibold">
                  {user.firstName} {user.lastName}
                </p>
                {user.age && <p className="text-xs text-slate-500">{user.age} years</p>}
              </div>
            </div>
            {user.about && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{user.about}</p>}
            {user.skills?.length > 0 && (
              <p className="mt-2 text-xs text-rose-500">{user.skills.join(' · ')}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
