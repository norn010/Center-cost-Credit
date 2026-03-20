import { useEffect, useState } from 'react';
import { fetchCenterCost, fetchDatabases, sendToAutomate } from '../services/api';
import Filters from '../components/Filters';
import SalesTable from '../components/SalesTable';
import AutomateButton from '../components/AutomateButton';

function Dashboard() {
  const [filters, setFilters] = useState({
    branch: null,
    startDate: null,
    endDate: null,
    search: null,
  });
  const [salesData, setSalesData] = useState([]);
  const [databaseOptions, setDatabaseOptions] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingAutomate, setLoadingAutomate] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 100,
    total: 0,
  });

  async function loadData(nextPage = pagination.page, nextPageSize = pagination.pageSize) {
    setLoadingSales(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetchCenterCost({
        database: selectedDatabase || undefined,
        branch: filters.branch || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
        page: nextPage,
        pageSize: nextPageSize,
      });
      setSalesData(response.data || []);
      setPagination({
        page: response.page || nextPage,
        pageSize: response.pageSize || nextPageSize,
        total: response.total || 0,
      });
      setBranchOptions((prev) => {
        const merged = new Set(prev);
        (response.data || []).forEach((row) => {
          if (row['สาขา']) merged.add(row['สาขา']);
        });
        return Array.from(merged).sort();
      });
      setSelectedRows([]);
    } catch (err) {
      setError('Failed to load center cost data.');
    } finally {
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    async function loadDatabases() {
      try {
        const dbs = await fetchDatabases();
        setDatabaseOptions(dbs || []);
      } catch (err) {
        setError('Failed to load databases.');
      }
    }

    loadDatabases();
    loadData(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    await loadData(1, pagination.pageSize);
  }

  async function handleSendToAutomate() {
    if (selectedRows.length === 0) return;
    setLoadingAutomate(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await sendToAutomate(selectedRows);
      setSuccessMessage(`Queued ${result.inserted} records for automation.`);
      setSelectedRows([]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
      setError(detail ? `Failed to send records to automation queue. ${detail}` : 'Failed to send records to automation queue.');
    } finally {
      setLoadingAutomate(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Filter and review center cost credit records, then send selected rows to the automation
            queue.
          </p>
        </div>
      </header>

      {error && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      <Filters
        filters={filters}
        onFiltersChange={setFilters}
        databaseOptions={databaseOptions}
        selectedDatabase={selectedDatabase}
        onDatabaseChange={setSelectedDatabase}
        branchOptions={branchOptions}
        onSearch={handleSearch}
        loading={loadingSales}
      />

      <div className="flex flex-col flex-1 min-h-0 gap-3">
        <div className="shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {selectedRows.length > 0
              ? `${selectedRows.length.toLocaleString()} row(s) selected`
              : 'No rows selected'}
          </div>
          <AutomateButton
            disabled={selectedRows.length === 0}
            selectedCount={selectedRows.length}
            onClick={handleSendToAutomate}
            loading={loadingAutomate}
          />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <SalesTable
            data={salesData}
            onSelectionChange={setSelectedRows}
            loading={loadingSales}
            pagination={pagination}
            onPageChange={(nextPage) => {
              if (nextPage < 1) return;
              loadData(nextPage, pagination.pageSize);
            }}
            onPageSizeChange={(nextPageSize) => {
              loadData(1, nextPageSize);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

