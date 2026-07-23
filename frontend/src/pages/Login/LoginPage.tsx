import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './login.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Marca: um glifo geométrico de dente — o único elemento de assinatura da tela */}
        <svg className="login-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M24 6c-5 0-8 3-11 3-3.5 0-6 2.5-6 7 0 5 2 9 3.5 15.5C11.7 37 13 41 16 41c2.5 0 3-4 4-9 .6-3 1.5-5 4-5s3.4 2 4 5c1 5 1.5 9 4 9 3 0 4.3-4 5.5-9.5C39 25.5 41 21.5 41 16c0-4.5-2.5-7-6-7-3 0-6-3-11-3Z"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
          />
        </svg>
        <h1>DentalCare</h1>
        <p className="login-subtitle">Entre com sua conta da clínica</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
