/**
 * TableSkeleton — animated skeleton loader for tables.
 *
 * Usage:
 *   <TableSkeleton rows={6} cols={5} />
 */
export default function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-5 py-3">
              <div
                className={`h-4 rounded-lg bg-slate-100 animate-pulse ${j === 0 ? "w-36" : "w-20"}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
