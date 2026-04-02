import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import api from "../api/login_api";

const Calendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => { fetchEvents(); }, []);

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
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', padding: '0 4px', alignItems: 'center' }}>
        {[
          { label: 'Tasks',       color: '#ef4444' },
          { label: 'Projects',    color: '#3b82f6' },
          { label: 'Evaluations', color: '#8b5cf6' },
          { label: 'Leaves',      color: '#f59e0b' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>{l.label}</span>
          </div>
        ))}
        {/* FIX 14: Weekend indicator in legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 16, borderLeft: '1px solid #e5e7eb' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#fef2f2', border: '1px solid #fecaca' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Sat / Sun (Off)</span>
        </div>
      </div>

      <div className="card calendar-card" style={{ padding: 20, borderRadius: 16 }}>
        {/* FIX 14: Weekend CSS — red day numbers, light background */}
        <style>{`
          .fc-day-sat, .fc-day-sun {
            background-color: #fff5f5 !important;
          }
          .fc-day-sat .fc-daygrid-day-number,
          .fc-day-sun .fc-daygrid-day-number {
            color: #ef4444 !important;
            font-weight: 700;
          }
          .fc-col-header-cell.fc-day-sat .fc-col-header-cell-cushion,
          .fc-col-header-cell.fc-day-sun .fc-col-header-cell-cushion {
            color: #ef4444 !important;
            font-weight: 700;
          }
          .fc-col-header-cell.fc-day-sat,
          .fc-col-header-cell.fc-day-sun {
            background: #fff1f2 !important;
          }
          .fc-day-today {
            background-color: #eff6ff !important;
          }
        `}</style>

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
          weekends={true}
          dayCellClassNames={(arg) => {
            const day = arg.date.getDay();
            return day === 0 || day === 6 ? ['fc-weekend-off'] : [];
          }}
          eventClick={(info) => {
            alert(info.event.title);
          }}
        />
      </div>
    </div>
  );
};

export default Calendar;
