import React, { useState } from "react";

export default function Leave() {
  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      startDate: "2026-03-10",
      endDate: "2026-03-12",
      reason: "Medical checkup",
      status: "Pending",
    },
    {
      id: 2,
      startDate: "2026-03-15",
      endDate: "2026-03-15",
      reason: "Personal work",
      status: "Approved",
    },
  ]);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (formData.startDate && formData.endDate && formData.reason) {
      const newLeave = {
        id: leaveRequests.length + 1,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: "Pending",
      };
      setLeaveRequests([...leaveRequests, newLeave]);
      setFormData({ startDate: "", endDate: "", reason: "" });
      alert("Leave request submitted successfully!");
    } else {
      alert("Please fill all fields");
    }
  };

  return (
    <div>
      <h1>Leave Requests</h1>

      {/* FORM TO REQUEST LEAVE */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
        }}
      >
        <h2>Request Leave</h2>
        <form onSubmit={handleSubmitLeave}>
          <div style={{ marginBottom: "15px" }}>
            <label>Start Date:</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              style={{ display: "block", width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>End Date:</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              style={{ display: "block", width: "100%", padding: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Reason:</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="4"
              style={{ display: "block", width: "100%", padding: "8px" }}
            />
          </div>

          <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
            Submit Leave Request
          </button>
        </form>
      </div>

      {/* LIST OF LEAVE REQUESTS */}
      <h2>Your Leave Requests</h2>
      {leaveRequests.length === 0 ? (
        <p>No leave requests yet</p>
      ) : (
        leaveRequests.map((leave) => (
          <div
            key={leave.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "5px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h3>{leave.reason}</h3>
                <p>
                  From: {leave.startDate} to {leave.endDate}
                </p>
              </div>
              <span
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  backgroundColor:
                    leave.status === "Approved"
                      ? "#d4edda"
                      : leave.status === "Rejected"
                      ? "#f8d7da"
                      : "#fff3cd",
                  color:
                    leave.status === "Approved"
                      ? "#155724"
                      : leave.status === "Rejected"
                      ? "#721c24"
                      : "#856404",
                }}
              >
                {leave.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
