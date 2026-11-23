import React from 'react';

export interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  emptyMessage = 'Tidak ada data ditemukan.',
  isEmpty = false,
}) => {
  return (
    <div className="w-full overflow-x-auto border border-line bg-surface/20">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-line bg-surface/50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="py-3 px-4 font-medium uppercase tracking-[0.1em] text-[0.62rem] text-muted whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="py-12 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};
