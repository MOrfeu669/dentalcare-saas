import { useState } from 'react';
import './mini-calendar.css';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

interface MiniCalendarPickerProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** Popover simples de seleção de data — abre a partir do "Seletor de mês" da agenda. */
export function MiniCalendarPicker({ selectedDate, onSelect, onClose }: MiniCalendarPickerProps) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const firstWeekday = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ];

  function changeMonth(delta: number) {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
  }

  return (
    <div className="mini-cal-backdrop" onClick={onClose}>
      <div className="mini-cal" onClick={(e) => e.stopPropagation()}>
        <div className="mini-cal-header">
          <button type="button" onClick={() => changeMonth(-1)}>
            ‹
          </button>
          <span>
            {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button type="button" onClick={() => changeMonth(1)}>
            ›
          </button>
        </div>
        <div className="mini-cal-grid mini-cal-weekdays">
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div className="mini-cal-grid">
          {cells.map((date, i) =>
            date ? (
              <button
                key={i}
                type="button"
                className={`mini-cal-day${isSameDay(date, selectedDate) ? ' selected' : ''}${
                  isSameDay(date, today) ? ' today' : ''
                }`}
                onClick={() => {
                  onSelect(date);
                  onClose();
                }}
              >
                {date.getDate()}
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
