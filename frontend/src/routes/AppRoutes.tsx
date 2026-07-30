import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { PatientsPage } from '../pages/Patients/PatientsPage';
import { AgendaPage } from '../pages/Agenda/AgendaPage';
import { MedicalRecordsPage } from '../pages/MedicalRecords/MedicalRecordsPage';
import { TreatmentPlansPage } from '../pages/TreatmentPlans/TreatmentPlansPage';
import { InventoryPage } from '../pages/Inventory/InventoryPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { CashFlowPage } from '../pages/Financial/CashFlowPage';
import { ReceivablesPage } from '../pages/Financial/ReceivablesPage';
import { PayablesPage } from '../pages/Financial/PayablesPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
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

        <Route path="/agenda" element={<AgendaPage />} />

        {/* Pacientes: Lista e Cadastro vivem na mesma tela — o "Cadastro"
            do menu abre o Drawer via ?novo=1 em vez de trocar de rota. */}
        <Route path="/pacientes" element={<PatientsPage />} />

        {/* Atendimento: Prontuário / Odontograma / Plano de tratamento */}
        <Route
          path="/atendimento/prontuario"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/atendimento/odontograma"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/atendimento/plano-tratamento"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <TreatmentPlansPage />
            </ProtectedRoute>
          }
        />

        {/* Financeiro: Caixa / Contas a receber / Contas a pagar */}
        <Route
          path="/financeiro/caixa"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.RECEPTIONIST]}>
              <CashFlowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/contas-a-receber"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.RECEPTIONIST]}>
              <ReceivablesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/contas-a-pagar"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.RECEPTIONIST]}>
              <PayablesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/estoque" element={<InventoryPage />} />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
