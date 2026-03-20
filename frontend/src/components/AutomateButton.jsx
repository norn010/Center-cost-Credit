function AutomateButton({ disabled, selectedCount, onClick, loading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? 'Sending...' : 'Send to Automate'}
      {selectedCount > 0 && !loading && (
        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5">
          {selectedCount}
        </span>
      )}
    </button>
  );
}

export default AutomateButton;

