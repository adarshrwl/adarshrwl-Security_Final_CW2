import React, { useEffect, useState } from "react";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("http://localhost:4005/api/logs");
      const data = await response.json();

      // console.log("Fetched Data:", data); // Debugging

      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        console.error("Invalid response structure:", data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false); // Ensuring loading state updates
    }
  };

  useEffect(() => {
    // console.log("Updated Logs:", logs); // Debugging State
  }, [logs]);

  return (
    <div className="container" style={{ padding: "20px" }}>
      <h2>Audit Logs</h2>
      {loading ? (
        <p>Loading...</p>
      ) : logs && logs.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Admin Name</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Details</th>
              <th style={styles.th}>IP Address</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => {
              // console.log("Rendering Log:", log); // Debugging each log
              return (
                <tr
                  key={log._id}
                  style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                >
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>
                    {log.adminId?.name || "Unknown Admin"}
                  </td>
                  <td style={styles.td}>{log.action}</td>
                  <td style={styles.td}>{log.details}</td>
                  <td style={styles.td}>{log.ipAddress}</td>
                  <td style={styles.td}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No logs found.</p>
      )}
    </div>
  );
};

// Inline CSS Styles
const styles = {
  th: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
  },
  evenRow: {
    backgroundColor: "#f9f9f9",
  },
  oddRow: {
    backgroundColor: "#fff",
  },
};

export default AuditLogs;
