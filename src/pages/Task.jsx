import React from "react";

export default function Task() {

  const tasks = [
    {
      title: "Create Login Page",
      deadline: "Today"
    },
    {
      title: "Fix Dashboard UI",
      deadline: "Tomorrow"
    }
  ];

  return (
    <div>

      <h1>My Tasks</h1>

      {tasks.map((task, index) => (

        <div
          key={index}
          style={{
            border: "1px solid gray",
            padding: "15px",
            marginBottom: "10px"
          }}
        >

          <h3>{task.title}</h3>

          <p>Deadline: {task.deadline}</p>

          <button>
            Submit Task
          </button>

        </div>

      ))}

    </div>
  );
}