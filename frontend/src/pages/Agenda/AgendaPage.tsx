import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppointmentModal } from '../../components/scheduling/AppointmentModal';
import { WeekCalendar } from '../../components/scheduling/WeekCalendar';
import { MiniCalendarPicker } from '../../components/scheduling/MiniCalendarPicker';
import { appointmentsService } from '../../services/appointments.service';
import { dentistsService } from '../../services/dentists.service';
import { patientsService } from '../../services/patients.service';
import { clinicsService } from '../../services/clinics.service';
import { Appointment, Clinic, Dentist, Patient } from '../../types';
import './agenda.css';

type ViewMode = 'day' | 'week';

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

interface Filters {
  compact: boolean;
  hideSaturday: boolean;
  hideSunday: boolean;
  dimPast: boolean;
  hideCancelled: boolean;
}

const DEFAULT_FILTERS: Filters = {
  compact: false,
  hideSaturday: false,
  hideSunday: false,
  dimPast: true,
  hideCancelled: false,
};

export function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDentistId, setSelectedDentistId] = useState<string>('all');

  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showMiniCal, setShowMiniCal] = useState(false);
  const [returnsOnly, setReturnsOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStart, setModalDefaultStart] = useState<Date | undefined>(undefined);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // 7 dias da semana (ou 1, em modo Dia), já aplicando ocultar sáb/dom.
  const days = useMemo(() => {
    const base = viewMode === 'day' ? [new Date(anchorDate)] : (() => {
      const start = startOfWeek(anchorDate);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
    })();
    return base.filter((d) => {
      if (filters.hideSaturday && d.getDay() === 6) return false;
      if (filters.hideSunday && d.getDay() === 0) return false;
      return true;
    });
  }, [viewMode, anchorDate, filters.hideSaturday, filters.hideSunday]);

  const rangeFrom = days[0];
  const rangeTo = days[days.length - 1];

  const loadAppointments = useCallback(async () => {
    if (!rangeFrom || !rangeTo) return;
    setLoading(true);
    try {
      const from = new Date(rangeFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(rangeTo);
      to.setHours(23, 59, 59, 999);
      const data = await appointmentsService.findInRange(
        from.toISOString(),
        to.toISOString(),
        selectedDentistId === 'all' ? undefined : selectedDentistId,
      );
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  }, [rangeFrom?.toDateString(), rangeTo?.toDateString(), selectedDentistId]);

  useEffect(() => {
    dentistsService.list().then(setDentists).catch(() => setDentists([]));
    patientsService.list({}).then((res) => setPatients(res.data));
    clinicsService.getMine().then(setClinic).catch(() => setClinic(null));
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const patientNameById = useMemo(() => {
    const map: Record<string, string> = {};
    patients.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [patients]);

  function dentistName(dentistId: string) {
    return dentists.find((d) => d.user.id === dentistId)?.user.name ?? 'Profissional';
  }

  function navigate(delta: number) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() + delta * (viewMode === 'day' ? 1 : 7));
    setAnchorDate(d);
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  const visibleAppointments = useMemo(() => {
    if (!returnsOnly) return appointments;
    return appointments.filter((a) => a.returnOfAppointmentId || a.label?.toLowerCase() === 'retorno');
  }, [appointments, returnsOnly]);

  function openCreateModal(start?: Date) {
    setEditingAppointment(null);
    setModalDefaultStart(start);
    setModalOpen(true);
  }

  function openEditModal(appointment: Appointment) {
    setEditingAppointment(appointment);
    setModalDefaultStart(undefined);
    setModalOpen(true);
  }

  async function handleEventChange(appointment: Appointment, newStart: Date, newEnd: Date) {
    try {
      await appointmentsService.reschedule(appointment.id, newStart.toISOString(), newEnd.toISOString());
      await loadAppointments();
    } catch (err: any) {
      window.alert(err?.response?.data?.message ?? 'Não foi possível mover a consulta — provável conflito de horário.');
      await loadAppointments(); // garante que a UI volta pro estado real do servidor
    }
  }

  const headerLabel =
    viewMode === 'day'
      ? `${anchorDate.getDate()} de ${MONTH_LABELS[anchorDate.getMonth()]} de ${anchorDate.getFullYear()}`
      : `${MONTH_LABELS[anchorDate.getMonth()]} de ${anchorDate.getFullYear()}`;

  return (
    <div className="agenda-page">
      {/* Barra lateral esquerda */}
      <aside className="agenda-sidebar">
        <button className="agenda-fab" onClick={() => openCreateModal()} title="Novo agendamento">
          +
        </button>

        <div className="agenda-dentist-list">
          <button
            className={`agenda-dentist-item${selectedDentistId === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedDentistId('all')}
          >
            <span className="agenda-dentist-dot" style={{ background: 'var(--color-text-muted)' }} />
            Todos
          </button>
          {dentists.map((d) => (
            <button
              key={d.id}
              className={`agenda-dentist-item${selectedDentistId === d.user.id ? ' active' : ''}`}
              onClick={() => setSelectedDentistId(d.user.id)}
            >
              <span className="agenda-dentist-dot" style={{ background: d.agendaColor }} />
              {d.user.name}
            </button>
          ))}
        </div>
      </aside>

      <div className="agenda-main">
        {/* Barra superior */}
        <div className="agenda-topbar">
          <div className="agenda-topbar-left">
            <button className="agenda-nav-btn" onClick={() => navigate(-1)} aria-label="Anterior">
              ‹
            </button>
            <button className="btn-secondary agenda-today-btn" onClick={goToday}>
              Hoje
            </button>
            <button className="agenda-nav-btn" onClick={() => navigate(1)} aria-label="Próximo">
              ›
            </button>

            <div className="agenda-month-selector">
              <button className="agenda-month-label" onClick={() => setShowMiniCal((v) => !v)}>
                {headerLabel} ▾
              </button>
              {showMiniCal && (
                <MiniCalendarPicker
                  selectedDate={anchorDate}
                  onSelect={setAnchorDate}
                  onClose={() => setShowMiniCal(false)}
                />
              )}
            </div>
          </div>

          <div className="agenda-topbar-right">
            <div className="agenda-dropdown">
              <button className="btn-secondary" onClick={() => setShowViewDropdown((v) => !v)}>
                {viewMode === 'day' ? 'Dia' : 'Semana'} ▾
              </button>
              {showViewDropdown && (
                <div className="agenda-dropdown-menu">
                  <button
                    onClick={() => {
                      setViewMode('day');
                      setShowViewDropdown(false);
                    }}
                  >
                    Dia
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('week');
                      setShowViewDropdown(false);
                    }}
                  >
                    Semana
                  </button>
                </div>
              )}
            </div>

            <button
              className={`btn-secondary${returnsOnly ? ' agenda-action-active' : ''}`}
              onClick={() => setReturnsOnly((v) => !v)}
              title="Visualizar pacientes marcados com retorno"
            >
              Retornos
            </button>

            <button
              className="btn-secondary"
              onClick={() => openCreateModal()}
              title="Encaixe: cria um agendamento avulso, sem checar a agenda visual antes"
            >
              Encaixe
            </button>

            <div className="agenda-dropdown">
              <button className="btn-secondary" onClick={() => setShowFilters((v) => !v)}>
                Filtros ▾
              </button>
              {showFilters && (
                <div className="agenda-dropdown-menu agenda-filters-menu">
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.compact}
                      onChange={(e) => setFilters({ ...filters, compact: e.target.checked })}
                    />
                    Visualização compacta
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.hideSaturday}
                      onChange={(e) => setFilters({ ...filters, hideSaturday: e.target.checked })}
                    />
                    Ocultar sábado
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.hideSunday}
                      onChange={(e) => setFilters({ ...filters, hideSunday: e.target.checked })}
                    />
                    Ocultar domingo
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.dimPast}
                      onChange={(e) => setFilters({ ...filters, dimPast: e.target.checked })}
                    />
                    Reduzir brilho de consultas passadas
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={filters.hideCancelled}
                      onChange={(e) => setFilters({ ...filters, hideCancelled: e.target.checked })}
                    />
                    Ocultar consultas canceladas
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="agenda-grid-wrapper">
          {loading && <div className="agenda-loading-overlay">Carregando…</div>}
          <WeekCalendar
            days={days}
            appointments={visibleAppointments}
            dentists={dentists}
            patientNameById={patientNameById}
            businessHours={clinic?.businessHours}
            compact={filters.compact}
            hideCancelled={filters.hideCancelled}
            dimPast={filters.dimPast}
            onSlotClick={openCreateModal}
            onEventClick={openEditModal}
            onEventChange={handleEventChange}
          />
        </div>
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadAppointments}
        defaultStart={modalDefaultStart}
        appointment={editingAppointment}
        patientDisplayName={editingAppointment?.patientId ? patientNameById[editingAppointment.patientId] : undefined}
        dentistDisplayName={editingAppointment ? dentistName(editingAppointment.dentistId) : undefined}
      />
    </div>
  );
}
