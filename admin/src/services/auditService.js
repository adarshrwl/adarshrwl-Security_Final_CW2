import axios from "axios";

const API_URL = "http://localhost:4005/api/logs";

export const fetchAuditLogs = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data.logs ? response.data : { success: false, logs: [] };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, logs: [], message: "Failed to fetch audit logs" };
  }
};
