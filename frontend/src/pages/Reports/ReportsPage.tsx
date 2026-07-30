import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface ReportSummary {
  period: { from: string; to: string };
  total: number;
  byStatus?: Record<string, number>;
  byDentist?: Record<string, number>;
  totalActive?: number;
  newInPeriod?: number;
  totalMaterials?: number;
  lowStockCount?: number;
  totalProcedures?: number;
  totalRevenue?: number;
}

export function ReportsPage() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const from = new Date();
        from.setMonth(from.getMonth() - 1);
        const to = new Date();
        const { data } = await api.get<ReportSummary>('/reports/agenda', {
          params: { from: from.toISOString(), to: to.toISOString() },
        });
        setReport(data);
      } catch {
        setError('Não foi possível carregar os relatórios.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h2>Relatórios</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Exibição simples do relatório de agenda do backend.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && report && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
            <strong>Total de consultas</strong>
            <div>{report.total}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
            <strong>Por status</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(report.byStatus ?? {}, null, 2)}</pre>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
            <strong>Por profissional</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(report.byDentist ?? {}, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
