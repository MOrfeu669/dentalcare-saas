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

Ainda não fechado — falta a "receita" de consumo:
`procedures/entities/procedure-material.entity.ts` (TODO) associaria
cada procedimento aos materiais/quantidades padrão. Com isso pronto,
`InventoryModule` escutaria o mesmo `treatment-plan-item.completed`
que o Financial já escuta, e chamaria
`StockMovementsService.register()` para dar baixa automática — a
infraestrutura de estoque (`Material`, `StockMovement`, atualização
atômica de saldo em transação) já está pronta, só falta essa ponte.

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

## Frontend (SPA)

Decisões de navegação definidas para o front-end:

- **Sidebar fixa, dois níveis, sub-itens sempre visíveis** — nada de
  acordeão escondendo funcionalidade atrás de um clique extra. O mapa
  completo está em `AppShell.tsx` (`NAV_ITEMS`): Dashboard, Agenda,
  Pacientes (Lista/Cadastro), Atendimento (Prontuário/Odontograma/Plano
  de tratamento), Financeiro (Caixa/Contas a receber/Contas a pagar),
  Estoque, Relatórios, Configurações.
- **Drawer em vez de navegação completa** quando a ação é rápida e a
  pessoa não deveria perder onde estava — ex.: cadastrar paciente sem
  sair da lista. Componente genérico em `components/common/Drawer.tsx`,
  usado como referência em `pages/Patients/PatientsPage.tsx` (Lista +
  Drawer de Cadastro na mesma tela, aberto via `?novo=1` — assim
  sobrevive a um refresh e o link do menu "Pacientes → Cadastro" pode
  apontar direto pra essa URL).
- **Evitar perda de posição**: o `<main>` do `AppShell` usa
  `key={location.pathname}` pra remontar só quando a *rota* muda, não
  quando um Drawer abre/fecha via query param — o Drawer é uma camada
  por cima, a tela de trás não perde filtro/scroll.
- **Dashboard**: componentes ainda não definidos pelo usuário — o que
  existe hoje (`DashboardPage.tsx`) é só um placeholder com KPIs
  mockados pra não deixar a rota `/` vazia; vai ser refeito quando
  a lista de indicadores for definida.

Páginas reais (consomem a API de verdade): Login, Dashboard (mock),
Pacientes. As demais (Agenda, Atendimento/\*, Financeiro/\*, Estoque,
Relatórios, Configurações) são `PlaceholderPage` — a rota e a proteção
por role já existem, falta só trocar pelo componente real.

## O que falta (por módulo)

Cada stub em `backend/src/modules/*/*.module.ts` tem comentários
`// TODO` descrevendo exatamente as entidades e regras a implementar,
na ordem sugerida de dependência:

1. ~~Dentists (perfil profissional) e Rooms (CRUD simples)~~ ✅ feito e testado.
2. ~~Procedures (catálogo) → Treatment Plans (services/controller)~~ ✅ feito e testado.
3. ~~Medical Records (anamnese, evolução, odontograma, upload de arquivos)~~ ✅ feito e testado.
4. ~~Inventory → Financial → Payments~~ ✅ feito e testado — inclusive a cadeia
   completa: concluir item de plano → nasce conta a receber sozinha →
   pagamento parcial → pagamento total → status `paid`.
5. Notifications (integrações externas: WhatsApp/SMS/e-mail)
6. Dashboard e Reports (agregam os módulos acima — fazer por último)
7. Settings e Audit (transversais, baixa prioridade funcional)

Pendências abertas:
- `TreatmentPlansService.completeItem` já emite `treatment-plan-item.completed`
  e o `FinancialModule` já escuta — mas o `InventoryModule` ainda não
  (falta a "receita" `ProcedureMaterial` ligando procedimento a
  materiais consumidos, requisito "consumo automático por procedimento").
- Ao criar uma consulta vinculada a um item do plano (`Appointment.treatmentPlanId`),
  ninguém ainda marca o item como `SCHEDULED` automaticamente.
- `getWorkingHoursForDay()` (Dentists) ainda não é consultado pelo
  `AppointmentConflictCheckerService`.
- `inventory.low-stock` é emitido a cada movimentação que cruza o
  mínimo, mas ninguém escuta ainda (Notifications é stub).

Pendência aberta em Dentists: `getWorkingHoursForDay()` já existe no
service mas ainda não é consultado pelo
`AppointmentConflictCheckerService` — hoje a agenda bloqueia
sobreposição de horário, mas ainda aceita agendar fora do expediente
do profissional.

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
