import React from "react";

export default function Notifications() {

  const notifications = [
    "New task assigned to you",
    "Your leave request is approved",
    "Meeting at 4 PM"
  ];

  return (
    <div>

      <h1>Notifications</h1>

      {notifications.map((note, index) => (
        <p key={index}>
          {note}
        </p>
      ))}

    </div>
  );
}