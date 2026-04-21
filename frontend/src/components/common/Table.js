import React from 'react';

export const Table = ({ columns, data, actions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2 text-left font-semibold text-xs text-gray-700">
                {col.label}
              </th>
            ))}
            {actions && <th className="px-3 py-2 text-left font-semibold text-xs text-gray-700">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-gray-700 text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-3 py-2 text-gray-700">
                  <div className="flex items-center gap-2">
                  {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
