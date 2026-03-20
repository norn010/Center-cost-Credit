import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createSettlement,
  fetchSettlementCandidates,
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

function toNumberOrZero(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function AutomateCompleted() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [savingIds, setSavingIds] = useState({});
  const remarkDebounceRef = useRef({});
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [submittingSettlement, setSubmittingSettlement] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    received_amount_ex: '',
    withholding_tax: '',
    fee: '',
    diff_debit: '',
    diff_credit: '',
    remark: '',
  });
  const [allocationByRowId, setAllocationByRowId] = useState({});

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
      const data = await fetchSettlementCandidates({ branch: branch || null });
      setRows(data || []);
    } catch (err) {
      setError('Failed to load completed automation queue.');
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

  useEffect(() => () => {
    Object.values(remarkDebounceRef.current).forEach((timerId) => clearTimeout(timerId));
  }, []);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.includes(row.id)),
    [rows, selectedRowIds],
  );

  const totalAllocated = useMemo(
    () => selectedRows.reduce((sum, row) => sum + toNumberOrZero(allocationByRowId[row.id]), 0),
    [allocationByRowId, selectedRows],
  );

  const receivedAmountEx = toNumberOrZero(settlementForm.received_amount_ex);
  const canSubmitSettlement = selectedRows.length > 0 && receivedAmountEx > 0 && totalAllocated > 0 && totalAllocated <= receivedAmountEx;

  function setRowValue(id, key, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  }

  async function saveBpFields(id, payload) {
    setSavingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await updateCenterCostBpFields(id, payload);
    } catch (err) {
      setError('อัปเดตข้อมูล BP ไม่สำเร็จ');
    } finally {
      setSavingIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  function handleSendBpChange(rowId, value) {
    const sendBP = value || null;
    setRowValue(rowId, 'ส่งBP', sendBP);
    saveBpFields(rowId, { sendBP });
  }

  function handleRemarkChange(rowId, value) {
    setRowValue(rowId, 'หมายเหตุ', value);
    if (remarkDebounceRef.current[rowId]) {
      clearTimeout(remarkDebounceRef.current[rowId]);
    }
    remarkDebounceRef.current[rowId] = setTimeout(() => {
      saveBpFields(rowId, { หมายเหตุ: value });
    }, 500);
  }

  function toggleRowSelection(rowId) {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  }

  function toggleSelectAllVisible(checked) {
    if (checked) {
      setSelectedRowIds(rows.map((row) => row.id));
    } else {
      setSelectedRowIds([]);
    }
  }

  function openSettlementModal() {
    const initialAllocation = {};
    selectedRows.forEach((row) => {
      initialAllocation[row.id] = row.remaining_amount_ex || '';
    });
    setAllocationByRowId(initialAllocation);
    setSettlementForm({
      rs_no: '',
      received_amount_ex: '',
      withholding_tax: '',
      fee: '',
      diff_debit: '',
      diff_credit: '',
      remark: '',
    });
    setIsSettlementModalOpen(true);
  }

  function closeSettlementModal() {
    setIsSettlementModalOpen(false);
  }

  async function handleCreateSettlement() {
    if (!canSubmitSettlement) {
      setError('กรุณาตรวจสอบยอดรับชำระและยอดจัดสรร');
      return;
    }
    const items = selectedRows
      .map((row) => ({
        queue_id: row.id,
        amount_ex: toNumberOrZero(allocationByRowId[row.id]),
      }))
      .filter((item) => item.amount_ex > 0);

    const overAllocated = selectedRows.find(
      (row) => toNumberOrZero(allocationByRowId[row.id]) > toNumberOrZero(row.remaining_amount_ex),
    );
    if (overAllocated) {
      setError(`ยอดจัดสรรเกินยอดคงเหลือของรายการ ${overAllocated.id}`);
      return;
    }

    setSubmittingSettlement(true);
    setError(null);
    try {
      await createSettlement({
        header: {
          rs_no: settlementForm.rs_no || null,
          received_amount_ex: receivedAmountEx,
          withholding_tax: toNumberOrZero(settlementForm.withholding_tax),
          fee: toNumberOrZero(settlementForm.fee),
          diff_debit: toNumberOrZero(settlementForm.diff_debit),
          diff_credit: toNumberOrZero(settlementForm.diff_credit),
          remark: settlementForm.remark || null,
        },
        items,
      });
      setSelectedRowIds([]);
      closeSettlementModal();
      await loadData(selectedBranch);
    } catch (err) {
      setError(err?.response?.data?.error || 'สร้างรายการตัดชำระไม่สำเร็จ');
    } finally {
      setSubmittingSettlement(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ</h1>
          <p className="text-sm text-slate-500">
            แสดงเฉพาะรายการที่ automate_status เป็น เสร็จแล้ว
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
          <button
            type="button"
            onClick={openSettlementModal}
            disabled={selectedRowIds.length === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            สร้างรายการตัดชำระ ({selectedRowIds.length})
          </button>
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
            <h2 className="text-sm font-semibold text-slate-800">รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ</h2>
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
                  'เลือก',
                  'Aging',
                  'id',
                  'database_name',
                  'สาขา',
                  'เลขที่JOB',
                  'เลขที่ใบกำกับ',
                  'วันที่ใบกำกับ',
                  'วันที่JOB',
                  'รหัสลูกค้า',
                  'ชื่อลูกค้า',
                  'รุ่นรถ',
                  'เลขตัวถังรถ',
                  'มูลค่ารวมVat',
                  'ยอดตัดแล้ว',
                  'ยอดคงเหลือ',
                  'ส่งBP',
                  'หมายเหตุ',
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
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={18}>
                    No completed rows found.
                  </td>
                </tr>
              )}
              {!loading && rows.length > 0 && (
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length > 0 && selectedRowIds.length === rows.length}
                      onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                    />
                  </td>
                  <td colSpan={17} className="px-3 py-1.5 text-[11px] text-slate-500">
                    เลือกทั้งหมด
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                    />
                  </td>
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
                  <td className="px-3 py-2 whitespace-nowrap">{row['เลขที่JOB'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['เลขที่ใบกำกับ'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCenterCostValue('date', row['วันที่ใบกำกับ'])}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatCenterCostValue('date', row['วันที่JOB'])}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['รหัสลูกค้า'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['ชื่อลูกค้า'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['รุ่นรถ'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row['เลขตัวถังรถ'] || ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">{formatCenterCostValue('currency', row['มูลค่ารวมVat'])}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">{formatCenterCostValue('currency', row.paid_amount_ex)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">{formatCenterCostValue('currency', row.remaining_amount_ex)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <select
                      className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      value={row['ส่งBP'] || ''}
                      onChange={(e) => handleSendBpChange(row.id, e.target.value)}
                    >
                      <option value="">-</option>
                      <option value="ส่งให้BP">ส่งให้BP</option>
                      <option value="BPส่งกลับ">BPส่งกลับ</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <input
                        value={row['หมายเหตุ'] || ''}
                        onChange={(e) => handleRemarkChange(row.id, e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        placeholder="หมายเหตุ"
                      />
                      {savingIds[row.id] ? <span className="text-[10px] text-slate-500">saving...</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={18}>
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">สร้างรายการตัดชำระ</h3>
              <p className="text-xs text-slate-500 mt-1">ตัดซ้ำได้จนกว่ายอดคงเหลือจะเป็น 0</p>
            </div>
            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <input className="px-3 py-2 border border-slate-300 rounded text-xs col-span-2 md:col-span-1" placeholder="เลขที่RS" value={settlementForm.rs_no} onChange={(e) => setSettlementForm((p) => ({ ...p, rs_no: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="ยอดรับชำระ(ค่า ex)" value={settlementForm.received_amount_ex} onChange={(e) => setSettlementForm((p) => ({ ...p, received_amount_ex: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="หัก ณ ที่จ่าย" value={settlementForm.withholding_tax} onChange={(e) => setSettlementForm((p) => ({ ...p, withholding_tax: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="ค่าธรรมเนียม" value={settlementForm.fee} onChange={(e) => setSettlementForm((p) => ({ ...p, fee: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="ส่วนต่างเดบิต" value={settlementForm.diff_debit} onChange={(e) => setSettlementForm((p) => ({ ...p, diff_debit: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="ส่วนต่างเครดิต" value={settlementForm.diff_credit} onChange={(e) => setSettlementForm((p) => ({ ...p, diff_credit: e.target.value }))} />
                <input className="px-3 py-2 border border-slate-300 rounded text-xs" placeholder="หมายเหตุ" value={settlementForm.remark} onChange={(e) => setSettlementForm((p) => ({ ...p, remark: e.target.value }))} />
              </div>
              <div className="text-xs text-slate-600">
                ยอดรับชำระ: <span className="font-semibold">{formatCenterCostValue('currency', receivedAmountEx)}</span> | ยอดจัดสรร: <span className="font-semibold">{formatCenterCostValue('currency', totalAllocated)}</span> | คงเหลือ: <span className={`font-semibold ${receivedAmountEx - totalAllocated < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCenterCostValue('currency', receivedAmountEx - totalAllocated)}</span>
              </div>
              <table className="min-w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Queue ID</th>
                    <th className="px-3 py-2 text-left">database_name</th>
                    <th className="px-3 py-2 text-left">เลขที่ใบกำกับ</th>
                    <th className="px-3 py-2 text-right">ยอดคงเหลือ</th>
                    <th className="px-3 py-2 text-right">ยอดตัดครั้งนี้</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{row.id}</td>
                      <td className="px-3 py-2">{row.database_name || ''}</td>
                      <td className="px-3 py-2">{row['เลขที่ใบกำกับ'] || ''}</td>
                      <td className="px-3 py-2 text-right">{formatCenterCostValue('currency', row.remaining_amount_ex)}</td>
                      <td className="px-3 py-2 text-right">
                        {(() => {
                          const maxVal = toNumberOrZero(row.remaining_amount_ex);
                          const curVal = toNumberOrZero(allocationByRowId[row.id]);
                          const overLimit = curVal > maxVal;
                          return (
                            <div className="flex flex-col items-end gap-0.5">
                              <input
                                type="number"
                                min={0}
                                max={maxVal}
                                step="0.01"
                                className={`w-36 px-2 py-1 border rounded text-xs text-right ${overLimit ? 'border-rose-400 bg-rose-50 text-rose-700 focus:ring-rose-400' : 'border-slate-300'}`}
                                value={allocationByRowId[row.id] ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const num = Number(raw);
                                  if (raw !== '' && Number.isFinite(num) && num > maxVal) {
                                    setAllocationByRowId((p) => ({ ...p, [row.id]: String(maxVal) }));
                                  } else {
                                    setAllocationByRowId((p) => ({ ...p, [row.id]: raw }));
                                  }
                                }}
                                placeholder="0.00"
                              />
                              {overLimit && (
                                <span className="text-[10px] text-rose-600">เกินยอดคงเหลือ {formatCenterCostValue('currency', maxVal)}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button type="button" onClick={closeSettlementModal} disabled={submittingSettlement} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50">ยกเลิก</button>
              <button type="button" onClick={handleCreateSettlement} disabled={!canSubmitSettlement || submittingSettlement} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50">
                {submittingSettlement ? 'กำลังบันทึก...' : 'ยืนยันสร้างรายการตัดชำระ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomateCompleted;
