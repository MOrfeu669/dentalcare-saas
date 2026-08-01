import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './dashboard.css';

interface DashboardSummary {
  appointmentsToday: { total: number; items: Array<{ id: string; startTime: string }> };
  patientsWaiting: { total: number; items: Array<{ id: string; startTime: string }> };
  nextAppointment: { id: string; startTime: string; patientId: string; dentistId: string; room?: { name?: string } } | null;
  pendingConfirmations: { total: number; items: Array<{ id: string; startTime: string }> };
  importantNotices: Array<{ type: string; message: string }>;
  criticalStock: Array<{ id: string; name: string; currentStock: number; minStock: number; unit: string }>;
  receivedToday: { total: number; payments: Array<{ id: string; amount: number }> };
  proceduresCompletedToday: { total: number; items: Array<{ id: string; description: string }> };
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<DashboardSummary>('/dashboard/summary');
        setSummary(data);
      } catch {
        setError('Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <p>Carregando dashboard…</p>;
  }

  if (error || !summary) {
    return <p role="alert">{error ?? 'Nenhum dado disponível.'}</p>;
  }

  const nextAppointmentLabel = summary.nextAppointment
    ? `${new Date(summary.nextAppointment.startTime).toLocaleString('pt-BR')} · ${summary.nextAppointment.patientId}`
    : 'Nenhuma consulta próxima';

  return (
    <div>
      <h2>Visão geral</h2>
      <p className="dashboard-subtitle">Indicadores do dia e da semana atual</p>

      <div className="kpi-grid">
        <KpiCard label="Consultas hoje" value={summary.appointmentsToday.total.toString()} />
        <KpiCard label="Pacientes aguardando" value={summary.patientsWaiting.total.toString()} />
        <KpiCard label="Confirmações pendentes" value={summary.pendingConfirmations.total.toString()} />
        <KpiCard label="Recebimentos hoje" value={currency.format(summary.receivedToday.total)} mono />
        <KpiCard label="Procedimentos hoje" value={summary.proceduresCompletedToday.total.toString()} />
        <KpiCard label="Estoque crítico" value={summary.criticalStock.length.toString()} tone={summary.criticalStock.length > 0 ? 'warning' : undefined} />
      </div>

      <div className="kpi-grid" style={{ marginTop: 16 }}>
        <KpiCard label="Próxima consulta" value={nextAppointmentLabel} />
        <KpiCard label="Avisos importantes" value={`${summary.importantNotices.length} item(ns)`} tone={summary.importantNotices.length > 0 ? 'warning' : undefined} />
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Section title="Avisos importantes">
          {summary.importantNotices.length === 0 ? <p>Nenhum aviso no momento.</p> : summary.importantNotices.map((item, index) => <p key={`${item.type}-${index}`}>{item.message}</p>)}
        </Section>

        <Section title="Estoque crítico">
          {summary.criticalStock.length === 0 ? <p>Nenhum item em estoque crítico.</p> : summary.criticalStock.map((item) => <p key={item.id}>{item.name} · {item.currentStock} {item.unit} (mín. {item.minStock})</p>)}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
      <h3>{title}</h3>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className={`kpi-card${tone ? ` kpi-${tone}` : ''}`}>
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}
