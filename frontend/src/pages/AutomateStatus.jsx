import { useEffect, useMemo, useState } from 'react';
import { completeCenterCostQueueItem, fetchCenterCostQueue } from '../services/api';
import QueueTable from '../components/QueueTable';

function AutomateStatus() {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [completingId, setCompletingId] = useState(null);

  const branches = useMemo(() => {
    const set = new Set();
    queueData.forEach((row) => {
      if (row['สาขา']) {
        set.add(row['สาขา']);
      }
    });
    return Array.from(set).sort();
  }, [queueData]);

  async function loadQueue(branch = selectedBranch) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCenterCostQueue({ status: 'processing' });
      const filtered = branch ? data.filter((row) => row['สาขา'] === branch) : data;
      setQueueData(filtered);
    } catch (err) {
      setError('Failed to load automation queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue('');
    const interval = setInterval(() => loadQueue(''), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadQueue(selectedBranch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  async function handleCompleteRow(row) {
    setCompletingId(row.id);
    setError(null);
    try {
      await completeCenterCostQueueItem(row.id);
      await loadQueue(selectedBranch);
    } catch (err) {
      setError('Failed to complete queue row.');
    } finally {
      setCompletingId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Automation Status</h1>
          <p className="text-sm text-slate-500">
            Monitor queue rows with automate status set to กำลัง automate.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col min-w-[180px]">
            <label className="text-xs font-medium text-slate-600 mb-1">สาขา</label>
            <select
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">All</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="shrink-0 bg-rose-50 text-rose-800 border border-rose-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        <QueueTable
          data={queueData}
          loading={loading}
          title="คิวกำลัง automate"
          actionLabel="เสร็จแล้ว"
          actionLoadingId={completingId}
          onAction={handleCompleteRow}
          onRefresh={() => loadQueue(selectedBranch)}
        />
      </div>
    </div>
  );
}

export default AutomateStatus;

