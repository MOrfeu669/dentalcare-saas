import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import './app-shell.css';

const NAV_ITEMS: { to: string; label: string; roles?: UserRole[] }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/prontuarios', label: 'Prontuários', roles: [UserRole.ADMIN, UserRole.DENTIST] },
  { to: '/financeiro', label: 'Financeiro', roles: [UserRole.ADMIN] },
  { to: '/estoque', label: 'Estoque' },
  { to: '/relatorios', label: 'Relatórios', roles: [UserRole.ADMIN] },
  { to: '/configuracoes', label: 'Configurações', roles: [UserRole.ADMIN] },
];

export function AppShell() {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">DentalCare</div>
        <nav>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <span className="shell-clinic">{user?.clinicName ?? 'Clínica'}</span>
          <div className="shell-user">
            <span>{user?.name}</span>
            <button onClick={logout}>Sair</button>
          </div>
        </header>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
