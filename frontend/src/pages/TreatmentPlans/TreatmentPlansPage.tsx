import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { TreatmentPlan } from '../../types';

export function TreatmentPlansPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<TreatmentPlan[]>('/treatment-plans');
        setPlans(data);
      } catch {
        setError('Não foi possível carregar os planos de tratamento.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h2>Planos de tratamento</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Listagem simples consumindo o backend.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {plans.length === 0 ? (
            <p>Nenhum plano encontrado.</p>
          ) : (
            plans.map((plan) => (
              <div key={plan.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>Plano {plan.id.slice(0, 8)}</strong>
                  <span>{plan.status}</span>
                </div>
                <div>Paciente: {plan.patientId}</div>
                <div>Dentista: {plan.dentistId}</div>
                <div>Valor estimado: R$ {Number(plan.totalEstimatedValue).toFixed(2)}</div>
                <ul>
                  {plan.items.map((item) => (
                    <li key={item.id}>{item.description} — {item.status}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
