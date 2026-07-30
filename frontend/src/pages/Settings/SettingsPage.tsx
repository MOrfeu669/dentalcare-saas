export function SettingsPage() {
  return (
    <div>
      <h2>Configurações</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Página simples de entrada para ajustes da clínica e do usuário.</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <strong>Clínica</strong>
          <p>Dados da clínica podem ser expostos aqui futuramente.</p>
        </div>
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <strong>Usuário</strong>
          <p>Preferências e permissões podem ser gerenciadas aqui.</p>
        </div>
      </div>
    </div>
  );
}
