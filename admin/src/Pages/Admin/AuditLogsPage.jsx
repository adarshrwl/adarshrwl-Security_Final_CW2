// src/pages/Admin/AuditLogsPage.jsx
import React from 'react';
import AuditLogs from '../../Components/AuditLogs';

const AuditLogsPage = () => {
  return (
    <div className="audit-logs-page">
      <h1>Admin Audit Logs</h1>
      // Display the AuditLogs component
      <AuditLogs />
    </div>
  );
};

export default AuditLogsPage;