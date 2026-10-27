const variants = {
  primary: 'bg-rose-500 text-white hover:bg-rose-600',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

export default function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
