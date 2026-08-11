import React from 'react';
import './SkeletonTable.module.css';

/**
 * SkeletonTable – placeholder UI displayed while table data is loading.
 * Renders a simple animated gray block mimicking a table layout.
 */
export default function SkeletonTable({ rows = 5, columns = 4 }) {
  const rowsArray = Array.from({ length: rows });
  const colsArray = Array.from({ length: columns });
  return (
    <div className="skeleton-table">
      {rowsArray.map((_row, i) => (
        <div key={i} className="skeleton-row">
          {colsArray.map((_col, j) => (
            <div key={j} className="skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}
