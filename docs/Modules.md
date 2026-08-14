# Módulos do Backend

Este projeto usa um monólito modular, em que cada módulo concentra uma parte do domínio e se comunica com os demais por serviços e eventos, em vez de acessar diretamente os repositórios de outras áreas. A regra central da aplicação é o isolamento por tenant: toda operação deve respeitar o `clinicId` do usuário logado e recuperar apenas dados da clínica correta. Isso é reforçado em vários serviços, como o fluxo de autenticação e os módulos de agendamento, financeiro e estoque.

## AuditModule
O módulo de auditoria registra ações do sistema e fornece um histórico de eventos importantes para rastreabilidade. Ele depende da infraestrutura de banco e de um serviço de log de auditoria, mas não deve acoplar regras de negócio de outros módulos. Sua comunicação é principalmente síncrona, via serviço de persistência e chamada de gravação em tabelas de log; em alguns pontos pode ser usado como apoio transversal para verificar quem alterou o que e quando.

## AuthModule
O módulo de autenticação cuida do login, da validação de JWT e da autorização por perfil e papel. Ele depende de `UsersModule` e `ClinicsModule`, consumindo `UsersService` e `ClinicsService` em vez de acessar repositórios diretamente. A comunicação entre módulos é síncrona: o serviço de autenticação valida usuário e clínica, gera o token e deixa as rotas protegidas por guards globais. Esse é um dos módulos de maior importância para a regra de negócio do sistema, porque a autenticação define o tenant a partir do contexto do usuário e restringe o acesso à clínica correta.

## UsersModule
O módulo de usuários gerencia dados de pessoas que acessam o sistema, como perfil, e-mail, senha e permissões. Ele depende apenas do seu próprio repositório e é consumido por outros módulos, especialmente `AuthModule`, `DentistsModule` e `TreatmentPlansModule`. A comunicação é direta por injeção de `UsersService` e por validações de papel, como garantir que um dentista realmente tenha o perfil de dentista antes de ser associado a um tratamento ou agendamento.

## ClinicsModule
O módulo de clínicas representa a organização/tenant e suas configurações básicas. Ele depende de seu próprio repositório e é consumido por autenticação e por outros serviços quando é necessário validar que a clínica está ativa e que os dados pertencem ao tenant correto. A comunicação é síncrona por service, com checagem de `clinicId` em consultas e cadastro. Ele é a base do isolamento multi-tenant, pois toda operação da clínica passa por essa fronteira.

## PatientsModule
O módulo de pacientes cuida do cadastro, atualização e consulta de pacientes da clínica. Ele depende de seu próprio repositório e é usado por módulos como `AppointmentsModule`, `TreatmentPlansModule` e `MedicalRecordsModule`. A comunicação é direta via `PatientsService`, como em `findOne(clinicId, id)` e `getBasicInfo`, sendo uma API pública para validar que o paciente pertence à clínica e obter dados básicos para notificações, prontuário e tratamento.

## DentistsModule
O módulo de dentistas centraliza o perfil profissional e a associação com usuários. Ele depende de `UsersModule` para garantir que o usuário que será utilizado como dentista tenha o papel adequado. A comunicação é síncrona por serviço, e o módulo expõe operações como consulta de perfil e disponibilidade, que são consumidas por `AppointmentsModule` e `TreatmentPlansModule` para verificar conflito de agenda e validar o dentista correto do tenant.

## ProceduresModule
O módulo de procedimentos mantém a base de serviços/procedimentos disponíveis na clínica, incluindo nome e valor padrão. Ele depende apenas do seu próprio repositório e é consumido por `TreatmentPlansModule` e `InventoryModule`. A comunicação é síncrona por service: o plano de tratamento busca o procedimento para preencher descrição e valor estimado, e o estoque usa a receita do procedimento para consumir materiais no momento da conclusão do item.

## AppointmentsModule
O módulo de agendamentos é o núcleo da agenda clínica, responsável por criar consultas, validar conflitos de horário, permitir reprogramação e cancelar ou confirmar atendimentos. Ele depende de `DentistsModule`, `PatientsModule` e `RoomsService` internamente, e sua comunicação principal é síncrona por service para validações e persistência. Além disso, ele emite eventos assíncronos como `appointment.created` quando uma consulta real é criada, permitindo que `NotificationsModule` agenda lembretes sem acoplar diretamente o agendamento às notificações. Esse módulo também sobrescreve regras de recorrência e retorno automático, sem quebrar o fluxo principal da consulta.

## MedicalRecordsModule
O módulo de prontuários cuida da parte clínica do atendimento: anamnese, notas, odontograma e arquivos. Ele depende de `PatientsModule` e `TreatmentPlansModule` para contextualizar o paciente e o plano de tratamento no qual o atendimento está inserido. A comunicação é direta por serviços do módulo e por consultas de contexto, não por eventos; o foco é a descrição e a persistência do histórico clínico, preservando o vínculo com o paciente e a clínica. Esse módulo se comunica pouco com outros domínios e está mais ligado à operação clínica do que à regra de gestão do sistema.

