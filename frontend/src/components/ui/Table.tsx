import React from "react";

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  isEmpty?: boolean;
  emptyMessage?: string;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  isEmpty = false,
  emptyMessage = "No items found.",
  className = "",
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto border border-brand-border rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
      <table className={`w-full text-left border-collapse min-w-max ${className}`} {...props}>
        <thead>
          <tr className="border-b border-brand-border bg-slate-50/75">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-5 py-3 text-xs font-semibold text-brand-secondary uppercase tracking-wider font-display"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-12 text-center text-sm text-brand-muted">
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
