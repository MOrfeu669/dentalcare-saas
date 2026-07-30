import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface CashFlowSummary {
  period: { from: string; to: string };
  totalReceived: number;
  totalPending: number;
  totalPaidOut: number;
  balance: number;
}

export function CashFlowPage() {
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data } = await api.get<CashFlowSummary>('/financial/cash-flow', {
          params: { from: today, to: today },
        });
        setSummary(data);
      } catch {
        setError('Não foi possível carregar o fluxo de caixa.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h2>Caixa</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Resumo diário vindo do endpoint financeiro.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && summary && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
            <strong>Saldo</strong>
            <div>R$ {Number(summary.balance).toFixed(2)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <div>Total recebido</div>
              <strong>R$ {Number(summary.totalReceived).toFixed(2)}</strong>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <div>Total pendente</div>
              <strong>R$ {Number(summary.totalPending).toFixed(2)}</strong>
            </div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <div>Total pago</div>
              <strong>R$ {Number(summary.totalPaidOut).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
