const FALLBACK = 'https://www.gravatar.com/avatar/?d=mp';

export default function Avatar({ user, className = 'h-10 w-10' }) {
  return (
    <img
      src={user.photoUrl || FALLBACK}
      alt={`${user.firstName}'s photo`}
      className={`${className} rounded-full bg-slate-200 object-cover`}
      onError={(e) => {
        e.currentTarget.src = FALLBACK; // broken URL -> default picture
      }}
    />
  );
}
