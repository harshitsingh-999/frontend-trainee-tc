import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import api from "../api/login_api";

const Calendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ marginBottom: 16 }}>
        <div>
          <h2 className="page-title">My Calendar</h2>
          <p className="page-subtitle">View and manage your tasks, projects, and internal events.</p>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', padding: '0 4px' }}>
        {[
          { label: 'Tasks', color: '#ef4444' },
          { label: 'Projects', color: '#3b82f6' },
          { label: 'Evaluations', color: '#8b5cf6' },
          { label: 'Leaves', color: '#f59e0b' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div className="card calendar-card" style={{ padding: 20, borderRadius: 16 }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          height="auto"
          eventDisplay="block"
          eventBorderColor="transparent"
          dayMaxEvents={true}
          eventClick={(info) => {
            alert(info.event.title);
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;