import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-extrabold text-rose-500">404</p>
      <p className="mt-2 text-slate-500">This page doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block font-semibold text-rose-500 hover:underline">
        ← Back to the feed
      </Link>
    </div>
  );
}
