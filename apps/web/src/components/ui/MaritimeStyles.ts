/**
 * Shared maritime UI styles for dark-themed Ant Design tables and selects.
 * Import this class name anywhere a Table needs the dark maritime look:
 *   <Table className="maritime-table" ... />
 */
export const maritimeTableClass = 'maritime-table';

export const maritimeTableStyles = `
  .maritime-table .ant-table {
    background: transparent !important;
    color: #e6f7ff !important;
  }
  .maritime-table .ant-table-thead > tr > th {
    background: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.85) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .maritime-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  }
  .maritime-table .ant-table-tbody > tr:hover > td {
    background: rgba(255, 255, 255, 0.02) !important;
  }
  .maritime-table .ant-table-placeholder {
    background: transparent !important;
  }
  .maritime-select .ant-select-selector {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
  }
  .maritime-modal .ant-modal-content,
  .maritime-modal .ant-modal-header {
    background: #0c2f4a !important;
  }
  .maritime-modal .ant-modal-title {
    color: #fff !important;
  }
  .ant-statistic-content {
    color: inherit !important;
  }
`;
