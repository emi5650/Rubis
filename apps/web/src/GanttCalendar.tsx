import React, { useState } from "react";

interface GanttSlot {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  mode: string;
  room: string;
  theme: string;
  criterionCode: string;
}

interface GanttCalendarProps {
  slots: GanttSlot[];
  onSlotUpdate: (slotId: string, newStart: string, newEnd: string) => void;
}

export const GanttCalendar: React.FC<GanttCalendarProps> = ({ slots, onSlotUpdate }) => {
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [resizeSlotId, setResizeSlotId] = useState<string | null>(null);
  const [resizeEdge, setResizeEdge] = useState<"start" | "end" | null>(null);
  const [initialMouseX, setInitialMouseX] = useState(0);
  const [initialTime, setInitialTime] = useState("");

  if (slots.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
        Aucun créneau à afficher
      </div>
    );
  }

  const sortedSlots = [...slots].sort((a, b) => {
    const timeA = new Date(a.startAt).getTime();
    const timeB = new Date(b.startAt).getTime();
    return timeA - timeB;
  });

  const firstSlotTime = new Date(sortedSlots[0].startAt);
  const lastSlotTime = new Date(sortedSlots[sortedSlots.length - 1].endAt);

  const dayStart = new Date(firstSlotTime);
  dayStart.setHours(8, 0, 0, 0);

  const dayEnd = new Date(lastSlotTime);
  dayEnd.setHours(19, 0, 0, 0);

  const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;
  const pixelsPerMinute = 3;
  const timelineWidth = totalMinutes * pixelsPerMinute;

  const getSlotPosition = (startAt: string, endAt: string) => {
    const start = new Date(startAt);
    const end = new Date(endAt);

    const offsetMinutes = (start.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;

    return {
      left: offsetMinutes * pixelsPerMinute,
      width: durationMinutes * pixelsPerMinute
    };
  };

  const handleMouseDown = (
    event: React.MouseEvent,
    slotId: string,
    edge: "start" | "end" | "move"
  ) => {
    event.preventDefault();
    setInitialMouseX(event.clientX);

    if (edge === "move") {
      setDraggedSlotId(slotId);
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        setInitialTime(slot.startAt);
      }
    } else {
      setResizeSlotId(slotId);
      setResizeEdge(edge);
      const slot = slots.find((s) => s.id === slotId);
      if (slot) {
        setInitialTime(edge === "start" ? slot.startAt : slot.endAt);
      }
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedSlotId && !resizeSlotId) return;

    const deltaX = event.clientX - initialMouseX;
    const deltaMinutes = Math.round(deltaX / pixelsPerMinute);

    if (draggedSlotId) {
      const slot = slots.find((s) => s.id === draggedSlotId);
      if (!slot) return;

      const originalStart = new Date(initialTime);
      const originalEnd = new Date(slot.endAt);
      const duration = (originalEnd.getTime() - originalStart.getTime()) / 60000;

      const newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      onSlotUpdate(
        draggedSlotId,
        newStart.toISOString().slice(0, 16),
        newEnd.toISOString().slice(0, 16)
      );
    } else if (resizeSlotId && resizeEdge) {
      const slot = slots.find((s) => s.id === resizeSlotId);
      if (!slot) return;

      if (resizeEdge === "start") {
        const originalStart = new Date(initialTime);
        const newStart = new Date(originalStart.getTime() + deltaMinutes * 60000);
        onSlotUpdate(resizeSlotId, newStart.toISOString().slice(0, 16), slot.endAt);
      } else {
        const originalEnd = new Date(initialTime);
        const newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60000);
        onSlotUpdate(resizeSlotId, slot.startAt, newEnd.toISOString().slice(0, 16));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedSlotId(null);
    setResizeSlotId(null);
    setResizeEdge(null);
    setInitialMouseX(0);
    setInitialTime("");
  };

  const generateTimeMarkers = () => {
    const markers: React.ReactElement[] = [];
    let current = new Date(dayStart);

    while (current <= dayEnd) {
      const offsetMinutes = (current.getTime() - dayStart.getTime()) / 60000;
      const position = offsetMinutes * pixelsPerMinute;

      markers.push(
        <div
          key={current.toISOString()}
          style={{
            position: "absolute",
            left: `${position}px`,
            top: 0,
            bottom: 0,
            borderLeft: "1px solid #e2e8f0",
            width: "1px"
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "-20px",
              fontSize: "11px",
              color: "#64748b",
              width: "40px",
              textAlign: "center"
            }}
          >
            {current.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      );

      current = new Date(current.getTime() + 60 * 60000);
    }

    return markers;
  };

  return (
    <div
      style={{
        marginTop: "20px",
        overflowX: "auto",
        overflowY: "visible",
        padding: "30px 10px 10px 10px",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        backgroundColor: "#f8fafc"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        style={{
          position: "relative",
          height: `${sortedSlots.length * 60 + 40}px`,
          width: `${timelineWidth}px`,
          minWidth: "100%"
        }}
      >
        {generateTimeMarkers()}

        {sortedSlots.map((slot, index) => {
          const { left, width } = getSlotPosition(slot.startAt, slot.endAt);
          const top = 40 + index * 60;

          const isDragging = draggedSlotId === slot.id;
          const isResizing = resizeSlotId === slot.id;

          return (
            <div
              key={slot.id}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: "50px",
                backgroundColor: isDragging || isResizing ? "#3b82f6" : "#0f172a",
                color: "white",
                borderRadius: "8px",
                padding: "6px 8px",
                cursor: isDragging ? "grabbing" : "grab",
                opacity: isDragging || isResizing ? 0.8 : 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                userSelect: "none"
              }}
              onMouseDown={(e) => handleMouseDown(e, slot.id, "move")}
            >
              <div style={{ fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {slot.title}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.9 }}>
                {new Date(slot.startAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date(slot.endAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </div>

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "8px",
                  cursor: "ew-resize",
                  backgroundColor: "transparent"
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, slot.id, "start");
                }}
              />

              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: "8px",
                  cursor: "ew-resize",
                  backgroundColor: "transparent"
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, slot.id, "end");
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
