import React from "react";

function Intern({ user }) {
  return (
    <div className="card">
      <h2>Welcome Intern {user?.name}</h2>
      <p>This is your intern dashboard.</p>
    </div>
  );
}

export default Intern;