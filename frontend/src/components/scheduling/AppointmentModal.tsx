import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { patientsService } from '../../services/patients.service';
import { dentistsService } from '../../services/dentists.service';
import { appointmentsService } from '../../services/appointments.service';
import { Appointment, AppointmentStatus, AppointmentType, AvailableSlot, Dentist, Patient } from '../../types';
import './appointment-modal.css';

type DurationOption = 15 | 30 | 45 | 60 | 'custom';
type ReturnOption = 'none' | 7 | 15 | 30 | 'specific';

const LABEL_COLORS = [
  { name: 'Urgente', hex: '#B5473F' },
  { name: 'Retorno', hex: '#4D8B6F' },
  { name: 'Atenção', hex: '#C98A2E' },
  { name: 'Rotina', hex: '#0F5E5A' },
  { name: 'Convênio', hex: '#5C6F6D' },
];

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  defaultStart?: Date; // pré-preenche data+hora ao abrir pra criar (clique num slot vazio)
  appointment?: Appointment | null; // presente = modo edição (clique num evento existente)
  patientDisplayName?: string;
  dentistDisplayName?: string;
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}
function toTimeInput(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Modal de agendamento. Duas abas na criação (Consulta ativa por
 * padrão, Compromisso pra bloqueios/reuniões sem paciente) trocando o
 * formulário sem fechar o modal. Ao abrir com `appointment` definido,
 * vira edição — campos de patiente/profissional/tipo não mudam mais
 * (isso seria cancelar e criar de novo), só o que
 * UpdateAppointmentDto aceita, mais os atalhos de status.
 */
export function AppointmentModal({
  open,
  onClose,
  onSaved,
  defaultStart,
  appointment,
  patientDisplayName,
  dentistDisplayName,
}: AppointmentModalProps) {
  const isEditMode = !!appointment;

  const [tab, setTab] = useState<AppointmentType>(AppointmentType.CONSULTATION);

  // campos comuns às duas abas (criação)
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [dentistId, setDentistId] = useState('');
  const [date, setDate] = useState(defaultStart ? toDateInput(defaultStart) : new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(defaultStart ? toTimeInput(defaultStart) : '09:00');
  const [duration, setDuration] = useState<DurationOption>(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [endDate, setEndDate] = useState(defaultStart ? toDateInput(defaultStart) : new Date().toISOString().slice(0, 10));
  const [endTimeValue, setEndTimeValue] = useState(
    defaultStart ? toTimeInput(new Date(defaultStart.getTime() + 30 * 60_000)) : '10:00',
  );
  const [isAllDay, setIsAllDay] = useState(false);

  const [repeatCommitment, setRepeatCommitment] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'>(
    'weekly',
  );
  const [repeatEndType, setRepeatEndType] = useState<'never' | 'specificDate'>('never');
  const [repeatEndDate, setRepeatEndDate] = useState('');

  const [availability, setAvailability] = useState<'busy' | 'available'>('busy');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertMinutesBefore, setAlertMinutesBefore] = useState<15 | 30 | 60 | 120>(30);

  // aba Consulta (criação)
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showNewPatientNotice, setShowNewPatientNotice] = useState(false);
  const [autoConfirmation, setAutoConfirmation] = useState(true);
  const [returnOption, setReturnOption] = useState<ReturnOption>('none');
  const [returnSpecificDate, setReturnSpecificDate] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatCount, setRepeatCount] = useState(4);

  // rótulo — usado tanto na criação quanto na edição
  const [label, setLabel] = useState('');
  const [labelColor, setLabelColor] = useState('');

  // aba Compromisso (criação) / título em edição de Compromisso
  const [title, setTitle] = useState('');

  // "Encontrar horário livre" (só criação)
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const durationMinutes = duration === 'custom' ? customDuration : duration;

  useEffect(() => {
    if (!open) return;
    dentistsService.list().then(setDentists).catch(() => setDentists([]));
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }
    if (appointment) {
      setNotes(appointment.notes ?? '');
      setLabel(appointment.label ?? '');
      setLabelColor(appointment.labelColor ?? '');
      setTitle(appointment.title ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment]);

  // Autocomplete de paciente — busca com um pequeno debounce, só a
  // partir de 2 caracteres pra não gerar request a cada tecla solta.
  useEffect(() => {
    if (patientQuery.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      patientsService.list({ search: patientQuery }).then((res) => setPatientResults(res.data));
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientQuery]);

  function resetForm() {
    setTab(AppointmentType.CONSULTATION);
    setDentistId('');
    setDate(defaultStart ? toDateInput(defaultStart) : new Date().toISOString().slice(0, 10));
    setTime(defaultStart ? toTimeInput(defaultStart) : '09:00');
    setEndDate(defaultStart ? toDateInput(defaultStart) : new Date().toISOString().slice(0, 10));
    setEndTimeValue(
      defaultStart ? toTimeInput(new Date(defaultStart.getTime() + 30 * 60_000)) : '10:00',
    );
    setIsAllDay(false);
    setDuration(30);
    setCustomDuration(30);
    setNotes('');
    setRepeatCommitment(false);
    setRepeatFrequency('weekly');
    setRepeatEndType('never');
    setRepeatEndDate('');
    setAvailability('busy');
    setAlertEnabled(false);
    setAlertMinutesBefore(30);
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setShowNewPatientNotice(false);
    setAutoConfirmation(true);
    setLabel('');
    setLabelColor('');
    setReturnOption('none');
    setReturnSpecificDate('');
    setRepeatWeekly(false);
    setRepeatCount(4);
    setTitle('');
    setSlots(null);
    setError(null);
  }

  async function handleFindSlots() {
    if (!dentistId || !date) return;
    setLoadingSlots(true);
    setSlots(null);
    try {
      const result = await appointmentsService.getAvailableSlots(dentistId, date, durationMinutes);
      setSlots(result);
    } catch {
      setError('Não foi possível buscar horários livres.');
    } finally {
      setLoadingSlots(false);
    }
  }

  function pickSlot(slot: AvailableSlot) {
    const start = new Date(slot.startTime);
    setTime(toTimeInput(start));
    setSlots(null);
  }

  function calculateWeeklyRecurrenceCount(startDate: string, endDate: string) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diffWeeks = Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60_000));
    return Math.max(2, diffWeeks + 1);
  }

  function buildStartEnd() {
    if (tab === AppointmentType.COMMITMENT) {
      const startTime = new Date(`${date}T${isAllDay ? '00:00:00' : `${time}:00`}`);
      const endTime = new Date(`${endDate}T${isAllDay ? '23:59:00' : `${endTimeValue}:00`}`);
      return { startTime: startTime.toISOString(), endTime: endTime.toISOString() };
    }

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
    return { startTime: startTime.toISOString(), endTime: endTime.toISOString() };
  }

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (tab === AppointmentType.CONSULTATION && !selectedPatient) {
      setError('Selecione um paciente.');
      return;
    }
    if (tab === AppointmentType.COMMITMENT && title.trim().length < 2) {
      setError('Informe um título para o compromisso.');
      return;
    }
    if (tab === AppointmentType.COMMITMENT) {
      const startTime = new Date(`${date}T${isAllDay ? '00:00:00' : `${time}:00`}`);
      const endTime = new Date(`${endDate}T${isAllDay ? '23:59:00' : `${endTimeValue}:00`}`);
      if (endTime <= startTime) {
        setError('O horário de término deve ser posterior ao início.');
        return;
      }
      if (repeatCommitment && repeatEndType === 'specificDate' && !repeatEndDate) {
        setError('Informe a data de término da recorrência.');
        return;
      }
    }
    if (!dentistId) {
      setError('Selecione um profissional.');
      return;
    }
    if (returnOption === 'specific' && !returnSpecificDate) {
      setError('Informe a data específica de retorno.');
      return;
    }

    const { startTime, endTime } = buildStartEnd();

    setSaving(true);
    const recurrencePayload =
      tab === AppointmentType.COMMITMENT && repeatCommitment && repeatFrequency === 'weekly'
        ? {
            frequency: 'weekly' as const,
            count:
              repeatEndType === 'specificDate' && repeatEndDate
                ? calculateWeeklyRecurrenceCount(date, repeatEndDate)
                : 4,
          }
        : undefined;

    const computedLabel = label || (availability === 'available' ? 'Disponível' : undefined);

    try {
      await appointmentsService.create({
        type: tab,
        patientId: tab === AppointmentType.CONSULTATION ? selectedPatient!.id : undefined,
        title: tab === AppointmentType.COMMITMENT ? title : undefined,
        dentistId,
        startTime,
        endTime,
        notes: notes || undefined,
        autoConfirmationEnabled: tab === AppointmentType.CONSULTATION ? autoConfirmation : undefined,
        label: computedLabel || undefined,
        labelColor:
          labelColor || (availability === 'available' ? '#CBD5E1' : undefined),
        returnSchedule:
          tab === AppointmentType.CONSULTATION && returnOption !== 'none'
            ? returnOption === 'specific'
              ? { specificDate: returnSpecificDate }
              : { days: returnOption }
            : undefined,
        recurrence: recurrencePayload,
      });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível salvar o agendamento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!appointment) return;
    setError(null);
    setSaving(true);
    try {
      await appointmentsService.update(appointment.id, {
        notes: notes || undefined,
        label: label || undefined,
        labelColor: labelColor || undefined,
        title: appointment.type === AppointmentType.COMMITMENT ? title : undefined,
      });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickAction(action: 'confirm' | 'complete' | 'cancel') {
    if (!appointment) return;
    setSaving(true);
    setError(null);
    try {
      if (action === 'confirm') await appointmentsService.confirm(appointment.id);
      if (action === 'complete') await appointmentsService.complete(appointment.id);
      if (action === 'cancel') {
        const reason = window.prompt('Motivo do cancelamento:') ?? '';
        await appointmentsService.cancel(appointment.id, reason);
      }
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível concluir a ação.');
    } finally {
      setSaving(false);
    }
  }

  if (isEditMode && appointment) {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const isCommitment = appointment.type === AppointmentType.COMMITMENT;

    return (
      <Modal
        open={open}
        onClose={onClose}
        title={isCommitment ? 'Editar compromisso' : 'Editar consulta'}
        widthPx={480}
        footer={
          <>
            {appointment.status !== AppointmentStatus.CANCELLED && (
              <button
                type="button"
                className="btn-secondary appt-danger-link"
                onClick={() => handleQuickAction('cancel')}
                disabled={saving}
              >
                Cancelar consulta
              </button>
            )}
            {!isCommitment && appointment.status === AppointmentStatus.SCHEDULED && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleQuickAction('confirm')}
                disabled={saving}
              >
                Confirmar
              </button>
            )}
            {appointment.status !== AppointmentStatus.COMPLETED &&
              appointment.status !== AppointmentStatus.CANCELLED && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleQuickAction('complete')}
                  disabled={saving}
                >
                  Concluir
                </button>
              )}
            <button type="submit" form="appointment-edit-form" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </>
        }
      >
        <div className="appt-edit-summary">
          <strong>{isCommitment ? appointment.title : (patientDisplayName ?? 'Paciente')}</strong>
          <span>{dentistDisplayName ?? 'Profissional'}</span>
          <span className="mono">
            {start.toLocaleDateString('pt-BR')} · {toTimeInput(start)}–{toTimeInput(end)}
          </span>
          <span className={`appt-status-badge appt-status-${appointment.status}`}>{appointment.status}</span>
        </div>

        <form id="appointment-edit-form" onSubmit={handleEditSubmit} className="appt-form">
          {isCommitment && (
            <>
              <label htmlFor="apptEditTitle">Título</label>
              <input id="apptEditTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </>
          )}

          <label htmlFor="apptEditNotes">Observações</label>
          <textarea
            id="apptEditNotes"
            maxLength={500}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <span className="appt-char-count">{notes.length}/500</span>

          <p className="appt-section-title">Rótulo</p>
          <input
            placeholder="Ex.: Urgente, Retorno, Convênio…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={40}
          />
          <div className="appt-label-colors">
            {LABEL_COLORS.map((c) => (
              <button
                type="button"
                key={c.hex}
                className={`appt-color-swatch${labelColor === c.hex ? ' selected' : ''}`}
                style={{ background: c.hex }}
                title={c.name}
                onClick={() => setLabelColor(c.hex)}
              />
            ))}
          </div>

          {error && (
            <p className="appt-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo agendamento"
      widthPx={560}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="appointment-form" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="appt-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === AppointmentType.CONSULTATION}
          className={`appt-tab${tab === AppointmentType.CONSULTATION ? ' active' : ''}`}
          onClick={() => setTab(AppointmentType.CONSULTATION)}
        >
          Consulta
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === AppointmentType.COMMITMENT}
          className={`appt-tab${tab === AppointmentType.COMMITMENT ? ' active' : ''}`}
          onClick={() => setTab(AppointmentType.COMMITMENT)}
        >
          Compromisso
        </button>
      </div>

      <form id="appointment-form" onSubmit={handleCreateSubmit} className="appt-form">
        {tab === AppointmentType.CONSULTATION ? (
          <>
            <label>Paciente</label>
            <div className="appt-patient-search">
              <input
                placeholder="Buscar paciente pelo nome…"
                value={selectedPatient ? selectedPatient.name : patientQuery}
                onChange={(e) => {
                  setSelectedPatient(null);
                  setPatientQuery(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
              />
              {showPatientDropdown && !selectedPatient && patientResults.length > 0 && (
                <ul className="appt-patient-dropdown">
                  {patientResults.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setShowPatientDropdown(false);
                      }}
                    >
                      <span>{p.name}</span>
                      <span className="appt-patient-cpf mono">{p.cpf}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="appt-link-button"
              onClick={() => setShowNewPatientNotice((v) => !v)}
            >
              + Cadastrar paciente
            </button>
            {showNewPatientNotice && (
              <p className="appt-inline-notice">
                Cadastro rápido pelo agendamento ainda não está disponível — cadastre em{' '}
                <strong>Pacientes → Cadastro</strong> e volte pra agendar.
              </p>
            )}
          </>
        ) : (
          <>
            <label htmlFor="apptTitle">Título do compromisso</label>
            <input
              id="apptTitle"
              placeholder="Ex.: Reunião de equipe, bloqueio de horário…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
            />

            <label htmlFor="apptDescription">Descrição</label>
            <textarea
              id="apptDescription"
              placeholder="Descriçao do compromisso "
              rows={4}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="appt-char-count">{notes.length}/500</span>

            <p className="appt-section-title">Data e hora</p>
            <div className="appt-row">
              <div className="appt-row-field">
                <label htmlFor="apptStartDate">Data de início</label>
                <input
                  id="apptStartDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              {!isAllDay && (
                <div className="appt-row-field">
                  <label htmlFor="apptStartTime">Hora inicial</label>
                  <input
                    id="apptStartTime"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="appt-row">
              <div className="appt-row-field">
                <label htmlFor="apptEndDate">Data de término</label>
                <input
                  id="apptEndDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              {!isAllDay && (
                <div className="appt-row-field">
                  <label htmlFor="apptEndTime">Hora final</label>
                  <input
                    id="apptEndTime"
                    type="time"
                    value={endTimeValue}
                    onChange={(e) => setEndTimeValue(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="appt-switch-row">
              <span>Dia inteiro</span>
              <button
                type="button"
                role="switch"
                aria-checked={isAllDay}
                className={`appt-switch${isAllDay ? ' on' : ''}`}
                onClick={() => setIsAllDay((v) => !v)}
              >
                <span className="appt-switch-knob" />
              </button>
            </div>

            <div className="appt-switch-row">
              <span>Repetir compromisso</span>
              <button
                type="button"
                role="switch"
                aria-checked={repeatCommitment}
                className={`appt-switch${repeatCommitment ? ' on' : ''}`}
                onClick={() => setRepeatCommitment((v) => !v)}
              >
                <span className="appt-switch-knob" />
              </button>
            </div>

            {repeatCommitment && (
              <>
                <div className="appt-return-options">
                  {(
                    [
                      { value: 'daily', label: 'Todos os dias' },
                      { value: 'weekly', label: 'Semanalmente' },
                      { value: 'biweekly', label: 'Quinzenalmente' },
                      { value: 'monthly', label: 'Mensalmente' },
                      { value: 'yearly', label: 'Anualmente' },
                    ] as const
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      className={`login-chip${repeatFrequency === opt.value ? ' active' : ''}`}
                      onClick={() => setRepeatFrequency(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="appt-switch-row">
                  <span>Terminar repetição</span>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      className={`login-chip${repeatEndType === 'never' ? ' active' : ''}`}
                      onClick={() => setRepeatEndType('never')}
                    >
                      Nunca
                    </button>
                    <button
                      type="button"
                      className={`login-chip${repeatEndType === 'specificDate' ? ' active' : ''}`}
                      onClick={() => setRepeatEndType('specificDate')}
                    >
                      Data específica
                    </button>
                  </div>
                </div>

                {repeatEndType === 'specificDate' && (
                  <input
                    type="date"
                    value={repeatEndDate}
                    onChange={(e) => setRepeatEndDate(e.target.value)}
                    required
                  />
                )}

                <p className="appt-inline-notice">
                  A recorrência semanal é a única opção suportada atualmente pelo backend.
                </p>
              </>
            )}
          </>
        )}

        <label htmlFor="apptDentist">Agenda do profissional</label>
        <select
          id="apptDentist"
          value={dentistId}
          onChange={(e) => {
            setDentistId(e.target.value);
            setSlots(null);
          }}
          required
        >
          <option value="">Selecione…</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.user.id}>
              {d.user.name}
            </option>
          ))}
        </select>

        <div className="appt-row">
          <div className="appt-row-field">
            <label htmlFor="apptDate">Data</label>
            <input
              id="apptDate"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlots(null);
              }}
              required
            />
          </div>
          {!isAllDay && (
            <div className="appt-row-field">
              <label htmlFor="apptTime">Hora inicial</label>
              <input id="apptTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          )}
        </div>

        <div className="appt-row">
          <div className="appt-row-field">
            <label htmlFor="apptEndDate">Data de término</label>
            <input
              id="apptEndDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          {!isAllDay && (
            <div className="appt-row-field">
              <label htmlFor="apptEndTime">Hora final</label>
              <input
                id="apptEndTime"
                type="time"
                value={endTimeValue}
                onChange={(e) => setEndTimeValue(e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {tab === AppointmentType.CONSULTATION ? (
          <>
            <label htmlFor="apptDuration">Duração</label>
            <div className="appt-row">
              <select
                id="apptDuration"
                className="appt-row-field"
                value={duration}
                onChange={(e) => {
                  const v = e.target.value;
                  setDuration(v === 'custom' ? 'custom' : (Number(v) as DurationOption));
                  setSlots(null);
                }}
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos</option>
                <option value="custom">Personalizado</option>
              </select>
              {duration === 'custom' && (
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="appt-row-field"
                />
              )}
            </div>

            <button
              type="button"
              className="btn-secondary appt-find-slot-btn"
              onClick={handleFindSlots}
              disabled={!dentistId || !date || loadingSlots}
            >
              {loadingSlots ? 'Buscando…' : '🔍 Encontrar horário livre'}
            </button>

            {slots && (
              <div className="appt-slots">
                {slots.length === 0 ? (
                  <p className="appt-inline-notice">Nenhum horário livre nesse dia.</p>
                ) : (
                  slots.slice(0, 12).map((s) => {
                    const start = new Date(s.startTime);
                    const slotLabel = toTimeInput(start);
                    return (
                      <button
                        type="button"
                        key={s.startTime}
                        className="appt-slot-chip"
                        onClick={() => pickSlot(s)}
                      >
                        {slotLabel}
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <label htmlFor="apptNotes">Observações</label>
            <textarea
              id="apptNotes"
              maxLength={500}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="appt-char-count">{notes.length}/500</span>

            <p className="appt-section-title">Repetir</p>
            <div className="appt-switch-row">
              <span>Repetir semanalmente</span>
              <button
                type="button"
                role="switch"
                aria-checked={repeatWeekly}
                className={`appt-switch${repeatWeekly ? ' on' : ''}`}
                onClick={() => setRepeatWeekly((v) => !v)}
              >
                <span className="appt-switch-knob" />
              </button>
            </div>
            {repeatWeekly && (
              <div className="appt-row" style={{ marginTop: 8 }}>
                <label htmlFor="apptRepeatCount" style={{ margin: 0, alignSelf: 'center' }}>
                  Por quantas semanas:
                </label>
                <input
                  id="apptRepeatCount"
                  type="number"
                  min={2}
                  max={52}
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Number(e.target.value))}
                  className="appt-row-field"
                />
              </div>
            )}

            <p className="appt-section-title">Retorno</p>
            <div className="appt-return-options">
              {(['none', 7, 15, 30, 'specific'] as ReturnOption[]).map((opt) => (
                <button
                  type="button"
                  key={String(opt)}
                  className={`login-chip${returnOption === opt ? ' active' : ''}`}
                  onClick={() => setReturnOption(opt)}
                >
                  {opt === 'none' ? 'Sem retorno' : opt === 'specific' ? 'Data específica' : `${opt} dias`}
                </button>
              ))}
            </div>
            {returnOption === 'specific' && (
              <input
                type="date"
                value={returnSpecificDate}
                onChange={(e) => setReturnSpecificDate(e.target.value)}
              />
            )}

            <div className="appt-switch-row">
              <span>Confirmação automática (envia lembrete por WhatsApp/SMS)</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoConfirmation}
                className={`appt-switch${autoConfirmation ? ' on' : ''}`}
                onClick={() => setAutoConfirmation((v) => !v)}
              >
                <span className="appt-switch-knob" />
              </button>
            </div>

            <p className="appt-section-title">Rótulo</p>
            <input
              placeholder="Ex.: Urgente, Retorno, Convênio…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={40}
            />
            <div className="appt-label-colors">
              {LABEL_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  className={`appt-color-swatch${labelColor === c.hex ? ' selected' : ''}`}
                  style={{ background: c.hex }}
                  title={c.name}
                  onClick={() => setLabelColor(c.hex)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="appt-section-title">Configurações extras</p>
            <div className="appt-return-options">
              <button
                type="button"
                className={`login-chip${availability === 'busy' ? ' active' : ''}`}
                onClick={() => setAvailability('busy')}
              >
                Ocupado
              </button>
              <button
                type="button"
                className={`login-chip${availability === 'available' ? ' active' : ''}`}
                onClick={() => setAvailability('available')}
              >
                Disponível
              </button>
            </div>

            <div className="appt-switch-row">
              <span>Receber alerta</span>
              <button
                type="button"
                role="switch"
                aria-checked={alertEnabled}
                className={`appt-switch${alertEnabled ? ' on' : ''}`}
                onClick={() => setAlertEnabled((v) => !v)}
              >
                <span className="appt-switch-knob" />
              </button>
            </div>
            {alertEnabled && (
              <div className="appt-row" style={{ marginTop: 8 }}>
                <label htmlFor="apptAlertMinutes" style={{ margin: 0, alignSelf: 'center' }}>
                  Tempo antes do alerta
                </label>
                <select
                  id="apptAlertMinutes"
                  className="appt-row-field"
                  value={alertMinutesBefore}
                  onChange={(e) => setAlertMinutesBefore(Number(e.target.value) as 15 | 30 | 60 | 120)}
                >
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>60 minutos antes</option>
                  <option value={120}>2 horas antes</option>
                </select>
              </div>
            )}
            {alertEnabled && (
              <p className="appt-inline-notice">
                Alertas para compromissos ainda não são enviados automaticamente.
              </p>
            )}
          </>
        )}

        {error && (
          <p className="appt-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
