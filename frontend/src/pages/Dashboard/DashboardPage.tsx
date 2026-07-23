import './dashboard.css';

// Placeholder — substituir por chamada real a GET /dashboard/summary
// quando DashboardService.getSummary() (backend) estiver implementado.
const MOCK_SUMMARY = {
  appointmentsToday: 12,
  revenueMonth: 48250.0,
  expensesMonth: 17600.0,
  lowStockItems: 3,
  proceduresCompletedMonth: 76,
  activePatients: 512,
};

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function DashboardPage() {
  const profit = MOCK_SUMMARY.revenueMonth - MOCK_SUMMARY.expensesMonth;

  return (
    <div>
      <h2>Visão geral</h2>
      <p className="dashboard-subtitle">Indicadores do mês corrente</p>

      <div className="kpi-grid">
        <KpiCard label="Consultas hoje" value={MOCK_SUMMARY.appointmentsToday.toString()} />
        <KpiCard label="Faturamento" value={currency.format(MOCK_SUMMARY.revenueMonth)} mono />
        <KpiCard label="Lucro" value={currency.format(profit)} mono tone="success" />
        <KpiCard label="Despesas" value={currency.format(MOCK_SUMMARY.expensesMonth)} mono />
        <KpiCard
          label="Estoque baixo"
          value={`${MOCK_SUMMARY.lowStockItems} itens`}
          tone={MOCK_SUMMARY.lowStockItems > 0 ? 'warning' : undefined}
        />
        <KpiCard
          label="Procedimentos no mês"
          value={MOCK_SUMMARY.proceduresCompletedMonth.toString()}
        />
        <KpiCard label="Pacientes ativos" value={MOCK_SUMMARY.activePatients.toString()} />
      </div>
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
