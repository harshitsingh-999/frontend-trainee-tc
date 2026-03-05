import React, { useEffect, useState } from "react";
import { useAuth } from "../context/authcontext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api/login_api.js";

function daysRemaining() {
  const today = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Wait until session check completes
  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  const role = user?.role || "Intern";
  const remainingDays = daysRemaining();

  const [statsData, setStatsData] = useState({
    activeInterns: 42,
    buddiesAssigned: 38,
    managers: 9,
    internshipsEndingThisMonth: 6
  });

  useEffect(() => {
    api.get("/users/stats")
      .then((res) => {
        const data = res.data?.data || {};
        setStatsData((prev) => ({
          ...prev,
          activeInterns: typeof data.activeInterns === "number" ? data.activeInterns : prev.activeInterns,
          buddiesAssigned: typeof data.buddiesAssigned === "number" ? data.buddiesAssigned : prev.buddiesAssigned,
          managers: typeof data.managers === "number" ? data.managers : prev.managers
        }));
      })
      .catch(() => {
        // Keep fallback values if stats endpoint fails.
      });
  }, []);

  const stats = [
    { label: "Active Interns", value: statsData.activeInterns },
    { label: "Buddies Assigned", value: statsData.buddiesAssigned },
    { label: "Managers", value: statsData.managers },
    { label: "Internships Ending This Month", value: statsData.internshipsEndingThisMonth },
  ];

  const workLog = [
    {
      // name: "Ananya Sharma",
      // role: "Intern",
      // buddy: "Rahul Verma",
      // date: "24 Feb 2026",
      // hours: "7.5",
      // summary: "Worked on UI for intern dashboard and bug fixes.",
    },
    {
      // name: "Rohan Singh",
      // role: "Trainee",
      // buddy: "Priya Nair",
      // date: "24 Feb 2026",
      // hours: "6",
      // summary: "Prepared daily MIS reports and data clean-up.",
    },
    {
      // name: "Mehak Kaur",
      // role: "Intern",
      // buddy: "Saurabh Gupta",
      // date: "23 Feb 2026",
      // hours: "8",
      // summary: "Shadowed client meetings and documented minutes.",
    },
  ];

  const showAdminPanel = role === "Admin";
  const showManagerPanel = role === "Admin" || role === "Manager";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Good day, {user?.name || "Team Member"}</h2>
          <p>
            Role:&nbsp;
            <span className="pill pill-soft">{role}</span>
          </p>
        </div>

        <div className="summary-badge">
          <span>Internship Time Remaining</span>
          <strong>{remainingDays} days</strong>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            marginLeft: "20px",
            padding: "8px 14px",
            backgroundColor: "#e53935 ",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h3>Summary Overview</h3>
              <p>Key numbers for the current internship batch.</p>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((item) => (
              <div key={item.label} className="stat-card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-value">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h3>Intern & Trainee Work Log</h3>
              <p>
                Everyone can see daily work logs to stay aligned with their
                buddy and manager.
              </p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Intern / Trainee</th>
                  <th>Role</th>
                  <th>Buddy</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {workLog.map((entry, index) => (
                  <tr key={index}>
                    <td>{entry.name}</td>
                    <td>{entry.role}</td>
                    <td>{entry.buddy}</td>
                    <td>{entry.date}</td>
                    <td>{entry.hours}</td>
                    <td>{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h3>Internship Timeline</h3>
              <p>Visualise how far you are into the internship.</p>
            </div>
          </div>

          <div className="timeline">
            <div className="timeline-labels">
              <span>Start</span>
              <span>Mid</span>
              <span>End</span>
            </div>

            <div className="timeline-bar">
              <div
                className="timeline-progress"
                style={{ width: "55%" }}
              ></div>
            </div>

            <p className="timeline-caption">
              Approx. 55% of the internship period is completed.{" "}
              <strong>{remainingDays} days</strong> remaining.
            </p>
          </div>
        </section>

        {showManagerPanel && (
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Manager View</h3>
                <p>Track interns mapped to you and their buddies.</p>
              </div>
            </div>

            <ul className="list">
              <li className="list-item">
                <div>
                  <div className="list-title">Ananya Sharma</div>
                  <div className="list-subtitle">
                    Buddy: Rahul Verma · Track: Frontend
                  </div>
                </div>
                <span className="pill pill-green">On Track</span>
              </li>
            </ul>
          </section>
        )}

        {showAdminPanel && (
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Admin Actions</h3>
                <p>Create, update and manage users across roles.</p>
              </div>
            </div>

            <div className="admin-actions">
              <button className="btn-primary btn-small">
                Create New User
              </button>
              <button className="btn-secondary btn-small">
                Manage Managers
              </button>
              <button className="btn-secondary btn-small">
                View Access Matrix
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Dashboard;



/////////////////////////
// function daysRemaining() {
//   const today = new Date()
//   const end = new Date()
//   end.setMonth(end.getMonth() + 3)
//   const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
//   return diff
// }

// function Dashboard({ user }) {
//   const role = user?.role || 'Intern'

//   const remainingDays = daysRemaining()

//   const stats = [
//     { label: 'Active Interns', value: 42 },
//     { label: 'Buddies Assigned', value: 38 },
//     { label: 'Managers', value: 9 },
//     { label: 'Internships Ending This Month', value: 6 },
//   ]

//   const workLog = [
//     {
//       name: 'Ananya Sharma',
//       role: 'Intern',
//       buddy: 'Rahul Verma',
//       date: '24 Feb 2026',
//       hours: '7.5',
//       summary: 'Worked on UI for intern dashboard and bug fixes.',
//     },
//     {
//       name: 'Rohan Singh',
//       role: 'Trainee',
//       buddy: 'Priya Nair',
//       date: '24 Feb 2026',
//       hours: '6',
//       summary: 'Prepared daily MIS reports and data clean-up.',
//     },
//     {
//       name: 'Mehak Kaur',
//       role: 'Intern',
//       buddy: 'Saurabh Gupta',
//       date: '23 Feb 2026',
//       hours: '8',
//       summary: 'Shadowed client meetings and documented minutes.',
//     },
//   ]

//   const showAdminPanel = role === 'Admin'
//   const showManagerPanel = role === 'Admin' || role === 'Manager'

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <div>
//           <h2>Good day, {user?.name || 'Team Member'}</h2>
//           <p>
//             Role:&nbsp;
//             <span className="pill pill-soft">{role}</span>
//           </p>
//         </div>
//         <div className="summary-badge">
//           <span>Internship Time Remaining</span>
//           <strong>{remainingDays} days</strong>
//         </div>
//       </div>

//       <div className="dashboard-grid">
//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Summary Overview</h3>
//               <p>Key numbers for the current internship batch.</p>
//             </div>
//           </div>
//           <div className="stats-grid">
//             {stats.map((item) => (
//               <div key={item.label} className="stat-card">
//                 <div className="stat-label">{item.label}</div>
//                 <div className="stat-value">{item.value}</div>
//               </div>
//             ))}
//           </div>
//         </section>

//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Intern & Trainee Work Log</h3>
//               <p>
//                 Everyone can see daily work logs to stay aligned with their
//                 buddy and manager.
//               </p>
//             </div>
//           </div>
//           <div className="table-wrapper">
//             <table className="table">
//               <thead>
//                 <tr>
//                   <th>Intern / Trainee</th>
//                   <th>Role</th>
//                   <th>Buddy</th>
//                   <th>Date</th>
//                   <th>Hours</th>
//                   <th>Summary</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {workLog.map((entry, index) => (
//                   <tr key={index}>
//                     <td>{entry.name}</td>
//                     <td>{entry.role}</td>
//                     <td>{entry.buddy}</td>
//                     <td>{entry.date}</td>
//                     <td>{entry.hours}</td>
//                     <td>{entry.summary}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         <section className="card">
//           <div className="card-header">
//             <div>
//               <h3>Internship Timeline</h3>
//               <p>Visualise how far you are into the internship.</p>
//             </div>
//           </div>
//           <div className="timeline">
//             <div className="timeline-labels">
//               <span>Start</span>
//               <span>Mid</span>
//               <span>End</span>
//             </div>
//             <div className="timeline-bar">
//               <div
//                 className="timeline-progress"
//                 style={{ width: '55%' }}
//               ></div>
//             </div>
//             <p className="timeline-caption">
//               Approx. 55% of the internship period is completed.{' '}
//               <strong>{remainingDays} days</strong> remaining.
//             </p>
//           </div>
//         </section>

//         {showManagerPanel && (
//           <section className="card">
//             <div className="card-header">
//               <div>
//                 <h3>Manager View</h3>
//                 <p>Track interns mapped to you and their buddies.</p>
//               </div>
//             </div>
//             <ul className="list">
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Ananya Sharma</div>
//                   <div className="list-subtitle">
//                     Buddy: Rahul Verma · Track: Frontend
//                   </div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Rohan Singh</div>
//                   <div className="list-subtitle">
//                     Buddy: Priya Nair · Track: Data & Reporting
//                   </div>
//                 </div>
//                 <span className="pill pill-amber">Needs Attention</span>
//               </li>
//               <li className="list-item">
//                 <div>
//                   <div className="list-title">Mehak Kaur</div>
//                   <div className="list-subtitle">
//                     Buddy: Saurabh Gupta · Track: Pre-sales
//                   </div>
//                 </div>
//                 <span className="pill pill-green">On Track</span>
//               </li>
//             </ul>
//           </section>
//         )}

//         {showAdminPanel && (
//           <section className="card">
//             <div className="card-header">
//               <div>
//                 <h3>Admin Actions</h3>
//                 <p>Create, update and manage users across roles.</p>
//               </div>
//             </div>
//             <div className="admin-actions">
//               <button className="btn-primary btn-small">
//                 Create New User
//               </button>
//               <button className="btn-secondary btn-small">
//                 Manage Managers
//               </button>
//               <button className="btn-secondary btn-small">
//                 View Access Matrix
//               </button>
//             </div>
//           </section>
//         )}
//       </div>
//     </div>
//   )
// }

// export default Dashboard

//////////////////////

//  function Dashboard() {
//   const { user } = useAuth();  // ← get user from context, not props
//   const role = user?.role || "Intern";

//   // ... rest of your existing Dashboard code stays exactly the same
// ```

// ---

// ## Final Folder Structure After All Changes
// ```
// backend/src/
//   api/v1/
//     Controllers/
//       auth.controller.js   ← UPDATED (JWT, /me, /logout)
//       user.controller.js   ← unchanged
//     Routes/
//       auth.route.js        ← UPDATED (added /me, /logout routes)
//       user.routes.js       ← UPDATED (added role-protected routes)
//     Models/ ...unchanged
//   middlewares/
//     auth.middleware.js     ← UPDATED (reads cookie, correct paths)
//     role.middleware.js     ← NEW (requireAdmin, requireManager, etc.)

// frontend/src/
//   context/
//     AuthContext.jsx        ← NEW
//   components/
//     Layout.jsx             ← UPDATED (uses useAuth)
//     ProtectedRoute.jsx     ← NEW
//   pages/
//     Login.jsx              ← UPDATED (uses useAuth)
//     Dashboard.jsx          ← UPDATED (uses useAuth)
//   App.jsx                  ← UPDATED (uses useAuth + ProtectedRoute)
//   main.jsx                 ← UPDATED (wraps in AuthProvider)
// ```

// ---

// ## How it all flows
// ```
// User visits /dashboard
//   → ProtectedRoute checks useAuth()
//   → AuthContext called /me on startup
//   → If cookie exists → user is set → page loads
//   → If no cookie → redirect to /login

// User logs in
//   → POST /auth/login → backend sets httpOnly cookie
//   → frontend stores user in AuthContext state
//   → navigate to /dashboard

// User refreshes page
//   → AuthContext useEffect calls GET /auth/me
//   → Backend reads cookie → returns user data
//   → User state restored → no redirect to login

// User logs out
//   → POST /auth/logout → backend clears cookie
//   → AuthContext sets user to null
//   → navigate to /login
