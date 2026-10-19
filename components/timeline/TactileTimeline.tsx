import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
const HOUR_HEIGHT_PX = 60; // 60px per hour => 1px per minute

export const TactileTimeline: React.FC<TactileTimelineProps> = ({
  dateStr,
  events,
  onUpdateEventTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [initialTopPx, setInitialTopPx] = useState<number>(0);
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References to preserve touch state across continuous frames and gestures
  const isDraggingRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPointerYRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const initialScrollTopRef = useRef<number>(0);
  const initialTopPxRef = useRef<number>(0);
  const autoScrollRafRef = useRef<number | null>(null);
  const activeEventRef = useRef<CalendarEvent | null>(null);

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
  const minutesToPx = useCallback((minutes: number) => {
    const minsFromStart = Math.max(0, minutes - TIMELINE_START_HOUR * 60);
    return (minsFromStart / 60) * HOUR_HEIGHT_PX;
  }, []);

  const pxToMinutes = useCallback((px: number) => {
    const mins = Math.round((px / HOUR_HEIGHT_PX) * 60) + TIMELINE_START_HOUR * 60;
    // Snap to 15-minute grid
    return Math.round(mins / 15) * 15;
  }, []);

  // Check collision between a proposed interval and Tier 1 zones
  const checkTier1Collision = useCallback(
    (proposedStart: number, proposedEnd: number, currentEventId: string) => {
      for (const zone of tier1Zones) {
        if (zone.id === currentEventId) continue;
        if (Math.max(proposedStart, zone.startMin) < Math.min(proposedEnd, zone.endMin)) {
          return zone;
        }
      }
      return null;
    },
    [tier1Zones]
  );

  // Continuous Auto-Scroll and Position Updater
  const updateDragCalculations = useCallback(() => {
    if (!isDraggingRef.current || !activeEventRef.current) return;

    const currentScrollTop = containerRef.current?.scrollTop || 0;
    const scrollAdjustment = currentScrollTop - initialScrollTopRef.current;
    const deltaY = currentPointerYRef.current - dragStartYRef.current + scrollAdjustment;

    setDragOffsetY(deltaY);

    const activeEv = activeEventRef.current;
    const durationMin =
      timeStringToMinutes(activeEv.end_time) - timeStringToMinutes(activeEv.start_time);
    const currentTopPx = initialTopPxRef.current + deltaY;
    const proposedStartMin = pxToMinutes(currentTopPx);
    const proposedEndMin = proposedStartMin + durationMin;

    const collision = checkTier1Collision(proposedStartMin, proposedEndMin, activeEv.id);
    if (collision) {
      setCollisionWarning(`Colisión con ${collision.title} (Tier 1 Protegido)`);
    } else {
      setCollisionWarning(null);
    }
  }, [pxToMinutes, checkTier1Collision]);

  // Animation frame loop for continuous edge auto-scroll
  const runAutoScrollLoop = useCallback(() => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 85; // px from top or bottom of visible viewport
    const pointerY = currentPointerYRef.current;

    if (pointerY < rect.top + edgeThreshold && pointerY > rect.top - 60) {
      // Near top edge: scroll UP smoothly
      const intensity = Math.max(0.15, (rect.top + edgeThreshold - pointerY) / edgeThreshold);
      const speed = Math.min(18, Math.max(3, intensity * 16));
      container.scrollTop = Math.max(0, container.scrollTop - speed);
      updateDragCalculations();
    } else if (pointerY > rect.bottom - edgeThreshold && pointerY < rect.bottom + 60) {
      // Near bottom edge: scroll DOWN smoothly
      const intensity = Math.max(0.15, (pointerY - (rect.bottom - edgeThreshold)) / edgeThreshold);
      const speed = Math.min(18, Math.max(3, intensity * 16));
      container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + speed);
      updateDragCalculations();
    }

    autoScrollRafRef.current = requestAnimationFrame(runAutoScrollLoop);
  }, [updateDragCalculations]);

  // Activate Dragging Mode
  const startDragging = useCallback(
    (event: CalendarEvent, clientY: number) => {
      if (event.tier === 'tier_1') {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([35, 50, 35]);
        }
        setCollisionWarning(`"${event.title}" es Tier 1 (Inamovible). No puede ser reprogramado.`);
        setTimeout(() => setCollisionWarning(null), 3000);
        return;
      }

      const startMin = timeStringToMinutes(event.start_time);
      const initialPx = minutesToPx(startMin);

      activeEventRef.current = event;
      isDraggingRef.current = true;
      dragStartYRef.current = clientY;
      currentPointerYRef.current = clientY;
      initialScrollTopRef.current = containerRef.current?.scrollTop || 0;
      initialTopPxRef.current = initialPx;

      setActiveDraggingId(event.id);
      setInitialTopPx(initialPx);
      setDragOffsetY(0);

      // Short tactile haptic vibration when card lifts
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(30);
      }

      // Start continuous auto-scroll check
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = requestAnimationFrame(runAutoScrollLoop);
    },
    [minutesToPx, runAutoScrollLoop]
  );

  // Stop Dragging and Commit or Revert
  const stopDragging = useCallback(async () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (autoScrollRafRef.current) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }

    if (!isDraggingRef.current || !activeEventRef.current) {
      isDraggingRef.current = false;
      setActiveDraggingId(null);
      return;
    }

    const activeEv = activeEventRef.current;
    isDraggingRef.current = false;

    const currentScrollTop = containerRef.current?.scrollTop || 0;
    const scrollAdjustment = currentScrollTop - initialScrollTopRef.current;
    const finalDeltaY = currentPointerYRef.current - dragStartYRef.current + scrollAdjustment;

    const durationMin =
      timeStringToMinutes(activeEv.end_time) - timeStringToMinutes(activeEv.start_time);
    const finalTopPx = initialTopPxRef.current + finalDeltaY;
    let proposedStartMin = pxToMinutes(finalTopPx);

    // Constrain within bounds 07:00 to 23:00 - duration
    const minPossible = TIMELINE_START_HOUR * 60;
    const maxPossible = TIMELINE_END_HOUR * 60 - durationMin;
    proposedStartMin = Math.max(minPossible, Math.min(maxPossible, proposedStartMin));
    const proposedEndMin = proposedStartMin + durationMin;

    const collision = checkTier1Collision(proposedStartMin, proposedEndMin, activeEv.id);

    if (collision) {
      // Collision Rollback with haptic error pulse
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      setCollisionWarning(`Bloqueado: invade la zona protegida de "${collision.title}"`);
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

    // Persist updated event time
    const success = await onUpdateEventTime(activeEv.id, newStartStr, newEndStr);
    if (success) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(20);
      }
      setToastMessage(`Bloque reordenado: ${newStartStr} – ${newEndStr}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, [pxToMinutes, checkTier1Collision, onUpdateEventTime]);

  // Touch Handlers for Block Card
  const handleCardTouchStart = (e: React.TouchEvent, event: CalendarEvent) => {
    if (event.tier === 'tier_1') return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    currentPointerYRef.current = touch.clientY;

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      startDragging(event, touch.clientY);
    }, 200);
  };

  // Immediate Drag on Grip Handle
  const handleGripTouchStart = (e: React.TouchEvent | React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startDragging(event, clientY);
  };

  // Global listeners while touch is active
  useEffect(() => {
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      currentPointerYRef.current = clientY;

      if (!isDraggingRef.current && touchStartPosRef.current) {
        const deltaDist = Math.hypot(
          clientX - touchStartPosRef.current.x,
          clientY - touchStartPosRef.current.y
        );
        if (deltaDist > 8 && longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }

      if (isDraggingRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
        updateDragCalculations();
      }
    };

    const handleGlobalEnd = () => {
      stopDragging();
    };

    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [updateDragCalculations, stopDragging]);

  return (
    <div className="flex-1 flex flex-col bg-family-cream relative overflow-hidden pb-24 select-none font-inter">
      {/* Collision Warning Banner */}
      {collisionWarning && (
        <div className="sticky top-0 z-40 flex items-center gap-2 bg-family-red/10 px-4 py-2.5 text-xs font-medium text-family-red border-b border-family-red/20 shadow-sm animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0 text-family-red" />
          <span>{collisionWarning}</span>
        </div>
      )}

      {/* Success Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-family-ink text-white px-4 py-2 rounded-full text-xs font-medium shadow-family-dark">
          <CheckCircle2 className="w-4 h-4 text-family-green shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white px-4 py-2.5 border-b border-family-stone flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-family-muted">
            Línea Táctil Magnética
          </h2>
          <p className="text-[11px] text-family-charcoal font-medium">
            Arrastra el tirador o mantén presionado para reordenar
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold">
          <span className="flex items-center gap-1 text-family-red bg-family-red/10 px-2.5 py-0.5 rounded-[6px] border border-family-red/20">
            <Lock className="w-3 h-3" /> Tier 1 Blindado
          </span>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative px-2 py-3 bg-family-cream"
        style={{ height: 'calc(100vh - 180px)', touchAction: activeDraggingId ? 'none' : 'pan-y' }}
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
                <span className="w-12 text-[11px] font-mono font-medium text-family-muted text-right pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </span>
                <div className="flex-1 h-[1px] bg-family-stone" />
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
                className="absolute left-14 right-2 rounded-[10px] bg-family-red/5 border-2 border-dashed border-family-red/20 pointer-events-none flex items-center justify-end pr-2"
                style={{
                  top: `${startPx}px`,
                  height: `${heightPx}px`,
                }}
              >
                <span className="text-[9px] font-medium text-family-red uppercase tracking-wider flex items-center gap-1 opacity-80">
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
            const baseTopPx = isDragging ? initialTopPx : normalTopPx;
            const currentPreviewTopPx = isDragging ? initialTopPx + dragOffsetY : normalTopPx;
            const heightPx = (durationMin / 60) * HOUR_HEIGHT_PX;

            const colorScheme = EVENT_COLOR_MAP[event.color] || EVENT_COLOR_MAP.green;
            const isTier1 = event.tier === 'tier_1';

            return (
              <div
                key={event.id}
                onTouchStart={(e) => handleCardTouchStart(e, event)}
                style={{
                  top: `${baseTopPx}px`,
                  height: `${heightPx - 3}px`,
                  transform: isDragging ? `translate3d(0, ${dragOffsetY}px, 0) scale(1.02)` : 'translate3d(0, 0, 0)',
                  willChange: isDragging ? 'transform' : 'auto',
                }}
                className={`absolute left-14 right-2 rounded-[10px] p-2.5 select-none transition-shadow bg-white ${
                  isDragging
                    ? 'z-30 shadow-family-dark ring-1 ring-family-ink border-family-ink'
                    : isTier1
                    ? 'z-10 shadow-sm opacity-95 border-l-4 border-family-red'
                    : 'z-20 shadow-family-inset hover:border-family-stone/80'
                } border-l-4 ${colorScheme.text} border-t border-r border-b border-family-stone`}
                style-accent={{ borderLeftColor: colorScheme.accent }}
              >
                <div className="flex items-start justify-between gap-1.5 h-full">
                  <div className="flex flex-col justify-between h-full min-w-0 flex-1">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-family-muted">
                        <span>
                          {isDragging
                            ? `${minutesToTimeString(pxToMinutes(currentPreviewTopPx))} – ${minutesToTimeString(
                                pxToMinutes(currentPreviewTopPx) + durationMin
                              )}`
                            : `${event.start_time.slice(0, 5)} – ${event.end_time.slice(0, 5)}`}
                        </span>
                        {isTier1 && (
                          <span className="flex items-center gap-0.5 text-family-red font-medium">
                            <Lock className="w-2.5 h-2.5" /> Fijo
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-xs text-family-ink truncate mt-0.5">
                        {event.title}
                      </h4>
                    </div>

                    {heightPx > 45 && event.description && (
                      <p className="text-[10px] text-family-brown line-clamp-1 font-normal">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Grip Handle / Lock Icon */}
                  <div className="shrink-0 flex items-center h-full">
                    {!isTier1 ? (
                      <div
                        onTouchStart={(e) => handleGripTouchStart(e, event)}
                        onMouseDown={(e) => handleGripTouchStart(e, event)}
                        className="p-1.5 -mr-1 rounded-full hover:bg-family-stone/50 active:bg-family-stone cursor-grab active:cursor-grabbing text-family-muted hover:text-family-ink transition-colors"
                        title="Arrastrar para mover horario"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1 -mr-1">
                        <Lock className="w-3.5 h-3.5 text-family-red/70" />
                      </div>
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
