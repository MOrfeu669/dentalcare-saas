import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Appointment } from '../../types';

export function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<Appointment[]>('/appointments/day', { params: { date: today } });
        setAppointments(data);
      } catch {
        setError('Não foi possível carregar a agenda.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [today]);

  return (
    <div>
      <h2>Agenda</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Consultas do dia atual vindas do backend.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {appointments.length === 0 ? (
            <p>Nenhuma consulta para hoje.</p>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.id}
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}
              >
                <strong>{appointment.status}</strong>
                <div>Paciente: {appointment.patientId}</div>
                <div>Dentista: {appointment.dentistId}</div>
                <div>Sala: {appointment.room?.name ?? '—'}</div>
                <div>Início: {new Date(appointment.startTime).toLocaleString('pt-BR')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
