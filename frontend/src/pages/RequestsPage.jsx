import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewRequest } from '../api/requests';
import { getReceivedRequests } from '../api/user';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { EmptyState } from './FeedPage';

export default function RequestsPage() {
  const queryClient = useQueryClient();
  const requests = useQuery({ queryKey: queryKeys.receivedRequests, queryFn: getReceivedRequests });

  const review = useMutation({
    mutationFn: ({ status, requestId }) => reviewRequest(status, requestId),
    onSuccess: () =>
      Promise.all([
        // Both lists changed, so mark them stale and refetch.
        queryClient.invalidateQueries({ queryKey: queryKeys.receivedRequests }),
        queryClient.invalidateQueries({ queryKey: queryKeys.connections }),
      ]),
  });

  if (requests.isPending) return <Spinner />;
  if (requests.isError) return <Alert>{getErrorMessage(requests.error)}</Alert>;
  if (requests.data.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        text="When someone likes you, they'll show up here."
      />
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Connection requests</h1>
      <Alert>{review.isError && getErrorMessage(review.error)}</Alert>
      <ul className="space-y-3">
        {requests.data.map(({ _id, fromUserId: user }) => (
          <li
            key={_id}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
          >
            <Avatar user={user} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-sm text-slate-500">{user.about || 'No bio yet'}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={review.isPending}
                onClick={() => review.mutate({ status: 'rejected', requestId: _id })}
              >
                Reject
              </Button>
              <Button
                variant="success"
                disabled={review.isPending}
                onClick={() => review.mutate({ status: 'accepted', requestId: _id })}
              >
                Accept
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
