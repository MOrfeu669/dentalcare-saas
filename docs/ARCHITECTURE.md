# Arquitetura — DentalCare SaaS

## Visão geral

Monólito modular. Um único deploy de back-end (NestJS), dividido em
módulos de domínio isolados. Módulos se comunicam **apenas** através
dos `*.service.ts` uns dos outros (nunca importando o `Repository` de
outro módulo diretamente) — isso é o que torna viável, no futuro,
extrair um módulo para um microsserviço próprio sem reescrever tudo.

O front-end (React) fala exclusivamente com a API REST do NestJS.
Nunca acessa o Postgres diretamente.

## Multi-tenancy

Estratégia: **shared database, shared schema**, com toda tabela de
negócio carregando uma coluna `clinic_id` (ver `TenantBaseEntity`).
É a abordagem mais simples de operar para um monólito modular e
suficiente para o volume esperado de clínicas — schema-per-tenant só
compensaria em escalas muito maiores, com o custo de complicar
migrations e conexões.

Ponto de atenção arquitetural: como o isolamento depende de todo
service filtrar por `clinic_id`, isso é reforçado estruturalmente por:
- `TenantRepository` (common/base) — wrapper que injeta `clinic_id` automaticamente;
- `@CurrentUser()` — todo controller recebe o usuário autenticado (com `clinicId`) já decodificado do JWT, nunca de um parâmetro da URL/body (evita que alguém troque o `clinicId` manualmente na requisição).

## Autenticação

JWT emitido pelo próprio NestJS (`AuthModule`). O banco é PostgreSQL
rodando localmente (sem dependência de nuvem) — a decisão de
segurança ("Segurança baseada em autenticação JWT") fica inteiramente
sob controle da aplicação, sem depender de um provedor de auth
externo. Arquivos do prontuário (radiografias, documentos) também
ficam em disco local (`STORAGE_LOCAL_PATH`), servidos por um endpoint
autenticado do próprio NestJS — não há bucket externo.

### Cadastro (onboarding)

Três fluxos, todos em `AuthModule` (fazem sentido junto do login
porque os dois cadastros de conta já devolvem token — login
automático ao final):

- **`POST /auth/register/clinic`** (público) — onboarding de uma
  clínica nova no SaaS. Cria a `Clinic` e o primeiro `User` (sempre
  `role: admin`) na mesma operação, via `ClinicsService.create()` +
  `UsersService.create()`. É o único jeito de um usuário `admin`
  nascer — não existe endpoint público pra criar admin direto.
- **`POST /auth/register/staff`** (público) — dentista ou
  recepcionista se vinculando a uma clínica **já existente**,
  identificada pelo CNPJ (`ClinicsService.findByCnpj()`). Aceita só
  `role: dentist | receptionist`; CRO é obrigatório quando `dentist`.
- Criar um `admin` adicional para uma clínica que já existe continua
  sendo feito pelo fluxo antigo, autenticado:
  `POST /users` (só admin logado pode chamar).

**Nota de segurança deliberada**: `register/staff` confia no CNPJ como
prova de vínculo com a clínica — qualquer pessoa que souber o CNPJ
(informação pouco sigilosa) consegue criar uma conta de
dentista/funcionário nela. Aceitável para MVP/desenvolvimento; antes
de produção o certo é trocar por um fluxo de convite (admin gera um
link/código de uso único) ou exigir aprovação do admin antes da conta
ficar ativa. Deixado assim de propósito, documentado aqui para não
ser confundido com descuido.

`JwtAuthGuard` é aplicado globalmente (`APP_GUARD`) — toda rota exige
token válido por padrão; endpoints públicos usam `@Public()`.
`RolesGuard`, também global, valida `@Roles(...)` por perfil
(Admin / Dentista / Recepcionista).

## Comunicação entre módulos

Dois mecanismos, escolhidos por caso:

1. **Chamada direta ao service** (síncrona) — quando o módulo A
   *precisa* do resultado de B para continuar (ex.: `AppointmentsService`
   valida conflito antes de salvar).
2. **Eventos** (`@nestjs/event-emitter`, assíncrono/desacoplado) —
   quando A só precisa *avisar* que algo aconteceu, sem saber quem
   reage (ex.: `appointment.created` → `NotificationsModule` agenda o
   lembrete; `treatment-plan-item.completed` → `FinancialModule` lança
   a conta a receber). Isso é o que permite implementar Financeiro,
   Estoque e Notificações depois, sem alterar código já pronto de
   Appointments/TreatmentPlans.

