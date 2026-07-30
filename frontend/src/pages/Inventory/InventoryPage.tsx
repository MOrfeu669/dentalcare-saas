import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Material } from '../../types';

export function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<Material[]>('/inventory/materials');
        setMaterials(data);
      } catch {
        setError('Não foi possível carregar o estoque.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h2>Estoque</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Materiais e saldo atual vindos do backend.</p>

      {loading && <p>Carregando…</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {materials.length === 0 ? (
            <p>Nenhum material cadastrado.</p>
          ) : (
            materials.map((material) => (
              <div key={material.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{material.name}</strong>
                  <span>{material.active ? 'Ativo' : 'Inativo'}</span>
                </div>
                <div>Estoque: {material.currentStock} {material.unit}</div>
                <div>Mínimo: {material.minStock} {material.unit}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
