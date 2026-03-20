import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { formatCenterCostValue, isNumericField } from '../constants/centerCostColumns';

function statusColor(status) {
  if (status === 'เสร็จแล้ว') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function QueueTable({ data, loading, onRefresh, title, actionLabel, onAction, actionLoadingId }) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30,
  });

  const QUEUE_DISPLAY_FIELDS = [
    { key: 'database_name', type: 'text', header: 'Database' },
    { key: 'สาขา', type: 'text' },
    { key: 'เลขที่JOB', type: 'text' },
    { key: 'เลขที่ใบกำกับ', type: 'text' },
    { key: 'วันที่ใบกำกับ', type: 'date' },
    { key: 'วันที่JOB', type: 'date' },
    { key: 'รหัสลูกค้า', type: 'text' },
    { key: 'ชื่อลูกค้า', type: 'text' },
    { key: 'รุ่นรถ', type: 'text' },
    { key: 'เลขตัวถังรถ', type: 'text' },
    { key: 'มูลค่ารวมVat', type: 'currency' },
  ];

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'Queue ID', size: 80, meta: { isNumeric: true } },
      ...QUEUE_DISPLAY_FIELDS.map((field) => ({
        accessorKey: field.key,
        header: field.header || field.key,
        cell: ({ getValue }) => formatCenterCostValue(field.type, getValue()),
        meta: { isNumeric: isNumericField(field.type) },
      })),
      {
        accessorKey: 'automate_status',
        header: 'สถานะ automate',
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-medium ${statusColor(
                status,
              )}`}
            >
              {status}
            </span>
          );
        },
      },
      ...(onAction
        ? [
            {
              id: 'actions',
              header: 'จัดการ',
              cell: ({ row }) => (
                <button
                  type="button"
                  onClick={() => onAction(row.original)}
                  disabled={actionLoadingId === row.original.id}
                  className="px-2 py-1 rounded bg-primary-600 text-white text-[11px] hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoadingId === row.original.id ? 'กำลังบันทึก...' : actionLabel}
                </button>
              ),
            },
          ]
        : []),
    ],
    [actionLabel, actionLoadingId, onAction],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const headerGroups = table.getHeaderGroups();
  const colCount = headerGroups[0]?.headers.length ?? 11;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title || 'Automation Queue'}</h2>
          <p className="text-xs text-slate-500">
            {loading ? 'Refreshing...' : `${data.length.toLocaleString()} records`}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10">
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-3 py-2 text-xs font-semibold text-slate-600 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:bg-slate-100' : ''
                    } ${
                      header.column.columnDef.meta?.isNumeric ? 'text-right' : 'text-left'
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        header.column.columnDef.meta?.isNumeric ? 'justify-end' : ''
                      }`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-[10px] text-slate-400">
                        {{ asc: '▲', desc: '▼' }[header.column.getIsSorted()] ?? ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-3 py-2 whitespace-nowrap ${
                      cell.column.columnDef.meta?.isNumeric ? 'text-right' : 'text-left'
                    } text-slate-700`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={colCount}>
                  No queued records yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-slate-500" colSpan={colCount}>
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
        <div>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className="px-2 py-1 border border-slate-300 rounded disabled:opacity-40"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default QueueTable;
