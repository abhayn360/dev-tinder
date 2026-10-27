import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendRequest } from '../api/requests';
import { getFeed } from '../api/user';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import UserCard from '../components/UserCard';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';

export default function FeedPage() {
  const queryClient = useQueryClient();

  // useQuery = READ data. It handles loading, error, caching and refetching.
  const feed = useQuery({ queryKey: queryKeys.feed, queryFn: () => getFeed({ limit: 10 }) });

  // useMutation = WRITE data.
  const swipe = useMutation({
    mutationFn: ({ status, userId }) => sendRequest(status, userId),
    // Returning the promise keeps the buttons disabled until the new feed has loaded.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.feed }),
  });

  if (feed.isPending) return <Spinner label="Finding developers..." />;
  if (feed.isError) return <Alert>{getErrorMessage(feed.error)}</Alert>;

  const [current] = feed.data.users;
  const { total } = feed.data.pagination;

  if (!current) {
    return (
      <EmptyState title="You've seen everyone! 🎉" text="Check back later for new developers." />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-slate-500">
        {total} developer{total === 1 ? '' : 's'} to discover
      </p>
      <Alert>{swipe.isError && getErrorMessage(swipe.error)}</Alert>
      <UserCard user={current}>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={swipe.isPending}
          onClick={() => swipe.mutate({ status: 'ignored', userId: current._id })}
        >
          ✕ Ignore
        </Button>
        <Button
          className="flex-1"
          disabled={swipe.isPending}
          onClick={() => swipe.mutate({ status: 'interested', userId: current._id })}
        >
          ♥ Interested
        </Button>
      </UserCard>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
