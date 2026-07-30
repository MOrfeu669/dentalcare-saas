import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { MedicalRecordSummary } from '../../types';

export function MedicalRecordsPage() {
  const [summary, setSummary] = useState<MedicalRecordSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const patientId = localStorage.getItem('dentalcare_selected_patient_id') ?? '';
        if (!patientId) {
          setSummary(null);
          return;
        }

        const { data } = await api.get<MedicalRecordSummary>(`/medical-records/patient/${patientId}/summary`);
        setSummary(data);
      } catch {
        setError('Não foi possível carregar o prontuário.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p>Carregando prontuário…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!summary) return <p>Escolha um paciente primeiro para ver o resumo.</p>;

  return (
    <div>
      <h2>Prontuário</h2>
      <p style={{ color: 'var(--color-text-muted)' }}>Resumo clínico vindo do módulo Medical Records.</p>

      <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <h3>Paciente</h3>
          <p>{summary.patient.name}</p>
          <p>{summary.patient.birthDate}</p>
        </section>

        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <h3>Anamnese</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(summary.anamnesis, null, 2)}</pre>
        </section>

        <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <h3>Arquivos</h3>
          {summary.files.length === 0 ? <p>Nenhum arquivo.</p> : summary.files.map((file) => <div key={file.id}>{file.originalName}</div>)}
        </section>
      </div>
    </div>
  );
}
