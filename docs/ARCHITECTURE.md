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
