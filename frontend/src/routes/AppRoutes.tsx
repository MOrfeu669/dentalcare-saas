import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PlaceholderPage } from '../components/common/PlaceholderPage';
import { UserRole } from '../types';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/agenda"
          element={
            <PlaceholderPage
              title="Agenda"
              description="Visualização por profissional/sala com checagem automática de conflitos (backend já implementado em AppointmentsModule)."
            />
          }
        />
        <Route
          path="/pacientes"
          element={
            <PlaceholderPage
              title="Pacientes"
              description="Consome PatientsService (services/patients.service.ts) — falta montar a listagem e o formulário de cadastro."
            />
          }
        />
        <Route
          path="/prontuarios"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <PlaceholderPage
                title="Prontuários"
                description="Histórico clínico, odontograma e documentos do paciente."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage
                title="Financeiro"
                description="Contas a receber/pagar, fluxo de caixa e inadimplência."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estoque"
          element={
            <PlaceholderPage
              title="Estoque"
              description="Materiais, validade e alertas de estoque mínimo."
            />
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage
                title="Relatórios"
                description="Exportação em PDF/Excel com dados cruzados de faturamento, agenda e estoque."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage title="Configurações" description="Dados da clínica e preferências do sistema." />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
