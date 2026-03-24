import React, { useState } from "react";

export default function Attendance() {

  const [status, setStatus] = useState("Not Marked");

  const markAttendance = () => {
    setStatus("Present");
  };

  return (
    <div>

      <h1>Attendance</h1>

      <h3>Status: {status}</h3>

      <button onClick={markAttendance}>
        Mark Attendance
      </button>

      <br /><br />

      <button>
        Apply Leave
      </button>

      <br /><br />

      <h3>Attendance Calendar</h3>

      <p>Calendar will be added later</p>

    </div>
  );
}