# Arquitetura — DentalCare SaaS

## Visão geral

Monólito modular. Um único deploy de back-end (NestJS), dividido em
módulos de domínio isolados. Módulos se comunicam **apenas** através
dos `*.service.ts` uns dos outros (nunca importando o `Repository` de
outro módulo diretamente) — isso é o que torna viável, no futuro,
extrair um módulo para um microsserviço próprio sem reescrever tudo.

O front-end (React) fala exclusivamente com a API REST do NestJS.
Nunca acessa o Postgres/Supabase diretamente.

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

JWT emitido pelo próprio NestJS (`AuthModule`), não pelo Supabase Auth.
O Supabase, neste projeto, é usado como Postgres gerenciado (e, no
futuro, Storage para radiografias/documentos) — a decisão de segurança
("Segurança baseada em autenticação JWT") fica inteiramente sob
controle da aplicação. Se no futuro fizer sentido usar o Supabase Auth
nativo (ex.: para ganhar login social), isso troca apenas o
`AuthModule`, sem impacto nos demais módulos.

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

## Consumo automático de estoque por procedimento

Ainda não implementado (módulo `inventory` é stub), mas a ligação já
está desenhada: `procedures/entities/procedure-material.entity.ts`
(TODO) associa cada procedimento aos materiais/quantidades padrão. Ao
concluir um item do plano de tratamento, o evento
`treatment-plan-item.completed` também deve ser escutado pelo
`InventoryModule` para dar baixa automática.

## O que falta (por módulo)

Cada stub em `backend/src/modules/*/*.module.ts` tem comentários
`// TODO` descrevendo exatamente as entidades e regras a implementar,
na ordem sugerida de dependência:

1. Dentists (perfil profissional) e Rooms (CRUD simples)
2. Procedures (catálogo) → Treatment Plans (services/controller)
3. Medical Records (odontograma, anamnese, evolução, upload de arquivos)
4. Inventory → Financial → Payments (nessa ordem, pela cadeia de eventos)
5. Notifications (integrações externas: WhatsApp/SMS/e-mail)
6. Dashboard e Reports (agregam os módulos acima — fazer por último)
7. Settings e Audit (transversais, baixa prioridade funcional)

## Banco de dados

Ainda não geradas as migrations. Sugestão de próximo passo: rodar
`npm run migration:generate` a partir das entidades já criadas
(Clinic, User, Patient, Appointment, Room, TreatmentPlan) para termos
as primeiras tabelas reais no Supabase, e então seguir preenchendo o
schema módulo a módulo junto com o código.
