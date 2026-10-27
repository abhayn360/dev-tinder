const FALLBACK = 'https://www.gravatar.com/avatar/?d=mp&s=400';

// Big profile card used in the feed and the profile preview.
// `children` = action buttons shown at the bottom.
export default function UserCard({ user, children }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const meta = [user.age, user.gender].filter(Boolean).join(', ');

  return (
    <article className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
      <img
        src={user.photoUrl || FALLBACK}
        alt={`${user.firstName}'s photo`}
        className="h-72 w-full bg-slate-200 object-cover"
        onError={(e) => {
          e.currentTarget.src = FALLBACK;
        }}
      />
      <div className="space-y-3 p-5">
        <div>
          <h2 className="text-xl font-bold">{fullName}</h2>
          {meta && <p className="text-sm text-slate-500 capitalize">{meta}</p>}
        </div>
        {user.about && <p className="text-sm text-slate-600">{user.about}</p>}
        {user.skills?.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Skills">
            {user.skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600"
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
        {children && <div className="flex gap-3 pt-2">{children}</div>}
      </div>
    </article>
  );
}