## Agenda inteligente

`AppointmentConflictCheckerService` centraliza a regra de não permitir
dois atendimentos sobrepostos para o mesmo dentista **ou** para a
mesma sala. Isolado do `AppointmentsService` de propósito, para poder
ser reutilizado depois em "sugestão de horários livres" sem duplicar a
lógica de sobreposição de intervalos.

## Financeiro integrado — cadeia de eventos (Treatment Plans → Financial → Payments)

Esta é a demonstração mais completa do princípio "módulos se comunicam
por eventos, não por import direto" descrito acima. Fluxo real,
testado de ponta a ponta:

1. `TreatmentPlansService.completeItem()` marca o item como concluído
   e emite `treatment-plan-item.completed` com `{ clinicId, patientId, item }`.
2. `FinancialService` (método `@OnEvent`, não um listener separado)
   escuta esse evento e cria um `Receivable` automaticamente —
   descrição e valor vêm do próprio item, vencimento padrão de 30 dias.
   **`TreatmentPlansModule` não importa `FinancialModule` nem sabe que
   ele existe.**
3. `PaymentsService.registerPayment()` chama
   `FinancialService.applyPayment()` (esse sim, injeção direta —
   Payments *precisa* confirmar que o valor bate antes de gravar o
   pagamento, então é síncrono de propósito). O `Receivable` vai de
   `pending` → `partially_paid` → `paid` conforme os pagamentos
   chegam; pagar mais do que o saldo devedor é rejeitado.
4. `PaymentsService` emite `payment.received` — ninguém escuta ainda,
   é o gancho pra uma futura tela de "recibo automático" ou integração
   com emissão de nota fiscal.

## Consumo automático de estoque por procedimento

Fechado. `ProcedureMaterial` (a "receita") vive no `InventoryModule`,
não em `Procedures` — decisão de propósito para evitar dependência
circular: Inventory precisa validar que o material existe
(`MaterialsService`, já é dele) e que o procedimento existe
(`ProceduresService`, importado de `ProceduresModule` — só nessa
direção). Se a receita morasse em Procedures, o módulo precisaria
importar Inventory de volta pra validar o material, fechando um ciclo.

**Relação decidida**: 1 procedimento → N materiais (várias linhas de
`ProcedureMaterial` com o mesmo `procedureId`); um material pode
aparecer na receita de vários procedimentos diferentes. Índice único
em `(clinic_id, procedure_id, material_id)` — mesmo material não entra
duas vezes na receita do mesmo procedimento (tem que dar `PATCH` na
quantidade em vez de duplicar).

API (`/procedures/:procedureId/materials`, admin cria/edita/remove,
admin+dentista listam): `POST` valida que o material existe e que a
quantidade é positiva antes de gravar (`404` se não existir, `400` se
quantidade ≤ 0, `409` se o material já estiver na receita); `PATCH`
só a quantidade; `DELETE` remove o item.

**A ponte em si**: `ProcedureConsumptionService`, escutando o mesmo
`treatment-plan-item.completed` que o `FinancialModule` já escuta —
outro módulo reagindo ao mesmo evento sem os dois saberem um do outro.
Busca a receita do procedimento concluído e chama
`StockMovementsService.register()` uma vez por material — reaproveita
a mesma transação atômica e o mesmo evento de estoque baixo já usados
pelas movimentações manuais, nenhuma lógica duplicada. Testado de
ponta a ponta: material com saldo 50, receita de 2 unidades, item
concluído → saldo cai pra 48 sozinho, com o `StockMovement` gerado
apontando o `treatmentPlanItemId` de origem.

Se faltar saldo pra um material da receita, essa falha é isolada por
`try/catch` por item — não trava o consumo dos outros materiais nem o
fluxo clínico (o atendimento já aconteceu), só fica registrada como
aviso no log. Procedimento sem receita cadastrada não é erro, só não
consome nada.

**Testes** (`npm test` / `npm run test:e2e`):
- Unitário (`procedure-consumption.service.spec.ts`) — a regra de
  consumo isolada, com `ProcedureMaterialsService`/`StockMovementsService`
  mockados: nenhuma chamada quando a receita está vazia, uma
  `StockMovementsService.register()` por material com os parâmetros
  certos, e a falha de um material não impede o consumo dos demais
  (mock rejeitando o primeiro, resolvendo o segundo).
