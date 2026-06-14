/**
 * 轻量数据表。
 *  columns: [{ key, header, align?, width?, render?(row), thClassName?, tdClassName? }]
 *  rows:    任意对象数组
 *  rowKey:  (row, i) => string
 */
export default function DataTable({ columns, rows, rowKey, empty = null, className = '' }) {
  if (!rows?.length && empty) return empty
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[#eceee6] dark:border-[#1b2430]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={`px-3 py-2 font-medium text-[#82847a] dark:text-gray-500 ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.thClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              className="border-b border-[#f1f2ec] last:border-0 hover:bg-[#fafbf6] dark:border-[#161e29] dark:hover:bg-[#0e141d]"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 align-middle text-[#3f4039] dark:text-gray-200 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.tdClassName || ''}`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
