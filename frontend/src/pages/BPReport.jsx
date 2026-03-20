import { useEffect, useMemo, useState } from 'react';
import {
  fetchCenterCostQueue,
  submitCenterCostBpRow,
  updateCenterCostBpFields,
} from '../services/api';
import { formatCenterCostValue } from '../constants/centerCostColumns';

function getAgingDays(invoiceDate) {
  if (!invoiceDate) return null;
  const parsed = new Date(invoiceDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getAgingClass(days) {
  if (days == null) return 'bg-slate-100 text-slate-600';
  if (days <= 14) return 'bg-sky-100 text-sky-700';
  if (days <= 29) return 'bg-amber-100 text-amber-800';
  return 'bg-rose-100 text-rose-700';
}

function BPReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [confirmRow, setConfirmRow] = useState(null);

  const branches = useMemo(() => {
    const set = new Set();
    rows.forEach((row) => {
      if (row['สาขา']) set.add(row['สาขา']);
    });
    return Array.from(set).sort();
  }, [rows]);

  async function loadData(branch = selectedBranch) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCenterCostQueue({ status: 'completed', sendBp: 'ส่งให้BP' });
      const filtered = branch ? data.filter((row) => row['สาขา'] === branch) : data;
      setRows(filtered);
    } catch (err) {
      setError('Failed to load BP report queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(selectedBranch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  function setRowRemark(id, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, หมายเหตุ: value } : row)),
    );
  }

  function handleSave(row) {
    setConfirmRow(row);
  }

  async function handleConfirmSave() {
    if (!confirmRow) return;
    const row = confirmRow;
    setSavingId(row.id);
    setError(null);
    try {
      await updateCenterCostBpFields(row.id, { หมายเหตุ: row['หมายเหตุ'] || null });
      await submitCenterCostBpRow(row.id, { หมายเหตุ: row['หมายเหตุ'] || null });
      await loadData(selectedBranch);
      setConfirmRow(null);
    } catch (err) {
      setError('Failed to save BP row.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">BPรายงานชำระหนี้</h1>
          <p className="text-sm text-slate-500">
            แสดงเฉพาะรายการที่ ส่งBP = ส่งให้BP และกด Save เพื่อเปลี่ยนเป็น BPส่งกลับ
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex flex-col min-w-[160px]">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">BPรายงานชำระหนี้</h2>
            <p className="text-xs text-slate-500">{loading ? 'Refreshing...' : `${rows.length.toLocaleString()} records`}</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(selectedBranch)}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Refresh
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="border-b border-slate-200">
                {[
                  'Aging',
                  'id',
                  'database_name',
                  'สาขา',
                  'เลขที่ใบกำกับ',
                  'วันที่ใบกำกับ',
                  'ชื่อลูกค้า',
                  'มูลค่ารวมVat',
                  'หมายเหตุ',
                  'action',
                ].map((header) => (
                  <th key={header} className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={10}>
                    No BP rows found.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {(() => {
                      const days = getAgingDays(row['วันที่ใบกำกับ']);
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getAgingClass(days)}`}>
                          {days == null ? '-' : `${days} วัน`}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.database_name || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['สาขา'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['เลขที่ใบกำกับ'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCenterCostValue('date', row['วันที่ใบกำกับ'])}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['ชื่อลูกค้า'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">{formatCenterCostValue('currency', row['มูลค่ารวมVat'])}</td>
                  <td className="px-3 py-2 whitespace-nowrap min-w-[260px]">
                    <input
                      value={row['หมายเหตุ'] || ''}
                      onChange={(e) => setRowRemark(row.id, e.target.value)}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                      placeholder="หมายเหตุ"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleSave(row)}
                      disabled={savingId === row.id}
                      className="px-2 py-1 rounded bg-primary-600 text-white text-[11px] hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingId === row.id ? 'กำลังบันทึก...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={10}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">ยืนยันส่งข้อมูลไป BP</h3>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อยืนยันแล้ว สถานะจะถูกเปลี่ยนเป็น BPส่งกลับ
              </p>
            </div>
            <div className="px-5 py-4 text-sm text-slate-700 space-y-2">
              <div><span className="text-slate-500">Database:</span> {confirmRow.database_name || '-'}</div>
              <div><span className="text-slate-500">สาขา:</span> {confirmRow['สาขา'] || '-'}</div>
              <div><span className="text-slate-500">เลขที่ใบกำกับ:</span> {confirmRow['เลขที่ใบกำกับ'] || '-'}</div>
              <div><span className="text-slate-500">ชื่อลูกค้า:</span> {confirmRow['ชื่อลูกค้า'] || '-'}</div>
              <div><span className="text-slate-500">หมายเหตุ:</span> {confirmRow['หมายเหตุ'] || '-'}</div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRow(null)}
                disabled={savingId === confirmRow.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={savingId === confirmRow.id}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
              >
                {savingId === confirmRow.id ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BPReport;
