import type { ReactNode } from 'react'

interface DataTableProps {
  headers: ReactNode[]
  children: ReactNode
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{headers.map((header, index) => <th key={index}>{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
