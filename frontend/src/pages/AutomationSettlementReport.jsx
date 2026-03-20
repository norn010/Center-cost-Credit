import { useCallback, useEffect, useState } from 'react';
import { fetchProcessingSettlements, fetchSettlementItems } from '../services/api';
import { formatCenterCostValue } from '../constants/centerCostColumns';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

function AutomationSettlementReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalHeader, setModalHeader] = useState(null);
  const [modalItems, setModalItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcessingSettlements();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setError('โหลดรายการ settlement ไม่สำเร็จ');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleView(row) {
    setModalHeader(row);
    setModalOpen(true);
    setModalItems([]);
    setModalError(null);
    setModalLoading(true);
    try {
      const items = await fetchSettlementItems(row.id);
      setModalItems(Array.isArray(items) ? items : []);
    } catch {
      setModalError('โหลดรายการรายละเอียดไม่สำเร็จ');
    } finally {
      setModalLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setModalHeader(null);
    setModalItems([]);
    setModalError(null);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <header className="shrink-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Automation รายงานตัดชำระหนี้ ศูนย์ต้นทุนเงินเชื่อ</h1>
          <p className="text-sm text-slate-500">
            แสดงเฉพาะรายการที่ automate_status = กำลัง automate ในตาราง Settlement
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      )}

      <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">id</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">database_name</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">สาขา</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">รหัสลูกค้า</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">ชื่อลูกค้า</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">เลขที่RS</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 border-b border-slate-200">ยอดรับชำระ(ex)</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 border-b border-slate-200">หัก ณ ที่จ่าย</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 border-b border-slate-200">ค่าธรรมเนียม</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 border-b border-slate-200">ส่วนต่างเดบิต</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-700 border-b border-slate-200">ส่วนต่างเครดิต</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">หมายเหตุ</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">automate_status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">created_at</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 w-24"> </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={15} className="px-3 py-8 text-center text-slate-500">
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-3 py-8 text-center text-slate-500">
                    ไม่มีรายการ
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 border-b border-slate-100">
                    <td className="px-3 py-2 text-slate-800">{row.id}</td>
                    <td className="px-3 py-2 text-slate-800">{row.database_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-800">{row['สาขา'] ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-800">{row['รหัสลูกค้า'] ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-800 max-w-[180px] truncate" title={row['ชื่อลูกค้า']}>
                      {row['ชื่อลูกค้า'] ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-800">{row.rs_no ?? '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCenterCostValue('currency', row.received_amount_ex)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCenterCostValue('currency', row.withholding_tax)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800">{formatCenterCostValue('currency', row.fee)}</td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCenterCostValue('currency', row.diff_debit)}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      {formatCenterCostValue('currency', row.diff_credit)}
                    </td>
                    <td className="px-3 py-2 text-slate-800 max-w-[140px] truncate" title={row.remark}>
                      {row.remark ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-800">{row.automate_status ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleView(row)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold text-primary-700 bg-primary-50 border border-primary-200 hover:bg-primary-100"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-slate-200"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">รายละเอียดตัดชำระ (Settlement Item)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Settlement id: <span className="font-mono font-semibold">{modalHeader?.id}</span>
                  {modalHeader?.rs_no ? (
                    <>
                      {' '}
                      · เลขที่RS: <span className="font-medium">{modalHeader.rs_no}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="shrink-0 px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
              >
                ปิด
              </button>
            </div>
            <div className="px-5 py-4 flex-1 min-h-0 overflow-auto">
              {modalError && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {modalError}
                </div>
              )}
              {modalLoading ? (
                <p className="text-sm text-slate-500 py-6 text-center">กำลังโหลดรายการ…</p>
              ) : (
                <table className="min-w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-slate-200">id</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">settlement_id</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">queue_id</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">เลขที่ใบกำกับ</th>
                      <th className="px-3 py-2 text-right border-b border-slate-200">amount_ex</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">created_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          ไม่มีรายการย่อย
                        </td>
                      </tr>
                    ) : (
                      modalItems.map((it) => (
                        <tr key={it.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                          <td className="px-3 py-2">{it.id}</td>
                          <td className="px-3 py-2">{it.settlement_id}</td>
                          <td className="px-3 py-2">{it.queue_id}</td>
                          <td className="px-3 py-2">{it['เลขที่ใบกำกับ'] ?? '—'}</td>
                          <td className="px-3 py-2 text-right">{formatCenterCostValue('currency', it.amount_ex)}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(it.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutomationSettlementReport;
