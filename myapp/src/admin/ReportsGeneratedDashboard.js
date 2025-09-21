import React, { useEffect, useState } from "react";
import axios from "axios";
import { refreshAccessToken } from "../utils/tokenUtils";
import { jsPDF } from "jspdf";
import { FiDownload } from "react-icons/fi";

const ReportsGeneratedDashboard = () => {
  const [reports, setReports] = useState([]);
  const [dbReports, setDbReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // 🔹 Save report to DB (finalize)
  const saveReportToDB = async (report) => {
    try {
      let token = localStorage.getItem("access");
      if (!token) return;

      await axios.post(
        "http://localhost:8000/api/daily-reports/",
        { date: report.date, text: report.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ Remove from localStorage after saving
      let stored = JSON.parse(localStorage.getItem("reports_history")) || [];
      stored = stored.filter((r) => r.date !== report.date);
      localStorage.setItem("reports_history", JSON.stringify(stored));
    } catch (err) {
      console.error("❌ Failed to save report:", err);
    }
  };

  // 🔹 Fetch saved DB reports
  const fetchSavedReports = async () => {
    try {
      let token = localStorage.getItem("access");
      if (!token) return;

      let response;
      try {
        response = await axios.get("http://localhost:8000/api/daily-reports/", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) return;
          response = await axios.get("http://localhost:8000/api/daily-reports/", {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else throw err;
      }

      if (response?.data) {
        const sorted = response.data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setDbReports(sorted);
      }
    } catch (error) {
      console.error("❌ Error fetching DB reports:", error);
    }
  };

  // 🔹 Generate today’s live report
  const generateReport = (apps) => {
    const todayStr = new Date().toISOString().split("T")[0];
    let storedReports = JSON.parse(localStorage.getItem("reports_history")) || [];

    const todaysApps = apps.filter((app) => {
      const relevantDates = [
        app.created_at,
        app.approved_time,
        app.client2_approved_time,
        app.disapproved_time,
        app.checked_at,
        app.approved_at,
      ].filter(Boolean);

      return relevantDates.some(
        (d) => new Date(d).toISOString().split("T")[0] === todayStr
      );
    });

    const group = {
      applications: {
        "Checking Application": 0,
        "Application Waiting Approval": 0,
        "Application Done": 0,
        "Application Disapproved": 0,
      },
      renewals: {
        "Checking Renewal": 0,
        "Renewal Waiting Approval": 0,
        "Renewal Done": 0,
      },
      vehicleTypeCount: {},
      uniqueApplicationUsers: new Set(),
      uniqueRenewalUsers: new Set(),
    };

    todaysApps.forEach((app) => {
      const isRenewal = app.is_renewal;
      const status = app.status;
      if (!isRenewal) {
        if (status === "Checking Application")
          group.applications["Checking Application"]++;
        else if (status === "Waiting Approval")
          group.applications["Application Waiting Approval"]++;
        else if (status === "Application Done") {
          group.applications["Application Done"]++;
          group.uniqueApplicationUsers.add(app.username);
          if (app.vehicle_type)
            group.vehicleTypeCount[app.vehicle_type] =
              (group.vehicleTypeCount[app.vehicle_type] || 0) + 1;
        } else if (status === "Disapproved") {
          group.applications["Application Disapproved"]++;
        }
      } else {
        if (status === "Checking Renewal")
          group.renewals["Checking Renewal"]++;
        else if (status === "Waiting Approval")
          group.renewals["Renewal Waiting Approval"]++;
        else if (status === "Renewal Done") {
          group.renewals["Renewal Done"]++;
          group.uniqueRenewalUsers.add(app.username);
          if (app.vehicle_type)
            group.vehicleTypeCount[app.vehicle_type] =
              (group.vehicleTypeCount[app.vehicle_type] || 0) + 1;
        }
      }
    });

    const reportText = `
As of ${formatDate(todayStr)}, the system processed 
${Object.values(group.applications).reduce((a, b) => a + b, 0)} new applications 
and ${Object.values(group.renewals).reduce((a, b) => a + b, 0)} renewals.

For new applications:
- Under Checking: ${group.applications["Checking Application"]}
- Waiting for Approval: ${group.applications["Application Waiting Approval"]}
- Completed: ${group.applications["Application Done"]}
- Disapproved: ${group.applications["Application Disapproved"]}

For renewals:
- Under Checking: ${group.renewals["Checking Renewal"]}
- Waiting for Approval: ${group.renewals["Renewal Waiting Approval"]}
- Completed: ${group.renewals["Renewal Done"]}

User Activity:
- Users Completed Applications: ${group.uniqueApplicationUsers.size}
- Users Completed Renewals: ${group.uniqueRenewalUsers.size}

Vehicle Types:
${Object.entries(group.vehicleTypeCount)
  .map(([t, c]) => `${t} (${c})`)
  .join(", ") || "No data"}.
`;

    const reportRecord = {
      date: todayStr,
      text: reportText.trim(),
      isFinal: false,
    };

    // Replace today's only
    const existingIndex = storedReports.findIndex((r) => r.date === todayStr);
    if (existingIndex !== -1) {
      storedReports[existingIndex] = {
        ...storedReports[existingIndex],
        ...reportRecord,
      };
    } else {
      storedReports.unshift(reportRecord);
    }

    localStorage.setItem("reports_history", JSON.stringify(storedReports));
    setReports(storedReports);
  };

  // 🔹 Fetch apps
  const fetchData = async () => {
    try {
      let token = localStorage.getItem("access");
      if (!token) return;

      let response;
      try {
        response = await axios.get("http://localhost:8000/api/all-applications/", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (!newToken) return;
          response = await axios.get("http://localhost:8000/api/all-applications/", {
            headers: { Authorization: `Bearer ${newToken}` },
          });
        } else throw err;
      }

      if (response?.data) generateReport(response.data);
    } catch (error) {
      console.error("❌ Error fetching apps:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const savedReports =
      JSON.parse(localStorage.getItem("reports_history")) || [];

    // 🔹 Finalize any frozen reports from previous days
    const yesterdayReports = savedReports.filter(
      (r) => r.date < todayStr && !r.isFinal
    );
    yesterdayReports.forEach((rep) => saveReportToDB(rep));

    setReports(savedReports);

    fetchData();
    fetchSavedReports();
  }, []);

  // 🔹 Helpers
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const downloadReportPDF = (report) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const lines = doc.splitTextToSize(
      report.text,
      doc.internal.pageSize.getWidth() - 80
    );
    doc.setFontSize(12);
    doc.text(lines, 40, 60);
    doc.save(`Report_${report.date}.pdf`);
  };

  // 🔹 Styling
  const containerStyle = {
    maxWidth: "100%",
    margin: "40px 50px",
    fontFamily: "Segoe UI, sans-serif",
    background: "#eee",
    padding: "20px",
  };
  const headerStyle = {
    fontSize: "2rem",
    fontWeight: "600",
    marginBottom: 30,
    color: "#111827",
  };
  const reportCardStyle = {
    background: "#f9fafb",
    padding: 15,
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    marginBottom: 24,
    border: "1px solid #e5e7eb",
  };
  const buttonStyle = {
    border: "1px solid #2563eb",
    background: "transparent",
    color: "#2563eb",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "0.9rem",
  };

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Daily Report Summary</h2>

      {/* 🔹 Local (today only if not yet finalized) */}
      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length > 0 ? (
        reports
          .filter((r) => !r.isFinal) // show only today's live
          .map((r, i) => (
            <div key={i} style={reportCardStyle}>
              <h3>
                Report Date: {formatDate(r.date)}{" "}
                {!r.isFinal && (
                  <span style={{ color: "blue" }}>(Today - Live)</span>
                )}
              </h3>
              <button
                style={buttonStyle}
                onClick={() =>
                  setExpandedIndex(expandedIndex === i ? null : i)
                }
              >
                {expandedIndex === i ? "Hide Report" : "View Report"}
              </button>
              <button
                style={{ ...buttonStyle, marginLeft: 8 }}
                onClick={() => downloadReportPDF(r)}
              >
                <FiDownload /> Download PDF
              </button>
              {expandedIndex === i && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 16,
                    background: "#f3f4f6",
                    borderRadius: 8,
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                  }}
                >
                  {r.text.split("\n").map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          ))
      ) : (
        <p>No local reports for today.</p>
      )}

      {/* 🔹 DB Finalized Reports */}
      <h2 style={{ ...headerStyle, marginTop: 50 }}>
        Finalized Reports (Saved in DB)
      </h2>
      {dbReports.length > 0 ? (
        dbReports.map((r, i) => (
          <div key={i} style={reportCardStyle}>
            <h3>
              Report Date: {formatDate(r.date)}{" "}
              <span style={{ color: "green" }}>(Finalized)</span>
            </h3>

            <button
              style={buttonStyle}
              onClick={() =>
                setExpandedIndex(expandedIndex === `db-${i}` ? null : `db-${i}`)
              }
            >
              {expandedIndex === `db-${i}` ? "Hide Report" : "View Report"}
            </button>

            <button
              style={{ ...buttonStyle, marginLeft: 8 }}
              onClick={() => downloadReportPDF(r)}
            >
              <FiDownload /> Download PDF
            </button>

            {expandedIndex === `db-${i}` && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  background: "#f3f4f6",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {r.text
                  .replace(/\\n/g, "\n")
                  .split("\n")
                  .map((line, idx) => {
                    if (!line.trim()) return <br key={idx} />;
                    if (line.startsWith("-")) {
                      return (
                        <div key={idx} style={{ marginLeft: 16 }}>
                          {line}
                        </div>
                      );
                    }
                    return (
                      <p key={idx} style={{ margin: "6px 0" }}>
                        {line}
                      </p>
                    );
                  })}
              </div>
            )}
          </div>
        ))
      ) : (
        <p>No finalized reports in database.</p>
      )}
    </div>
  );
};

export default ReportsGeneratedDashboard;
