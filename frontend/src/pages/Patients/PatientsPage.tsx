import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Drawer } from '../../components/common/Drawer';
import { patientsService } from '../../services/patients.service';
import { Patient } from '../../types';
import './patients.css';

const EMPTY_FORM = {
  name: '',
  cpf: '',
  birthDate: '',
  phone: '',
  whatsapp: '',
  email: '',
  insuranceProvider: '',
};

export function PatientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const drawerOpen = searchParams.get('novo') === '1';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadPatients() {
    setLoading(true);
    try {
      const result = await patientsService.list({ search: search || undefined });
      setPatients(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openDrawer() {
    setSearchParams({ novo: '1' });
  }

  function closeDrawer() {
    setSearchParams({});
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await patientsService.create(form);
      closeDrawer();
      await loadPatients(); // lista atualiza na hora, sem sair da tela
    } catch (err: any) {
      setFormError(err?.response?.data?.message ?? 'Não foi possível salvar o paciente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="patients-header">
        <div>
          <h2>Pacientes</h2>
          <p className="patients-subtitle">{patients.length} paciente(s) encontrado(s)</p>
        </div>
        <button className="btn-primary" onClick={openDrawer}>
          + Novo paciente
        </button>
      </div>

      <input
        className="patients-search"
        placeholder="Buscar por nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="patients-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Telefone</th>
            <th>Convênio</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="patients-empty">
                Carregando…
              </td>
            </tr>
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan={4} className="patients-empty">
                Nenhum paciente encontrado.
              </td>
            </tr>
          ) : (
            patients.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="mono">{p.cpf}</td>
                <td>{p.phone}</td>
                <td>{p.insuranceProvider ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title="Novo paciente"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeDrawer}>
              Cancelar
            </button>
            <button type="submit" form="new-patient-form" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar paciente'}
            </button>
          </>
        }
      >
        <form id="new-patient-form" onSubmit={handleSubmit} className="patients-form">
          <label>Nome completo</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label>CPF</label>
          <input
            required
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: e.target.value })}
          />

          <label>Data de nascimento</label>
          <input
            required
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          />

          <label>Telefone</label>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <label>WhatsApp (para lembretes automáticos)</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />

          <label>E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>Convênio (opcional)</label>
          <input
            value={form.insuranceProvider}
            onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
          />

          {formError && (
            <p className="patients-form-error" role="alert">
              {formError}
            </p>
          )}
          {/* TODO: endereço e contato de emergência — o backend já aceita
              (CreatePatientDto), falta só adicionar esses campos aqui */}
        </form>
      </Drawer>
    </div>
  );
}
