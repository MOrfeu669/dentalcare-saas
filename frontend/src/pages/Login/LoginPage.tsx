import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import './login.css';

type Mode = 'login' | 'register';
type RegisterType = 'clinic' | 'dentist' | 'staff';

const EMPTY_CLINIC_FORM = {
  clinicName: '',
  cnpj: '',
  clinicPhone: '',
  clinicEmail: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

const EMPTY_STAFF_FORM = {
  clinicCnpj: '',
  name: '',
  email: '',
  password: '',
  professionalLicense: '',
};

function extractErrorMessage(err: unknown, fallback: string): string {
  const raw = (err as any)?.response?.data?.message;
  if (!raw) return fallback;
  if (Array.isArray(raw)) return raw.join(' ');
  if (typeof raw === 'object') return raw.message ?? fallback;
  return raw;
}

export function LoginPage() {
  const { login, registerClinic, registerStaff } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [registerType, setRegisterType] = useState<RegisterType>('clinic');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [clinicForm, setClinicForm] = useState(EMPTY_CLINIC_FORM);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  function switchRegisterType(next: RegisterType) {
    setRegisterType(next);
    setError(null);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch {
      setError('E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterClinic(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerClinic({
        clinic: {
          name: clinicForm.clinicName,
          cnpj: clinicForm.cnpj,
          phone: clinicForm.clinicPhone || undefined,
          email: clinicForm.clinicEmail || undefined,
        },
        admin: {
          name: clinicForm.adminName,
          email: clinicForm.adminEmail,
          password: clinicForm.adminPassword,
        },
      });
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível cadastrar a clínica.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterStaff(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerStaff({
        clinicCnpj: staffForm.clinicCnpj,
        name: staffForm.name,
        email: staffForm.email,
        password: staffForm.password,
        role: registerType === 'dentist' ? UserRole.DENTIST : UserRole.RECEPTIONIST,
        professionalLicense: registerType === 'dentist' ? staffForm.professionalLicense : undefined,
      });
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err, 'Não foi possível concluir o cadastro.'));
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

        <div className="login-mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`login-mode-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`login-mode-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Criar conta
          </button>
        </div>

        {mode === 'login' && (
          <>
            <p className="login-subtitle">Entre com sua conta da clínica</p>
            <form onSubmit={handleLogin}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                autoComplete="current-password"
                required
              />

              {error && <p className="login-error" role="alert">{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </>
        )}

        {mode === 'register' && (
          <>
            <p className="login-subtitle">O que você quer cadastrar?</p>

            <div className="login-register-type">
              <button
                type="button"
                className={`login-chip${registerType === 'clinic' ? ' active' : ''}`}
                onClick={() => switchRegisterType('clinic')}
              >
                Clínica
              </button>
              <button
                type="button"
                className={`login-chip${registerType === 'dentist' ? ' active' : ''}`}
                onClick={() => switchRegisterType('dentist')}
              >
                Dentista
              </button>
              <button
                type="button"
                className={`login-chip${registerType === 'staff' ? ' active' : ''}`}
                onClick={() => switchRegisterType('staff')}
              >
                Funcionário
              </button>
            </div>

            {registerType === 'clinic' ? (
              <form onSubmit={handleRegisterClinic}>
                <p className="login-form-section">Dados da clínica</p>
                <label htmlFor="clinicName">Nome da clínica</label>
                <input
                  id="clinicName"
                  value={clinicForm.clinicName}
                  onChange={(e) => setClinicForm({ ...clinicForm, clinicName: e.target.value })}
                  required
                />

                <label htmlFor="cnpj">CNPJ</label>
                <input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={clinicForm.cnpj}
                  onChange={(e) => setClinicForm({ ...clinicForm, cnpj: e.target.value })}
                  required
                />

                <label htmlFor="clinicPhone">Telefone (opcional)</label>
                <input
                  id="clinicPhone"
                  value={clinicForm.clinicPhone}
                  onChange={(e) => setClinicForm({ ...clinicForm, clinicPhone: e.target.value })}
                />

                <p className="login-form-section">Sua conta (administrador)</p>
                <label htmlFor="adminName">Seu nome</label>
                <input
                  id="adminName"
                  value={clinicForm.adminName}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminName: e.target.value })}
                  required
                />

                <label htmlFor="adminEmail">Seu e-mail</label>
                <input
                  id="adminEmail"
                  type="email"
                  value={clinicForm.adminEmail}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminEmail: e.target.value })}
                  autoComplete="email"
                  required
                />

                <label htmlFor="adminPassword">Senha</label>
                <input
                  id="adminPassword"
                  type="password"
                  value={clinicForm.adminPassword}
                  onChange={(e) => setClinicForm({ ...clinicForm, adminPassword: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" disabled={submitting}>
                  {submitting ? 'Cadastrando…' : 'Cadastrar clínica'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterStaff}>
                <p className="login-form-section">
                  {registerType === 'dentist' ? 'Vínculo profissional' : 'Vínculo com a clínica'}
                </p>
                <label htmlFor="staffClinicCnpj">CNPJ da clínica</label>
                <input
                  id="staffClinicCnpj"
                  placeholder="00.000.000/0000-00"
                  value={staffForm.clinicCnpj}
                  onChange={(e) => setStaffForm({ ...staffForm, clinicCnpj: e.target.value })}
                  required
                />
                <p className="login-hint">Peça esse número pra administração da sua clínica.</p>

                <p className="login-form-section">Seus dados</p>
                <label htmlFor="staffName">Nome completo</label>
                <input
                  id="staffName"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  required
                />

                {registerType === 'dentist' && (
                  <>
                    <label htmlFor="staffCro">CRO</label>
                    <input
                      id="staffCro"
                      placeholder="CRO-RS 12345"
                      value={staffForm.professionalLicense}
                      onChange={(e) => setStaffForm({ ...staffForm, professionalLicense: e.target.value })}
                      required
                    />
                  </>
                )}

                <label htmlFor="staffEmail">E-mail</label>
                <input
                  id="staffEmail"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  autoComplete="email"
                  required
                />

                <label htmlFor="staffPassword">Senha</label>
                <input
                  id="staffPassword"
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                {error && <p className="login-error" role="alert">{error}</p>}

                <button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Cadastrando…'
                    : registerType === 'dentist'
                      ? 'Cadastrar dentista'
                      : 'Cadastrar funcionário'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
