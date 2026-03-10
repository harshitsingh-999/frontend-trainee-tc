import React, { useState } from "react";
import "../styles/superadmin.css";

function SuperAdmin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [interns, setInterns] = useState([
    { id: 1, name: "Rahul Kumar", department: "IT", manager: "Arjun", status: "Assigned", joinDate: "2026-01-15" },
    { id: 2, name: "Priya Sharma", department: "HR", manager: "Karan", status: "Pending", joinDate: "2026-02-01" },
    { id: 3, name: "Amit Singh", department: "Finance", manager: "Not Assigned", status: "Waiting", joinDate: "2026-02-10" },
  ]);

  const [managers, setManagers] = useState([
    { id: 1, name: "Arjun Verma", department: "IT", interns: 5, performance: "92%" },
    { id: 2, name: "Karan Patel", department: "HR", interns: 3, performance: "88%" },
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, intern: "Rahul", manager: "Arjun", task: "Build API", decision: "Rejected", priority: "High" },
    { id: 2, intern: "Priya", manager: "Karan", task: "Design UI", decision: "Approved", priority: "Medium" },
  ]);

  const stats = [
    { label: "Total Interns", value: "42", color: "#3B82F6",  },
    { label: "Active Managers", value: "12", color: "#10B981", },
    { label: "Completed Tasks", value: "156", color: "#F59E0B", },
    { label: "Pending Review", value: "8", color: "#EF4444", },
  ];

  const handleAssignManager = (internId, manager) => {
    setInterns(interns.map(i => i.id === internId ? { ...i, manager, status: "Assigned" } : i));
    alert(`Manager "${manager}" assigned successfully!`);
  };

  const handleOverride = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, decision: "Overridden" } : t));
    alert("Task decision overridden successfully!");
  };

  return (
    <div className="superadmin-container">
      {/* HEADER SECTION */}
      <div className="superadmin-header">
        <h1> Super Admin Dashboard</h1>
        <p>Manage interns, managers, and system-wide operations</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* TAB NAVIGATION */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          className={`tab-btn ${activeTab === "interns" ? "active" : ""}`}
          onClick={() => setActiveTab("interns")}
        >
          👥 Intern Management
        </button>
        <button
          className={`tab-btn ${activeTab === "managers" ? "active" : ""}`}
          onClick={() => setActiveTab("managers")}
        >
          👔 Manager Control
        </button>
        <button
          className={`tab-btn ${activeTab === "decisions" ? "active" : ""}`}
          onClick={() => setActiveTab("decisions")}
        >
          ⚖️ Override Decisions
        </button>
        <button
          className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          ⚙️ System Settings
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="section">
            <div className="section-header">
              <h2>System Overview</h2>
              <span className="last-updated">Last updated: Today at 10:30 AM</span>
            </div>

            <div className="overview-grid">
              <div className="overview-card">
                <h3>📈 Department Performance</h3>
                <div className="performance-list">
                  <div className="perf-item">
                    <span>IT Department</span>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div className="perf-item">
                    <span>HR Department</span>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: "72%" }}></div>
                    </div>
                  </div>
                  <div className="perf-item">
                    <span>Finance Department</span>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3>📊 Internship Distribution</h3>
                <div className="distribution">
                  <div className="dist-item"><strong>Active:</strong> 35 interns</div>
                  <div className="dist-item"><strong>Pending:</strong> 5 interns</div>
                  <div className="dist-item"><strong>Completed:</strong> 2 interns</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTERN MANAGEMENT TAB */}
        {activeTab === "interns" && (
          <div className="section">
            <div className="section-header">
              <h2>Intern Management</h2>
              <button className="btn-primary">+ Add New Intern</button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Intern Name</th>
                  <th>Department</th>
                  <th>Assigned Manager</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interns.map(intern => (
                  <tr key={intern.id}>
                    <td><strong>{intern.name}</strong></td>
                    <td>{intern.department}</td>
                    <td>
                      <select defaultValue={intern.manager} onChange={(e) => handleAssignManager(intern.id, e.target.value)}>
                        <option>Not Assigned</option>
                        <option>Arjun</option>
                        <option>Karan</option>
                        <option>Vikram</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${intern.status.toLowerCase()}`}>
                        {intern.status}
                      </span>
                    </td>
                    <td>{intern.joinDate}</td>
                    <td>
                      <button className="btn-small">Edit</button>
                      <button className="btn-small btn-danger">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MANAGER CONTROL TAB */}
        {activeTab === "managers" && (
          <div className="section">
            <div className="section-header">
              <h2>Manager Control Panel</h2>
              <button className="btn-primary">+ Assign New Manager</button>
            </div>

            <div className="manager-grid">
              {managers.map(manager => (
                <div key={manager.id} className="manager-card">
                  <div className="manager-header">
                    <h3>{manager.name}</h3>
                    <span className="manager-dept">{manager.department}</span>
                  </div>
                  <div className="manager-stats">
                    <div className="m-stat">
                      <span>Interns:</span>
                      <strong>{manager.interns}</strong>
                    </div>
                    <div className="m-stat">
                      <span>Performance:</span>
                      <strong>{manager.performance}</strong>
                    </div>
                  </div>
                  <div className="manager-actions">
                    <button className="btn-small">View Details</button>
                    <button className="btn-small">Reassign</button>
                    <button className="btn-small btn-danger">Suspend</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OVERRIDE DECISIONS TAB */}
        {activeTab === "decisions" && (
          <div className="section">
            <div className="section-header">
              <h2>Override Manager Decisions</h2>
              <p className="subtitle">Review and override critical decisions made by managers</p>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Intern</th>
                  <th>Task</th>
                  <th>Manager Decision</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td><strong>{task.intern}</strong></td>
                    <td>{task.task}</td>
                    <td>
                      <span className={`decision-badge ${task.decision.toLowerCase()}`}>
                        {task.decision}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-small btn-warning"
                        onClick={() => handleOverride(task.id)}
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SYSTEM SETTINGS TAB */}
        {activeTab === "system" && (
          <div className="section">
            <div className="section-header">
              <h2>System Settings & Configuration</h2>
            </div>

            <div className="settings-grid">
              <div className="settings-card">
                <h3>⚙️ General Settings</h3>
                <div className="setting-item">
                  <label>Max Interns per Manager:</label>
                  <input type="number" defaultValue="10" />
                </div>
                <div className="setting-item">
                  <label>Internship Duration (days):</label>
                  <input type="number" defaultValue="180" />
                </div>
                <button className="btn-primary">Save Settings</button>
              </div>

              <div className="settings-card">
                <h3>📧 Email Notifications</h3>
                <div className="setting-item checkbox">
                  <input type="checkbox" defaultChecked />
                  <label>Notify on new intern assignment</label>
                </div>
                <div className="setting-item checkbox">
                  <input type="checkbox" defaultChecked />
                  <label>Notify on task completion</label>
                </div>
                <div className="setting-item checkbox">
                  <input type="checkbox" />
                  <label>Weekly performance reports</label>
                </div>
                <button className="btn-primary">Update Preferences</button>
              </div>

              <div className="settings-card">
                <h3>🔐 Security</h3>
                <div className="setting-item">
                  <button className="btn-secondary">Change Admin Password</button>
                </div>
                <div className="setting-item">
                  <button className="btn-secondary">View Audit Log</button>
                </div>
                <div className="setting-item">
                  <button className="btn-secondary">Manage API Keys</button>
                </div>
              </div>

              <div className="settings-card">
                <h3>📊 Data Management</h3>
                <div className="setting-item">
                  <button className="btn-secondary">Export All Data</button>
                </div>
                <div className="setting-item">
                  <button className="btn-secondary">Backup System</button>
                </div>
                <div className="setting-item">
                  <button className="btn-danger">Clear Cache</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperAdmin;