import { Routes, Route } from 'react-router-dom';
import { LoginPage } from '../pages/Login/LoginPage';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { PatientsPage } from '../pages/Patients/PatientsPage';
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

        {/* Pacientes: Lista e Cadastro vivem na mesma tela — o "Cadastro"
            do menu abre o Drawer via ?novo=1 em vez de trocar de rota. */}
        <Route path="/pacientes" element={<PatientsPage />} />

        {/* Atendimento: Prontuário / Odontograma / Plano de tratamento */}
        <Route
          path="/atendimento/prontuario"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <PlaceholderPage
                title="Prontuário"
                description="Histórico clínico, anamnese, evolução e documentos do paciente (módulo MedicalRecords, ainda stub no backend)."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/atendimento/odontograma"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <PlaceholderPage
                title="Odontograma"
                description="Mapa dental interativo — condição/procedimento por dente."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/atendimento/plano-tratamento"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DENTIST]}>
              <PlaceholderPage
                title="Plano de tratamento"
                description="Orçamento e acompanhamento dos procedimentos previstos (entidade TreatmentPlan já modelada no backend)."
              />
            </ProtectedRoute>
          }
        />

        {/* Financeiro: Caixa / Contas a receber / Contas a pagar */}
        <Route
          path="/financeiro/caixa"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage title="Caixa" description="Fluxo de caixa do dia/período." />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/contas-a-receber"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage
                title="Contas a receber"
                description="Recebíveis por paciente, parcelamentos e inadimplência."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/contas-a-pagar"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <PlaceholderPage
                title="Contas a pagar"
                description="Despesas e pagamentos a fornecedores."
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
              <PlaceholderPage title="Configurações" description="Dados da clínica, preferências do sistema e usuário." />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