- Integração (`test/inventory-consumption.e2e-spec.ts`) — sobe
  `InventoryModule` + `ProceduresModule` de verdade contra o Postgres
  local (mesmas credenciais do `.env` de dev; num CI isso deveria
  apontar pra um banco efêmero dedicado a testes), emite o evento via
  `EventEmitter2.emitAsync()` e confere no banco: saldo caindo de 10
  para 7 num cenário normal, e saldo **inalterado** (transação
  revertida) quando a receita pede mais do que existe em estoque.
  `clinicId` usado é um UUID solto — não precisa existir uma `Clinic`
  real porque `clinic_id` não é uma FK de verdade (ver Multi-tenancy).

## Prontuário eletrônico (Medical Records)

Quatro sub-recursos, cada um com seu próprio service/controller — sem
um único "God controller":

- **Anamnese** (`AnamnesisRecord`): registro único por paciente,
  `PUT` faz upsert (cria se não existir, mescla campos se já existir).
- **Evolução** (`ClinicalNote`): só `POST` + `GET` — propositalmente
  sem `update`/`delete` no service, é histórico clínico.
  `dentistId` sempre vem do token (`@CurrentUser()`), nunca do body.
- **Odontograma** (`Odontogram`): um registro por paciente, `teeth`
  é um jsonb indexado por número do dente (notação FDI);
  `PUT .../teeth/:toothNumber` atualiza um dente por vez.
- **Arquivos clínicos** (`ClinicalFile`): upload via `Multer`
  (`diskStorage`, nome gerado no servidor — nunca o nome original do
  arquivo, evita path traversal), salvo em `STORAGE_LOCAL_PATH`
  (`backend/uploads/`, versionado vazio via `.gitkeep`). Download só
  por endpoint autenticado (`GET .../files/:id/download`), nunca uma
  pasta estática pública — são documentos clínicos sensíveis.

`MedicalRecordsService.getFullHistory()` agrega os quatro acima **+**
os planos de tratamento do paciente (via `TreatmentPlansService`) numa
chamada só — `GET /medical-records/patient/:patientId/summary` — pra
alimentar a tela de Prontuário sem o front precisar fazer 5 requests.

## Dashboard e Reports

Nenhum dos dois tem entidade/repository próprio — são só camadas de
agregação por cima dos services de domínio já existentes, na linha do
que o resto da arquitetura já vinha fazendo.

**Dashboard** (`GET /dashboard/summary`) — os 8 cards definidos pelo
usuário, cada um mapeado para um método específico (a maioria novo,
adicionado nos services de domínio nesta etapa):

| Card | Fonte |
|---|---|
| Consultas de hoje | `AppointmentsService.getDaySchedule()` (já existia) |
| Pacientes aguardando | `AppointmentsService.findWaitingNow()` — `CONFIRMED` e horário já chegou |
| Próxima consulta | `AppointmentsService.findNext()` |
| Confirmações pendentes | `AppointmentsService.findPendingConfirmations()` — `SCHEDULED` nas próximas 48h |
| Avisos importantes | feed combinando estoque crítico + contas vencidas + notificação com falha de envio |
| Estoque crítico | `MaterialsService.findLowStock()` (já existia) |
| Recebimentos do dia | `PaymentsService.findByDateRange()` (novo) |
| Procedimentos realizados hoje | `TreatmentPlansService.findItemsCompletedInRange()` (novo) |

Pra "Procedimentos realizados hoje" funcionar, `TreatmentPlanItem`
ganhou um campo `completedAt` (preenchido em `completeItem()`) — como
ele mora dentro do jsonb `items`, o filtro por data é feito em memória
depois de buscar os planos da clínica; aceitável no volume de uma
clínica, mas é o primeiro candidato a virar tabela própria se o
histórico crescer muito.

**Reports** (`GET /reports/{financial,agenda,inventory,patients,procedures}`,
`?from=&to=`, admin-only) — os 5 relatórios do escopo original.
`revenueByProcedure` e `revenueByProfessional` (dentro de
`/reports/procedures`) reaproveitam o mesmo `findItemsCompletedInRange`
do Dashboard e resolvem nome de procedimento/dentista via
`ProceduresService`/`UsersService` antes de devolver — sem isso o
relatório seria só uma lista de UUIDs. Retorna JSON estruturado;
exportação pra PDF/Excel é a única parte do escopo original de
Reports que ainda não foi implementada (fica registrado como TODO no
controller — a agregação de dados não precisa mudar nada pra isso,
é só uma camada de serialização por cima).

## Notifications

Fila própria (`NotificationLog`), não dependente de nenhuma API
externa pra existir — importante porque este ambiente de
desenvolvimento não tem (nem teria como testar) credenciais reais de
WhatsApp Business API, SMS ou SMTP.

**Provider plugável**: toda a lógica de "pra quem, quando, o quê"
enviar está no `NotificationsService`; o *como* enviar de fato é
isolado atrás da interface `NotificationSender`
(`senders/notification-sender.interface.ts`). Hoje só existe
`ConsoleNotificationSender` (loga a mensagem, sempre retorna sucesso).
Pra produção: implementar `WhatsAppNotificationSender` /
`SmtpNotificationSender` (usando as variáveis `WHATSAPP_API_*` /
`SMTP_*` já reservadas no `.env.example`) e trocar uma linha em
`notifications.module.ts` — nenhum outro arquivo muda.

**Dois fluxos, testados de ponta a ponta:**

1. **Lembrete de consulta** — `@OnEvent('appointment.created')` calcula
   o horário de envio (24h antes; se a consulta já estiver a menos de
   24h, agenda pra "agora") e só *enfileira* (`status: pending`).
   Quem processa a fila é `processPendingReminders()`, rodando a cada
   minuto via `@Cron` (também disparável sob demanda em
   `POST /notifications/process-pending`, útil pra forçar o envio sem
   esperar). Ao enviar com sucesso, marca
   `Appointment.reminderSentAt` — por isso `AppointmentsService` ganhou
   o método `markReminderSent()`.
2. **Alerta de estoque baixo** — `@OnEvent('inventory.low-stock')`
   dispara **na hora** (não entra na fila do cron: uma situação
   operacional não deveria esperar), buscando os usuários `ADMIN` da
   clínica via `UsersService` e enviando um e-mail pra cada um.

**"Registrar quem confirmou/cancelou"**: `POST /notifications/:id/reply`
simula o webhook que um provedor real mandaria quando o paciente
responde à mensagem. Ao registrar `confirmed`, chama
`AppointmentsService.confirm()`; ao registrar `cancelled`, chama
`AppointmentsService.cancel()` — o `NotificationsModule` é quem
depende do `AppointmentsModule` aqui (import direto, não evento),
porque essa ação precisa de confirmação síncrona antes de responder a
requisição.

## Frontend (SPA)

Decisões de navegação e estrutura definidas para o front-end:

- **Sidebar fixa, dois níveis, sub-itens sempre visíveis** — a navegação
  está centralizada em `AppShell.tsx` com os principais módulos do
  sistema: Dashboard, Agenda, Pacientes, Atendimento, Financeiro,
  Estoque, Relatórios e Configurações.
- **Drawer para ações rápidas** — a tela de pacientes usa um drawer para
  cadastro inline, sem interromper o fluxo de listagem.
- **Evitar perda de posição** — o `<main>` do shell remonta com base na
  rota atual, preservando o contexto da tela quando um drawer é aberto
  ou fechado.
- **Login/Cadastro** — a tela de autenticação já suporta os fluxos de
  login e onboarding de clínica/dentista/funcionário.
- **Páginas reais conectadas ao backend** — a implementação já incluiu
  telas práticas para Agenda, Prontuário, Planos de tratamento, Estoque,
  Caixa, Contas a receber, Contas a pagar, Relatórios e Configurações,
  todas consumindo os endpoints do backend.

### Estado atual do frontend

O frontend já saiu do estágio de placeholders em boa parte das áreas
principais. A navegação está funcional e as telas principais já fazem
requisições reais à API, incluindo Dashboard, Agenda, Prontuário,
Planos de tratamento, Estoque, Financeiro, Relatórios e Configurações.

### O que ainda falta no frontend

- Refinar as telas com tabelas, filtros e traduções visuais mais
  cuidadas.
- Melhorar os estados de carregamento e erro em páginas que ainda têm
  uma camada mais simples de apresentação.
- Completar a camada de Settings/Audit com dados reais e interação mais
  completa.

## O que foi implementado

A implementação de negócio do escopo original já está consolidada e
funcional. Os módulos principais foram entregues com integração real ao
backend e, em boa parte do frontend, com telas já consumindo a API:

1. ~~Dentists (perfil profissional) e Rooms (CRUD simples)~~ ✅ feito e testado.
2. ~~Procedures (catálogo) → Treatment Plans (services/controller)~~ ✅ feito e testado.
3. ~~Medical Records (anamnese, evolução, odontograma, upload de arquivos)~~ ✅ feito e testado.
4. ~~Inventory → Financial → Payments~~ ✅ feito e testado — inclusive a cadeia
   completa: concluir item de plano → nasce conta a receber sozinha →
   pagamento parcial → pagamento total → status `paid`.
5. ~~Notifications (WhatsApp/SMS/e-mail)~~ ✅ feito e testado — envio real
   fica atrás de um provider plugável (hoje só "log-only").
6. ~~Dashboard e Reports~~ ✅ feito e testado — todos os 8 cards do
   Dashboard e os 5 relatórios foram implementados com dados reais.

## O que ainda falta

O sistema já está com uma base sólida, mas ainda há melhorias de
produto, operacionalidade e maturidade técnica:

- Implementar o fluxo de convite/aprovação para dentistas e
  recepcionistas, em vez de depender apenas do CNPJ.
- Trocar o sender de notificações por uma implementação real quando
  houver credenciais externas.
- Implementar exportação de relatórios para PDF/Excel.
- Completar módulos transversais de Settings e Audit.

## Pendências abertas

- `TreatmentPlansService.completeItem` já emite o evento de conclusão,
  mas a automação de consumo de estoque por procedimento ainda depende
  da receita `ProcedureMaterial` estar completamente integrada ao fluxo.
- Ao criar uma consulta ligada a um item do plano, o item ainda não é
  marcado automaticamente como `SCHEDULED`.
- `getWorkingHoursForDay()` do módulo de dentistas ainda não é
  consultado pelo `AppointmentConflictCheckerService`.
- `NOTIFICATION_SENDER` segue com `ConsoleNotificationSender`; isso é
  suficiente para desenvolvimento, mas não para produção.
- `ReportsController` ainda retorna JSON; a exportação para PDF/Excel
  é uma camada posterior à agregação.
- Itens de plano concluídos antes da adição do campo `completedAt`
  podem não aparecer em relatórios agregados por data histórica.

## Sugestão do próximo passo

O próximo passo mais valioso é evoluir a aplicação em direção a uma
experiência mais madura e próxima de uso real: polir as telas do
frontend, fechar as pendências de notificações e relatórios e, em
seguida, completar Settings/Audit para uma versão mais profissional.

## Banco de dados

Migration inicial gerada e **testada de ponta a ponta** (subida e
revertida) em um Postgres local: `backend/src/database/migrations/*-InitialSchema.ts`.
Cria `clinics`, `users`, `patients`, `rooms`, `appointments` e
`treatment_plans`, com enums, índices (`clinic_id`, e os índices
compostos usados pelo `AppointmentConflictCheckerService`) e as FKs já
existentes (`users.clinic_id`, `appointments.room_id`).

A migration cria explicitamente a extensão `uuid-ossp`
(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`) antes de qualquer
tabela — necessário em qualquer instalação nova de Postgres, já que
não estamos mais em um provedor gerenciado que a habilita por padrão.

Para gerar a próxima migration (depois de implementar os módulos
stub, na ordem sugerida acima):
```bash
cd backend
npm run migration:generate -- src/database/migrations/NomeDaMudanca
npm run migration:run
```

## Seeds (dados de exemplo)

`backend/src/database/seeds/run-seeds.ts` — **testado de ponta a
ponta**, inclusive idempotência (rodar duas vezes não duplica nada;
cada entidade é checada por sua chave natural antes de inserir: CNPJ,
e-mail, nome da sala, CPF).

Popula 1 clínica, 4 usuários (1 admin, 2 dentistas, 1 recepcionista),
3 salas e 3 pacientes. Os dados ficam em `seed-data.ts`, separados da
lógica de inserção, para facilitar editar/adicionar registros sem
mexer no script.

```bash
cd backend
npm run seed
```

Login de teste após rodar: `admin@odontovida.com.br` / `Senha123!`
(hash bcrypt validado manualmente contra a senha em texto puro).
