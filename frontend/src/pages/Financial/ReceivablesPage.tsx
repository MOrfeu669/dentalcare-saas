import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Receivable {
  id: string;
  description: string;
  amount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

export function ReceivablesPage() {
  const [items, setItems] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<Receivable[]>('/financial/receivables');
        setItems(data);
      } catch {
        setError('Não foi possível carregar as contas a receber.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h2>Contas a receber</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Listagem simples das contas vinculadas ao backend.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {items.length === 0 ? <p>Nenhuma conta.</p> : items.map((item) => (
            <div key={item.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{item.description}</strong>
                <span>{item.status}</span>
              </div>
              <div>Valor: R$ {Number(item.amount).toFixed(2)}</div>
              <div>Pago: R$ {Number(item.paidAmount).toFixed(2)}</div>
              <div>Vencimento: {item.dueDate}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
