import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import './app-shell.css';

interface NavChild {
  to: string;
  label: string;
}

interface NavItem {
  to?: string; // presente quando não tem sub-itens (ex.: Dashboard, Agenda, Estoque)
  label: string;
  roles?: UserRole[];
  children?: NavChild[];
}

/**
 * Mapa de navegação da SPA. Decisão de produto: sub-itens ficam
 * sempre visíveis (não é um acordeão que precisa ser aberto) —
 * "não esconder funcionalidades, cada campo deve deixar suas
 * funcionalidades à mostra".
 */
const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/agenda', label: 'Agenda' },
  {
    label: 'Pacientes',
    children: [
      { to: '/pacientes', label: 'Lista' },
      { to: '/pacientes?novo=1', label: 'Cadastro' },
    ],
  },
  {
    label: 'Atendimento',
    roles: [UserRole.ADMIN, UserRole.DENTIST],
    children: [
      { to: '/atendimento/prontuario', label: 'Prontuário' },
      { to: '/atendimento/odontograma', label: 'Odontograma' },
      { to: '/atendimento/plano-tratamento', label: 'Plano de tratamento' },
    ],
  },
  {
    label: 'Financeiro',
    roles: [UserRole.ADMIN],
    children: [
      { to: '/financeiro/caixa', label: 'Caixa' },
      { to: '/financeiro/contas-a-receber', label: 'Contas a receber' },
      { to: '/financeiro/contas-a-pagar', label: 'Contas a pagar' },
    ],
  },
  { to: '/estoque', label: 'Estoque' },
  { to: '/relatorios', label: 'Relatórios', roles: [UserRole.ADMIN] },
  { to: '/configuracoes', label: 'Configurações', roles: [UserRole.ADMIN] },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">DentalCare</div>
        <nav>
          {visibleItems.map((item) =>
            item.children ? (
              <div className="shell-nav-group" key={item.label}>
                <span className="shell-nav-group-label">{item.label}</span>
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) =>
                      `shell-nav-link shell-nav-link--child${isActive ? ' active' : ''}`
                    }
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to!}
                end={item.to === '/'}
                className={({ isActive }) => `shell-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ),
          )}
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
        {/* key força remount ao trocar de rota — evita estado (ex.: filtros)
            vazando de uma tela pra outra sem querer */}
        <main className="shell-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
