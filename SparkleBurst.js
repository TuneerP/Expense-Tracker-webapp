import { useRef, useState } from "react";

const REVEAL_WIDTH = 72;

export default function SwipeToDelete({ children, onDelete }) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startDragX = useRef(0);
  const moved = useRef(false);

  function clamp(x) {
    return Math.max(-REVEAL_WIDTH, Math.min(0, x));
  }

  function handleStart(clientX) {
    startX.current = clientX;
    startDragX.current = dragX;
    moved.current = false;
    setDragging(true);
  }

  function handleMove(clientX) {
    const delta = clientX - startX.current;
    if (Math.abs(delta) > 4) moved.current = true;
    setDragX(clamp(startDragX.current + delta));
  }

  function handleEnd() {
    setDragging(false);
    // Snap to open or closed based on how far it was dragged.
    setDragX((x) => (x < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0));
  }

  function handleRowClick(e) {
    // If the row is revealed, tapping the row content closes it instead
    // of triggering whatever's underneath.
    if (dragX !== 0) {
      e.preventDefault();
      setDragX(0);
    }
  }

  return (
    <div className="relative overflow-hidden" style={{ touchAction: "pan-y" }}>
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: REVEAL_WIDTH, background: "var(--rust)" }}
      >
        <button
          onClick={() => {
            onDelete();
            setDragX(0);
          }}
          aria-label="Delete entry"
          className="w-full h-full flex items-center justify-center font-semibold"
          style={{ color: "var(--cream)", fontSize: 12.5 }}
        >
          Delete
        </button>
      </div>
      <div
        onClick={handleRowClick}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => {
          handleStart(e.clientX);
          const onMouseMove = (ev) => handleMove(ev.clientX);
          const onMouseUp = () => {
            handleEnd();
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
          };
          window.addEventListener("mousemove", onMouseMove);
          window.addEventListener("mouseup", onMouseUp);
        }}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
          background: "var(--paper)",
          cursor: "grab",
        }}
      >
        {children}
      </div>
    </div>
  );
}
