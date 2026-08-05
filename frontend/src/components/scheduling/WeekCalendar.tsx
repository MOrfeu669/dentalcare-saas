import { useMemo, useRef, useState } from 'react';
import { Appointment, AppointmentStatus, AppointmentType, BusinessHoursDay, Dentist } from '../../types';
import './week-calendar.css';

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEKDAY_ABBR = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTH_ABBR = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const ROW_HEIGHT = 16; // px por 15min — 1h = 64px
const SLOT_MINUTES = 15;
const DEFAULT_HOURS: BusinessHoursDay[] = [{ open: '08:00', close: '18:00' }];

interface WeekCalendarProps {
  days: Date[];
  appointments: Appointment[];
  dentists: Dentist[];
  patientNameById: Record<string, string>;
  businessHours?: Record<string, BusinessHoursDay[]>;
  compact: boolean;
  hideCancelled: boolean;
  dimPast: boolean;
  onSlotClick: (start: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onEventChange: (appointment: Appointment, newStart: Date, newEnd: Date) => void;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function snap(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

/**
 * Modelagem inspirada em agendas modernas (Google Calendar): grade de
 * dias em colunas, eventos posicionados/dimensionados por pixel a
 * partir do horário, arrastar move, alça no rodapé redimensiona. O
 * horário de atendimento vem de fora (Configurações da clínica) e só
 * define os limites visuais/de interação aqui — nenhuma regra de
 * negócio de agenda mora neste componente além de "não deixar
 * soltar/redimensionar fora do expediente do dia".
 */
export function WeekCalendar({
  days,
  appointments,
  dentists,
  patientNameById,
  businessHours,
  compact,
  hideCancelled,
  dimPast,
  onSlotClick,
  onEventClick,
  onEventChange,
}: WeekCalendarProps) {
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<{
    appointment: Appointment;
    mode: 'move' | 'resize';
    originalStartMin: number;
    originalEndMin: number;
    dayIndex: number;
    previewStartMin: number;
    previewEndMin: number;
    previewDayIndex: number;
  } | null>(null);

  // Janela vertical da grade: união dos horários de funcionamento dos
  // dias exibidos, com folga de 1h pra cima/baixo pra não colar os
  // primeiros/últimos horários na borda. Cai pro padrão 08–18h se a
  // clínica não tiver configurado nada ainda.
  const { gridStartMin, gridEndMin } = useMemo(() => {
    let minOpen = 24 * 60;
    let maxClose = 0;
    let found = false;
    for (const day of days) {
      const key = WEEKDAY_KEYS[day.getDay()];
      const hours = businessHours?.[key] ?? [];
      for (const h of hours) {
        found = true;
        minOpen = Math.min(minOpen, toMinutes(h.open));
        maxClose = Math.max(maxClose, toMinutes(h.close));
      }
    }
    if (!found) {
      minOpen = toMinutes(DEFAULT_HOURS[0].open);
      maxClose = toMinutes(DEFAULT_HOURS[0].close);
    }
    return {
      gridStartMin: Math.max(0, minOpen - 60),
      gridEndMin: Math.min(24 * 60, maxClose + 60),
    };
  }, [days, businessHours]);

  const totalRows = (gridEndMin - gridStartMin) / SLOT_MINUTES;
  const gridHeight = totalRows * ROW_HEIGHT;
  const rowH = compact ? ROW_HEIGHT * 0.7 : ROW_HEIGHT;

  const hourMarks: number[] = [];
  for (let m = Math.ceil(gridStartMin / 60) * 60; m <= gridEndMin; m += 60) hourMarks.push(m);

  function dentistColor(dentistId: string): string {
    return dentists.find((d) => d.user.id === dentistId)?.agendaColor ?? '#0F5E5A';
  }

  function isWithinBusinessHours(day: Date, minutes: number): boolean {
    const hasAnyConfig = businessHours && Object.keys(businessHours).length > 0;
    if (!hasAnyConfig) return true; // clínica ainda não configurou nada — não bloqueia

    const key = WEEKDAY_KEYS[day.getDay()];
    const hours = businessHours![key];
    if (!hours || hours.length === 0) return false; // dia ausente da config = fechado nesse dia
    return hours.some((h) => minutes >= toMinutes(h.open) && minutes < toMinutes(h.close));
  }

  function minutesFromY(y: number, columnTop: number): number {
    const relativeY = y - columnTop;
    const minutesFromGridStart = (relativeY / rowH) * SLOT_MINUTES;
    return snap(gridStartMin + minutesFromGridStart);
  }

  function handleColumnClick(dayIndex: number, e: React.MouseEvent<HTMLDivElement>) {
    if (drag) return; // clique disparado ao soltar um drag — ignora
    const col = columnRefs.current[dayIndex];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const minutes = minutesFromY(e.clientY, rect.top);
    if (!isWithinBusinessHours(days[dayIndex], minutes)) return; // "horário não disponível não recebe consulta"

    const start = new Date(days[dayIndex]);
    start.setHours(0, minutes, 0, 0);
    onSlotClick(start);
  }

  function startDrag(
    e: React.MouseEvent,
    appointment: Appointment,
    dayIndex: number,
    mode: 'move' | 'resize',
  ) {
    e.stopPropagation();
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const startMin = start.getHours() * 60 + start.getMinutes();
    const endMin = end.getHours() * 60 + end.getMinutes();
    const startClientY = e.clientY;

    setDrag({
      appointment,
      mode,
      originalStartMin: startMin,
      originalEndMin: endMin,
      dayIndex,
      previewStartMin: startMin,
      previewEndMin: endMin,
      previewDayIndex: dayIndex,
    });

    function onMove(ev: MouseEvent) {
      const deltaY = ev.clientY - startClientY;
      const deltaMin = snap((deltaY / rowH) * SLOT_MINUTES);

      setDrag((prev) => {
        if (!prev) return prev;
        if (mode === 'resize') {
          const newEnd = Math.max(prev.originalStartMin + SLOT_MINUTES, prev.originalEndMin + deltaMin);
          return { ...prev, previewEndMin: newEnd };
        }
        // mover: desloca início/fim juntos, e detecta em qual coluna o
        // mouse está agora pra permitir mover entre dias.
        const duration = prev.originalEndMin - prev.originalStartMin;
        let newStart = prev.originalStartMin + deltaMin;
        newStart = Math.max(0, Math.min(24 * 60 - duration, newStart));

        let newDayIndex = prev.dayIndex;
        for (let i = 0; i < columnRefs.current.length; i++) {
          const rect = columnRefs.current[i]?.getBoundingClientRect();
          if (rect && ev.clientX >= rect.left && ev.clientX < rect.right) {
            newDayIndex = i;
            break;
          }
        }

        return {
          ...prev,
          previewStartMin: newStart,
          previewEndMin: newStart + duration,
          previewDayIndex: newDayIndex,
        };
      });
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      setDrag((prev) => {
        if (!prev) return null;

        const changed =
          prev.previewStartMin !== prev.originalStartMin ||
          prev.previewEndMin !== prev.originalEndMin ||
          prev.previewDayIndex !== prev.dayIndex;

        if (changed) {
          const targetDay = days[prev.previewDayIndex];
          const newStart = new Date(targetDay);
          newStart.setHours(0, prev.previewStartMin, 0, 0);
          const newEnd = new Date(targetDay);
          newEnd.setHours(0, prev.previewEndMin, 0, 0);
          onEventChange(prev.appointment, newStart, newEnd);
        }
        return null;
      });
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const now = new Date();

  return (
    <div className="week-cal">
      <div className="week-cal-gutter">
        <div className="week-cal-gutter-spacer" />
        {hourMarks.map((m) => (
          <div key={m} className="week-cal-hour-label" style={{ height: rowH * 4 }}>
            {String(Math.floor(m / 60)).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      <div className="week-cal-columns">
        {days.map((day, dayIndex) => {
          const dayAppointments = appointments.filter((a) => {
            if (hideCancelled && a.status === AppointmentStatus.CANCELLED) return false;
            const start = new Date(a.startTime);
            return start.toDateString() === day.toDateString();
          });

          return (
            <div key={dayIndex} className="week-cal-day">
              <div className="week-cal-day-header">
                <span className="week-cal-day-abbr">{WEEKDAY_ABBR[day.getDay()]}</span>
                <span className="week-cal-day-num">
                  {day.getDate()} <small>{MONTH_ABBR[day.getMonth()]}</small>
                </span>
              </div>

              <div
                className="week-cal-column"
                style={{ height: gridHeight }}
                ref={(el) => (columnRefs.current[dayIndex] = el)}
                onClick={(e) => handleColumnClick(dayIndex, e)}
              >
                {/* linhas de 15 em 15 min — a cada 4 uma linha de hora mais forte */}
                {Array.from({ length: totalRows }).map((_, i) => {
                  const minutes = gridStartMin + i * SLOT_MINUTES;
                  const outOfHours = !isWithinBusinessHours(day, minutes);
                  return (
                    <div
                      key={i}
                      className={`week-cal-slot-line${i % 4 === 0 ? ' hour' : ''}${outOfHours ? ' closed' : ''}`}
                      style={{ height: rowH }}
                    />
                  );
                })}

                {dayAppointments.map((a) => {
                  const start = new Date(a.startTime);
                  const end = new Date(a.endTime);
                  const startMin = start.getHours() * 60 + start.getMinutes();
                  const endMin = end.getHours() * 60 + end.getMinutes();
                  const durationMin = endMin - startMin;

                  const isDraggingThis = drag?.appointment.id === a.id;
                  if (isDraggingThis && drag!.previewDayIndex !== dayIndex) return null;

                  const top =
                    (((isDraggingThis ? drag!.previewStartMin : startMin) - gridStartMin) / SLOT_MINUTES) * rowH;
                  const height =
                    ((isDraggingThis ? drag!.previewEndMin - drag!.previewStartMin : durationMin) / SLOT_MINUTES) *
                    rowH;

                  const isPast = end < now;
                  const isCancelled = a.status === AppointmentStatus.CANCELLED;
                  const color = a.labelColor || dentistColor(a.dentistId);
                  const title =
                    a.type === AppointmentType.COMMITMENT
                      ? a.title
                      : (patientNameById[a.patientId ?? ''] ?? 'Paciente');

                  return (
                    <div
                      key={a.id}
                      className={`week-cal-event${isCancelled ? ' cancelled' : ''}${
                        isPast && dimPast ? ' past' : ''
                      }${isDraggingThis ? ' dragging' : ''}`}
                      style={{ top, height: Math.max(height, rowH), background: color }}
                      onMouseDown={(e) => startDrag(e, a, dayIndex, 'move')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!drag) onEventClick(a);
                      }}
                    >
                      <span className="week-cal-event-title">{title}</span>
                      {!compact && (
                        <span className="week-cal-event-time">
                          {String(start.getHours()).padStart(2, '0')}:
                          {String(start.getMinutes()).padStart(2, '0')}
                        </span>
                      )}
                      {!compact && durationMin > 30 && a.procedureId && (
                        <span className="week-cal-event-procedure">procedimento vinculado</span>
                      )}
                      <div
                        className="week-cal-event-resize-handle"
                        onMouseDown={(e) => startDrag(e, a, dayIndex, 'resize')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
