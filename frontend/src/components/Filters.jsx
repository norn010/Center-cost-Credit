function Filters({
  filters,
  onFiltersChange,
  databaseOptions = [],
  selectedDatabase = '',
  onDatabaseChange,
  branchOptions = [],
  onSearch,
  loading,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">แบรนด์ (Database)</label>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={selectedDatabase}
            onChange={(e) => onDatabaseChange?.(e.target.value)}
          >
            <option value="">ทุกแบรนด์</option>
            {databaseOptions.map((db) => (
              <option key={db.id} value={db.id}>
                {db.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">สาขา</label>
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.branch || ''}
            onChange={(e) => onFiltersChange({ ...filters, branch: e.target.value || null })}
          >
            <option value="">ทุกสาขา</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600 mb-1">วันที่ใบกำกับ (เริ่มต้น)</label>
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.startDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-600 mb-1">วันที่ใบกำกับ (สิ้นสุด)</label>
          <input
            type="date"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.endDate || ''}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value || null })}
          />
        </div>

        <div className="flex flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-600 mb-1">ค้นหา</label>
          <input
            type="text"
            placeholder="เลขที่ JOB, ใบกำกับ, ลูกค้า, ทะเบียน"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || null })}
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Loading...' : 'ค้นหา'}
        </button>
      </div>
    </div>
  );
}

export default Filters;