## TreatmentPlansModule
O módulo de planos de tratamento controla a criação, edição e evolução dos planos do paciente. Ele depende de `PatientsModule`, `UsersModule` e `ProceduresModule`, usando serviços desses módulos para validar que o paciente, o dentista e o procedimento pertencem à mesma clínica. Sua comunicação principal é síncrona por service, mas também emite eventos assíncronos para integração com outros domínios, como `treatment-plan-item.completed`. Esse evento é consumido por `FinancialModule` para criar contas a receber e por `InventoryModule` para consumir materiais automaticamente, mostrando a arquitetura de desacoplamento do sistema. O módulo também define regras de transição de status do plano e dos itens para evitar saltos de processo sem validação.

## InventoryModule
O módulo de inventário cuida da gestão de materiais e movimentos de estoque, incluindo entrada, saída, ajuste e controle do saldo em estoque. Ele depende de `ProceduresModule` para montar a receita do procedimento e, em alguns casos, recebe eventos de conclusão de item do plano para dar baixa automática. Sua comunicação é síncrona por `StockMovementsService` no fluxo normal de movimentação e assíncrona por evento `inventory.low-stock`, que é ouvido por `NotificationsModule` para alertar administradores. A regra mais importante aqui é a transação atômica: o saldo e o histórico de movimentação são atualizados na mesma transação para não gerar inconsistência no estoque.

## FinancialModule
O módulo financeiro gerencia contas a receber e a pagar, além de cálculo de fluxo de caixa e pendências. Ele depende de seu próprio repositório e é consumido por `PaymentsModule`, que aplica pagamentos à conta sem mexer diretamente no repository de recebíveis. A comunicação com o restante do sistema é por serviço e por evento: quando `TreatmentPlansModule` conclui um item, `FinancialModule` escuta `treatment-plan-item.completed` e cria automaticamente a conta a receber. Essa integração mantém o módulo financeiro blindado de detalhes do domínio clínico.

## PaymentsModule
O módulo de pagamentos registra o recebimento de valores e conecta o fluxo financeiro com as contas a receber. Ele depende de `FinancialModule` e usa `FinancialService.applyPayment()` para validar o valor e atualizar o status da conta antes de persistir o pagamento. A comunicação é síncrona por service e também por evento `payment.received`, que pode ser usado por outros módulos no futuro. Esse módulo representa a camada de execução do pagamento e garante que o valor pago não exceda o débito da conta da clínica.

## NotificationsModule
O módulo de notificações trata de lembretes de consulta, alertas de estoque baixo e registro de resposta do paciente. Ele depende de `AppointmentsModule`, `PatientsModule` e `UsersModule`, e a comunicação é por eventos: `appointment.created` dispara o agendamento do lembrete, e `inventory.low-stock` dispara alerta para administradores. A lógica também faz uso de cron jobs para processar lembretes pendentes em tempo real, e esse módulo é responsável por transformar eventos de negócio em comunicações para paciente ou equipe. A vantagem do desenho é que `AppointmentsModule` e `InventoryModule` não precisam conhecer como a mensagem será entregue.

## SuppliersModule
O módulo de fornecedores cuida do cadastro e manutenção de fornecedores e ligação com compras e materiais. Ele depende do seu próprio repositório e funciona como apoio operacional para a área de inventário e financeiro. A comunicação é principalmente síncrona por service, sendo usado para registrar origem das compras e manter o vínculo entre material e fornecedor no contexto da clínica.

## DashboardModule
O módulo do dashboard agrega indicadores operacionais para que a clínica acompanhe o estado atual da operação. Ele depende de vários outros módulos, como `AppointmentsModule`, `InventoryModule`, `FinancialModule`, `PaymentsModule`, `TreatmentPlansModule` e `NotificationsModule`, e a comunicação é um misto de chamadas diretas de serviço para consulta de dados e leitura de eventos de domínio para compor as telas. Em termos de regra de negócio, ele é mais agregador do que transacional: ele consolidar dados e expor visão analítica da operação da clínica.

## ReportsModule
O módulo de relatórios reúne dados de agenda, financeiro, estoque, pacientes, tratamentos e usuários para montar relatórios de gestão. Ele depende de vários módulos do backend para compor o relatório e usa chamadas diretas de serviços para leitura de dados por período. A comunicação é síncrona e agregadora, visto que esse módulo não altera regras de negócio e sim organiza informações para análise de desempenho, faturamento e evolução clínica.

## SettingsModule
O módulo de configurações guarda preferências da clínica e parâmetros operacionais que afetam o uso do sistema. Ele depende de seu próprio repositório e é usado por outros módulos quando precisam ler parâmetros de comportamento, como regras de notificação, valores padrão ou ajustes gerais da clínica. A comunicação é direta por service e funciona como suporte de configuração da operação.

## SuppliersModule
O módulo de fornecedores cuida do registro de fornecedores, dados cadastrais e relacionamento com processos de compra e material. Ele depende do seu próprio repositório e é utilizado principalmente por `InventoryModule` para alinhar a origem dos materiais de uma clínica. A comunicação é síncrona por service, sem eventos de negócio relevantes até o momento, e serve como base operacional para compras e manutenção de insumos.

## Resumo da arquitetura
Os módulos do backend obedecem a um padrão claro: cada área possui sua própria entidade, seu próprio serviço e sua própria persistência, e a troca de informações entre domínios ocorre por injeção de serviço ou por eventos assíncronos. A regra mais importante para o time é manter o isolamento do tenant e evitar que um módulo acesse o banco diretamente de outro módulo. Isso torna o sistema previsível, mantém a integridade da clínica e facilita a evolução do código quando novas regras e novos módulos forem adicionados.
