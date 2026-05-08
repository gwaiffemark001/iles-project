import React from 'react';
import './DataTable.css';

const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  error = null, 
  onRowClick = null, 
  pagination = null, 
  ...props 
}) => {
  const handleSort = (column) => {
    if (onSort) {
      onSort(column);
    }
  };

  const handlePageChange = (page) => {
    if (pagination && pagination.onPageChange) {
      pagination.onPageChange(page);
    }
  };

  const renderCell = (row, column) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.format) {
      return column.format(value);
    }
    
    return value;
  };

  const renderPagination = () => {
    if (!pagination) return null;
    
    const { currentPage, totalPages, onPageChange } = pagination;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    
    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="data-table-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-table-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-container">
        <div className="no-data">No data available</div>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} className={column.sortable ? 'sortable' : ''}>
                {column.title}
                {column.sortable && (
                  <button 
                    onClick={() => handleSort(column.key)}
                    className="sort-btn"
                  >
                    ↕
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={row.id || index}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map(column => (
                <td key={column.key} className="table-cell">
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {renderPagination()}
    </div>
  );
};

export default DataTable;
