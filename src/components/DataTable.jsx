import { useMemo, useState } from 'react';

const DataTable = ({ columns = [], data = [], loading = false, emptyText = 'No data available' }) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const sortedData = useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [data, sortField, sortDirection]);

  const handleSort = (key) => {
    if (sortField === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(key);
    setSortDirection('asc');
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
          <div className="grid gap-3">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="grid grid-cols-[150px_minmax(200px,_1fr)] gap-3">
                <div className="h-10 animate-pulse rounded bg-slate-200" />
                <div className="h-10 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-600"
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortField === column.key && (
                      <span className="text-xs text-slate-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {sortedData.map((item) => (
              <tr key={item.id || item.key} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 text-slate-700">
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
