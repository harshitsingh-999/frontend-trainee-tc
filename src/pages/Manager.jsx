// import React from "react";

// export default function Manager() {
//   return (
//     <div className="manager-page">

//       {/* STATS */}
//       <div className="stats-grid">

//         <div className="stat-card">
//           <h3>My Projects</h3>
//           <p className="stat-value">3</p>
//           <span>Active Team: 12</span>
//         </div>

//         <div className="stat-card">
//           <h3>Pending Tasks</h3>
//           <p className="stat-value">8</p>
//           <span>Overdue: 2</span>
//         </div>

//         <div className="stat-card">
//           <h3>Team Rating</h3>
//           <p className="stat-value">4.1 / 5</p>
//           <span>Attendance: 92%</span>
//         </div>

//       </div>

//       {/* QUICK ACTIONS */}
//       <div className="section">
//         <h2>⚡ Quick Actions</h2>

//         <div className="actions-grid">
//           <button className="action-btn">➕ Create Project</button>
//           <button className="action-btn">👥 Assign Team</button>
//           <button className="action-btn">📋 Bulk Tasks</button>
//           <button className="action-btn">📈 Reports</button>
//         </div>
//       </div>

//       {/* PROJECT LIST */}
//       <div className="section">
//         <h2>📋 My Projects</h2>

//         <div className="project">
//           <span>Intern Portal UI</span>
//           <div className="progress">
//             <div style={{ width: "70%" }} />
//           </div>
//         </div>

//         <div className="project">
//           <span>Training Dashboard</span>
//           <div className="progress">
//             <div style={{ width: "45%" }} />
//           </div>
//         </div>
//       </div>

//       {/* TEAM TABLE */}
//       <div className="section">
//         <h2>👥 Team Members</h2>

//         <table className="team-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Role</th>
//               <th>Status</th>
//             </tr>
//           </thead>

//           <tbody>
//             <tr>
//               <td>Rahul</td>
//               <td>Intern</td>
//               <td>Active</td>
//             </tr>
//             <tr>
//               <td>Ananya</td>
//               <td>Trainee</td>
//               <td>On Leave</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//     </div>
//   );
// }


import React from "react";

export default function Manager() {
  return (
    <div className="manager-container">

      {/* ================= STATS ================= */}
      <div className="manager-stats">

        <div className="stat-box">
          <h3>My Projects</h3>
          <p>3</p>
          <span>Active Team: 12</span>
        </div>

        <div className="stat-box">
          <h3>Pending Tasks</h3>
          <p>8</p>
          <span>Overdue: 2</span>
        </div>

        <div className="stat-box">
          <h3>Team Rating</h3>
          <p>4.1 / 5</p>
          <span>Attendance: 92%</span>
        </div>

      </div>


      {/* ================= QUICK ACTIONS ================= */}
      <section className="manager-section">
        <h2>⚡ Quick Actions</h2>

        <div className="actions-grid">
          <button>Create Project</button>
          <button>Assign Team Members</button>
          <button>Bulk Task Assignment</button>
          <button>View Team Report</button>
        </div>
      </section>


      {/* ================= PROJECT LIST ================= */}
      <section className="manager-section">
        <h2>📋 My Projects</h2>

        <div className="project-item">
          <span>Intern Portal</span>
          <div className="progress"><div style={{width:"70%"}} /></div>
        </div>

        <div className="project-item">
          <span>Training Dashboard</span>
          <div className="progress"><div style={{width:"45%"}} /></div>
        </div>

        <div className="project-item">
          <span>HR System</span>
          <div className="progress"><div style={{width:"90%"}} /></div>
        </div>
      </section>


      {/* ================= TEAM TABLE ================= */}
      <section className="manager-section">
        <h2>👥 Team Members</h2>

        <table className="team-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Rahul</td>
              <td>Intern</td>
              <td>Active</td>
            </tr>
            <tr>
              <td>Priya</td>
              <td>Trainee</td>
              <td>On Leave</td>
            </tr>
            <tr>
              <td>Amit</td>
              <td>Intern</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </section>


      {/* ================= KANBAN ================= */}
      <section className="manager-section">
        <h2>📌 Task Overview</h2>

        <div className="kanban">

          <div className="kanban-column">
            <h4>To Do</h4>
            <div className="card">Setup repo</div>
            <div className="card">Design UI</div>
          </div>

          <div className="kanban-column">
            <h4>In Progress</h4>
            <div className="card">API Integration</div>
          </div>

          <div className="kanban-column">
            <h4>Done</h4>
            <div className="card">Login Page</div>
          </div>

        </div>
      </section>


      {/* ================= PAIRING REQUESTS ================= */}
      <section className="manager-section">
        <h2>🤝 Pairing Requests</h2>

        <div className="pair-list">
          <div className="pair-card">
            Intern: Rahul → Buddy: Ankit
            <button>Approve</button>
          </div>

          <div className="pair-card">
            Intern: Sneha → Buddy: Riya
            <button>Approve</button>
          </div>
        </div>
      </section>

    </div>
  );
}