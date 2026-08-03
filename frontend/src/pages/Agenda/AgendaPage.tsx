import { useEffect, useState } from 'react';
import { AppointmentModal } from '../../components/scheduling/AppointmentModal';
import { appointmentsService } from '../../services/appointments.service';
import { dentistsService } from '../../services/dentists.service';
import { patientsService } from '../../services/patients.service';
import { Appointment, AppointmentType, Dentist, Patient } from '../../types';
import './agenda.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Faltou',
};

export function AgendaPage() {
  const [date, setDate] = useState(todayIso());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadDay() {
    setLoading(true);
    try {
      const [appts, dentistList, patientList] = await Promise.all([
        appointmentsService.getDaySchedule(date),
        dentistsService.list(),
        patientsService.list({}),
      ]);
      setAppointments(appts);
      setDentists(dentistList);
      setPatients(patientList.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function dentistName(dentistId: string) {
    return dentists.find((d) => d.user.id === dentistId)?.user.name ?? '—';
  }

  function patientName(patientId: string | null) {
    if (!patientId) return null;
    return patients.find((p) => p.id === patientId)?.name ?? 'Paciente';
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return (
    <div>
      <div className="agenda-header">
        <div>
          <h2>Agenda</h2>
          <p className="agenda-subtitle">{appointments.length} evento(s) no dia</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Novo agendamento
        </button>
      </div>

      <input
        type="date"
        className="agenda-date-input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <div className="agenda-list">
        {loading ? (
          <p className="agenda-empty">Carregando…</p>
        ) : appointments.length === 0 ? (
          <p className="agenda-empty">Nenhum evento nesse dia.</p>
        ) : (
          appointments
            .slice()
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((a) => (
              <div className="agenda-item" key={a.id}>
                <div className="agenda-item-time mono">
                  {formatTime(a.startTime)}–{formatTime(a.endTime)}
                </div>
                <div className="agenda-item-main">
                  <div className="agenda-item-title">
                    {a.type === AppointmentType.COMMITMENT ? (
                      <span>📌 {a.title}</span>
                    ) : (
                      <span>{patientName(a.patientId)}</span>
                    )}
                    {a.label && (
                      <span
                        className="agenda-label-chip"
                        style={{ background: a.labelColor ?? 'var(--color-primary)' }}
                      >
                        {a.label}
                      </span>
                    )}
                  </div>
                  <div className="agenda-item-sub">
                    {dentistName(a.dentistId)} · {STATUS_LABELS[a.status] ?? a.status}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={loadDay}
        defaultDate={date}
      />
    </div>
  );
}
