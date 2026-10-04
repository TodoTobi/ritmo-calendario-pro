import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarEvent } from '@/types/database.types';
import { timeStringToMinutes, minutesToTimeString } from '@/lib/date-utils';
import { EVENT_COLOR_MAP } from '@/lib/color-tokens';
import { Lock, AlertCircle, GripVertical, CheckCircle2 } from 'lucide-react';

interface TactileTimelineProps {
  dateStr: string;
  events: CalendarEvent[];
  onUpdateEventTime: (eventId: string, newStartTime: string, newEndTime: string) => Promise<boolean>;
}

const TIMELINE_START_HOUR = 7; // 07:00
const TIMELINE_END_HOUR = 23; // 23:00
const TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60; // 960 minutes
const HOUR_HEIGHT_PX = 60; // 60px per hour => 1px per minute

export const TactileTimeline: React.FC<TactileTimelineProps> = ({
  dateStr,
  events,
  onUpdateEventTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [initialTopPx, setInitialTopPx] = useState<number>(0);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter events for this specific date
  const dayEvents = useMemo(() => {
    return events.filter((e) => e.event_date === dateStr);
  }, [events, dateStr]);

  // Identify Tier 1 protected zones on this day
  const tier1Zones = useMemo(() => {
    return dayEvents
      .filter((e) => e.tier === 'tier_1')
      .map((e) => ({
        id: e.id,
        title: e.title,
        startMin: timeStringToMinutes(e.start_time),
        endMin: timeStringToMinutes(e.end_time),
      }));
  }, [dayEvents]);

  // Hours array for rendering timeline grid lines
  const hours = Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => TIMELINE_START_HOUR + i
  );

  // Helper to convert minutes from 07:00 to top px
  const minutesToPx = (minutes: number) => {
    const minsFromStart = Math.max(0, minutes - TIMELINE_START_HOUR * 60);
    return (minsFromStart / 60) * HOUR_HEIGHT_PX;
  };

  const pxToMinutes = (px: number) => {
    const mins = Math.round((px / HOUR_HEIGHT_PX) * 60) + TIMELINE_START_HOUR * 60;
    // Snap to 15-minute grid
    return Math.round(mins / 15) * 15;
  };

  // Check collision between a proposed interval and Tier 1 zones
  const checkTier1Collision = (proposedStart: number, proposedEnd: number, currentEventId: string) => {
    for (const zone of tier1Zones) {
      if (zone.id === currentEventId) continue;
      // Overlap condition: max(start1, start2) < min(end1, end2)
      if (Math.max(proposedStart, zone.startMin) < Math.min(proposedEnd, zone.endMin)) {
        return zone;
      }
    }
    return null;
  };

  // Drag start handler (touch / mouse)
  const handleTouchStart = (
    e: React.TouchEvent | React.MouseEvent,
    event: CalendarEvent
  ) => {
    if (event.tier === 'tier_1') {
      // Haptic shake warning: Tier 1 cannot be dragged
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
      setCollisionWarning(`"${event.title}" es Tier 1 (Inamovible). No puede ser reprogramado.`);
      setTimeout(() => setCollisionWarning(null), 3000);
      return;
    }

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startMin = timeStringToMinutes(event.start_time);
    const initialPx = minutesToPx(startMin);

    setActiveDraggingId(event.id);
    setDragStartY(clientY);
    setInitialTopPx(initialPx);
    setDragOffsetY(0);

    // Short haptic vibration on grab
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handleTouchMove = (e: TouchEvent | MouseEvent) => {
    if (!activeDraggingId) return;

    const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const deltaY = clientY - dragStartY;
    setDragOffsetY(deltaY);

    const activeEv = dayEvents.find((x) => x.id === activeDraggingId);
    if (!activeEv) return;

    const durationMin =
      timeStringToMinutes(activeEv.end_time) - timeStringToMinutes(activeEv.start_time);
    const currentTopPx = initialTopPx + deltaY;
    const proposedStartMin = pxToMinutes(currentTopPx);
    const proposedEndMin = proposedStartMin + durationMin;

    const collision = checkTier1Collision(proposedStartMin, proposedEndMin, activeDraggingId);
    if (collision) {
      setCollisionWarning(`Colisión con ${collision.title} (Tier 1 Protegido)`);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } else {
      setCollisionWarning(null);
    }
  };

  const handleTouchEnd = async () => {
    if (!activeDraggingId) return;

    const activeEv = dayEvents.find((x) => x.id === activeDraggingId);
    if (!activeEv) {
      setActiveDraggingId(null);
      return;
    }

    const durationMin =
      timeStringToMinutes(activeEv.end_time) - timeStringToMinutes(activeEv.start_time);
    const finalTopPx = initialTopPx + dragOffsetY;
    let proposedStartMin = pxToMinutes(finalTopPx);

    // Constrain within bounds 07:00 to 23:00 - duration
    const minPossible = TIMELINE_START_HOUR * 60;
    const maxPossible = TIMELINE_END_HOUR * 60 - durationMin;
    proposedStartMin = Math.max(minPossible, Math.min(maxPossible, proposedStartMin));
    const proposedEndMin = proposedStartMin + durationMin;

    const collision = checkTier1Collision(proposedStartMin, proposedEndMin, activeDraggingId);

    if (collision) {
      // Reject move: Rollback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      setCollisionWarning(`Movimiento bloqueado: invade la zona protegida de ${collision.title}`);
      setActiveDraggingId(null);
      setDragOffsetY(0);
      setTimeout(() => setCollisionWarning(null), 3500);
      return;
    }

    const newStartStr = minutesToTimeString(proposedStartMin);
    const newEndStr = minutesToTimeString(proposedEndMin);

    setActiveDraggingId(null);
    setDragOffsetY(0);
    setCollisionWarning(null);

    // Call update handler
    const success = await onUpdateEventTime(activeEv.id, newStartStr, newEndStr);
    if (success) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      setToastMessage(`Bloque reordenado: ${newStartStr} – ${newEndStr}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  useEffect(() => {
    if (!activeDraggingId) return;

    const onMove = (e: TouchEvent | MouseEvent) => handleTouchMove(e);
    const onEnd = () => handleTouchEnd();

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [activeDraggingId, dragOffsetY, initialTopPx]);

  return (
    <div className="flex-1 flex flex-col bg-ritmo-bg relative overflow-hidden pb-24 select-none">
      {/* Collision Warning Banner */}
      {collisionWarning && (
        <div className="sticky top-0 z-30 flex items-center gap-2 bg-[#fff0f1] px-4 py-2 text-xs font-bold text-[#ff5d63] border-b border-[#ff5d63]/30 shadow-md animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{collisionWarning}</span>
        </div>
      )}

      {/* Success Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-ritmo-ink text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-ritmo-green shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white px-4 py-2 border-b border-ritmo-line flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-ritmo-muted">
            Línea Táctil Magnética
          </h2>
          <p className="text-[11px] text-ritmo-ink font-semibold">
            Mantén presionado para reordenar bloques elásticos
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-[#ff5d63]">
            <Lock className="w-3 h-3" /> Tier 1 Blindado
          </span>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative px-2 py-3"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        <div
          className="relative w-full"
          style={{ height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX}px` }}
        >
          {/* Hour Grid Lines */}
          {hours.map((hour) => {
            const topPx = (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT_PX;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-center pointer-events-none"
                style={{ top: `${topPx}px` }}
              >
                <span className="w-12 text-[11px] font-mono font-bold text-ritmo-muted text-right pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1 h-[1px] bg-ritmo-line" />
              </div>
            );
          })}

          {/* Tier 1 Protected Background Zones Highlight */}
          {tier1Zones.map((zone) => {
            const startPx = minutesToPx(zone.startMin);
            const durationMin = zone.endMin - zone.startMin;
            const heightPx = (durationMin / 60) * HOUR_HEIGHT_PX;

            return (
              <div
                key={`t1-bg-${zone.id}`}
                className="absolute left-14 right-2 rounded-lg bg-[#ff5d63]/5 border-2 border-dashed border-[#ff5d63]/30 pointer-events-none flex items-center justify-end pr-2"
                style={{
                  top: `${startPx}px`,
                  height: `${heightPx}px`,
                }}
              >
                <span className="text-[9px] font-bold text-[#ff5d63] uppercase tracking-wider flex items-center gap-1 opacity-70">
                  <Lock className="w-2.5 h-2.5" /> Zona Blindada Tier 1
                </span>
              </div>
            );
          })}

          {/* Event Blocks */}
          {dayEvents.map((event) => {
            const startMin = timeStringToMinutes(event.start_time);
            const endMin = timeStringToMinutes(event.end_time);
            const durationMin = Math.max(30, endMin - startMin);

            const isDragging = activeDraggingId === event.id;
            const normalTopPx = minutesToPx(startMin);
            const topPx = isDragging ? initialTopPx + dragOffsetY : normalTopPx;
            const heightPx = (durationMin / 60) * HOUR_HEIGHT_PX;

            const colorScheme = EVENT_COLOR_MAP[event.color] || EVENT_COLOR_MAP.orange;
            const isTier1 = event.tier === 'tier_1';

            return (
              <div
                key={event.id}
                onMouseDown={(e) => handleTouchStart(e, event)}
                onTouchStart={(e) => handleTouchStart(e, event)}
                style={{
                  top: `${topPx}px`,
                  height: `${heightPx - 3}px`,
                }}
                className={`absolute left-14 right-2 rounded-xl p-2.5 transition-all select-none ${
                  isDragging
                    ? 'z-30 scale-[1.03] shadow-2xl cursor-grabbing ring-2 ring-ritmo-purple ring-offset-2'
                    : isTier1
                    ? 'z-10 shadow-sm cursor-not-allowed opacity-95'
                    : 'z-20 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md'
                } ${colorScheme.bg} border-l-4 ${colorScheme.text} border-t border-r border-b border-ritmo-line/40`}
              >
                <div className="flex items-start justify-between gap-1.5 h-full">
                  <div className="flex flex-col justify-between h-full min-w-0 flex-1">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-ritmo-muted">
                        <span>
                          {isDragging
                            ? `${minutesToTimeString(pxToMinutes(topPx))} – ${minutesToTimeString(
                                pxToMinutes(topPx) + durationMin
                              )}`
                            : `${event.start_time.slice(0, 5)} – ${event.end_time.slice(0, 5)}`}
                        </span>
                        {isTier1 && (
                          <span className="flex items-center gap-0.5 text-[#ff5d63]">
                            <Lock className="w-2.5 h-2.5" /> Fijo
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-ritmo-ink truncate mt-0.5">
                        {event.title}
                      </h4>
                    </div>

                    {heightPx > 45 && event.description && (
                      <p className="text-[10px] text-ritmo-muted line-clamp-1">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center">
                    {!isTier1 ? (
                      <GripVertical className="w-4 h-4 text-ritmo-muted/60" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-ritmo-red/60" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
