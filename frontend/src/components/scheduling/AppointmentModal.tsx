import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { patientsService } from '../../services/patients.service';
import { dentistsService } from '../../services/dentists.service';
import { appointmentsService } from '../../services/appointments.service';
import { AppointmentType, AvailableSlot, Dentist, Patient } from '../../types';
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
  onCreated?: () => void;
  defaultDate?: string; // yyyy-mm-dd
}

/**
 * Modal de agendamento. Duas abas que trocam o conteúdo do formulário
 * sem fechar o modal (Consulta ativa por padrão, Compromisso pra
 * bloqueios/reuniões sem paciente) — mapeiam pra
 * POST /appointments com `type: consultation | commitment` no backend.
 */
export function AppointmentModal({ open, onClose, onCreated, defaultDate }: AppointmentModalProps) {
  const [tab, setTab] = useState<AppointmentType>(AppointmentType.CONSULTATION);

  // campos comuns às duas abas
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [dentistId, setDentistId] = useState('');
  const [date, setDate] = useState(defaultDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState<DurationOption>(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [notes, setNotes] = useState('');

  // aba Consulta
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showNewPatientNotice, setShowNewPatientNotice] = useState(false);
  const [autoConfirmation, setAutoConfirmation] = useState(true);
  const [label, setLabel] = useState('');
  const [labelColor, setLabelColor] = useState('');
  const [returnOption, setReturnOption] = useState<ReturnOption>('none');
  const [returnSpecificDate, setReturnSpecificDate] = useState('');

  // aba Compromisso
  const [title, setTitle] = useState('');

  // "Encontrar horário livre"
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
    if (!open) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
    setTime('09:00');
    setDuration(30);
    setCustomDuration(30);
    setNotes('');
    setPatientQuery('');
    setPatientResults([]);
    setSelectedPatient(null);
    setShowNewPatientNotice(false);
    setAutoConfirmation(true);
    setLabel('');
    setLabelColor('');
    setReturnOption('none');
    setReturnSpecificDate('');
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
    setTime(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
    setSlots(null);
  }

  function buildStartEnd() {
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);
    return { startTime: startTime.toISOString(), endTime: endTime.toISOString() };
  }

  async function handleSubmit(e: FormEvent) {
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
        label: label || undefined,
        labelColor: labelColor || undefined,
        returnSchedule:
          tab === AppointmentType.CONSULTATION && returnOption !== 'none'
            ? returnOption === 'specific'
              ? { specificDate: returnSpecificDate }
              : { days: returnOption }
            : undefined,
      });
      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Não foi possível salvar o agendamento.');
    } finally {
      setSaving(false);
    }
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

      <form id="appointment-form" onSubmit={handleSubmit} className="appt-form">
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
              required
            />
          </>
        )}

        <label htmlFor="apptDentist">Profissional</label>
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
          <div className="appt-row-field">
            <label htmlFor="apptTime">Horário</label>
            <input id="apptTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </div>
        </div>

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
                const slotLabel = `${String(start.getHours()).padStart(2, '0')}:${String(
                  start.getMinutes(),
                ).padStart(2, '0')}`;
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

        {tab === AppointmentType.CONSULTATION && (
          <>
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
