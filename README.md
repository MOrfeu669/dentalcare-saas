# DentalCare — Sistema de Gestão para Clínicas Odontológicas

SaaS multi-tenant para clínicas odontológicas: agenda inteligente,
prontuário eletrônico, plano de tratamento, financeiro integrado,
controle de estoque, confirmação automática de consultas e relatórios
gerenciais.

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + TypeScript + Vite |
| Back-end | Node.js + NestJS |
| Banco de dados | PostgreSQL (local) |
| Auth | JWT (emitido pelo NestJS) |

Arquitetura: **monólito modular** — ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
para as decisões de multi-tenancy, comunicação entre módulos e o que
falta implementar em cada um.

## Estrutura

```
backend/
  src/
    modules/        # 18 módulos de domínio (auth, patients, appointments, financial...)
    common/          # guards, decorators, entidade/repository base multi-tenant
    config/          # configuração de app e banco
    database/        # migrations e seeds
frontend/
  src/
    pages/           # telas (Login, Dashboard, ...)
    components/      # layout e componentes reutilizáveis
    services/        # cliente HTTP + chamadas à API por domínio
    contexts/        # AuthContext
    types/           # tipos compartilhados com o backend
docs/
  ARCHITECTURE.md
```

Cada módulo do backend segue o padrão Controller → Service → Repository
→ DTO → Entity → Interfaces/Validators, conforme especificado no
projeto. **Todos os módulos de negócio do escopo original estão
implementados e testados de ponta a ponta** (API real + Postgres
real): Auth, Users, Clinics, Patients, Appointments (+ Rooms),
Dentists, Procedures, Treatment Plans, Medical Records, Inventory,
Financial, Payments, Notifications, Dashboard e Reports. Restam
**Settings** e **Audit** — transversais, baixa prioridade funcional,
ainda *stubs* com `// TODO`.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ instalado e rodando localmente (não depende mais de
  Supabase ou qualquer serviço em nuvem — banco 100% local)

## Como rodar localmente

### Backend
```bash
cd backend
cp .env.example .env    # ajuste usuário/senha se seu Postgres local não usar postgres/postgres
createdb dentalcare      # ou: psql -c "CREATE DATABASE dentalcare;"
npm install
npm run migration:run   # cria as tabelas (testado localmente, ver docs/ARCHITECTURE.md)
npm run seed             # popula clínica/usuários/salas/pacientes de exemplo
npm run start:dev       # http://localhost:3000/api/v1 · docs em /docs
```

Login de teste após o seed: `admin@odontovida.com.br` / `Senha123!`

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

> Os `package.json` já estão prontos; como o instalador não tem acesso
> à internet neste ambiente, o `npm install` precisa ser rodado na sua
> máquina.

## Troubleshooting

**`Error: Cannot find module '.../dist/main'` ao rodar `npm run start:dev`**
Já aconteceu aqui durante o desenvolvimento: `nest-cli.json` tem
`deleteOutDir: true`, e se existir um `tsconfig.tsbuildinfo` de uma
compilação anterior (`incremental: true`), o TypeScript acha que os
arquivos em `dist/` ainda existem e pula a geração — só que
`deleteOutDir` acabou de apagá-los. Resultado: `dist/` fica vazio e o
Nest não acha `main.js`. Correção (já aplicada neste `tsconfig.json`):
não usar `incremental` junto com `deleteOutDir`. Se acontecer de novo
por algum outro motivo:
```bash
cd backend
rm -f tsconfig.tsbuildinfo
rm -rf dist
npm run start:dev
```

**`error: autenticação do tipo senha falhou para o usuário "postgres"` (28P01)**
Confirme que a senha no `.env` (`DB_PASSWORD`) é exatamente a mesma
configurada no seu Postgres local — teste direto com
`psql -U postgres -h localhost` antes de rodar qualquer comando do
projeto. No Windows, confira também se o `.env` foi salvo em UTF-8 e
sem aspas sobrando ao redor do valor.

## Próximos passos sugeridos

Todo o backend de negócio (Auth até Reports) está implementado e
testado. O que resta:

1. `ProcedureMaterial` (receita de consumo) + `InventoryModule` escutando
   `treatment-plan-item.completed` — fecha o "consumo automático por procedimento".
2. Implementar um `NotificationSender` real (WhatsApp Business API ou
   SMTP) quando houver credenciais — hoje só loga (`ConsoleNotificationSender`).
3. Exportação de Reports para PDF/Excel (`ReportsController` retorna
   JSON hoje).
4. `Settings` e `Audit` — módulos transversais, ainda stub.
5. Conectar `DentistsService.getWorkingHoursForDay()` ao
   `AppointmentConflictCheckerService` (não sugerir horário fora do expediente).
6. No frontend: trocar os `PlaceholderPage` restantes (Agenda,
   Atendimento/\*, Financeiro/\*, Estoque, Relatórios) por telas reais
   consumindo a API — o padrão está em `pages/Patients/PatientsPage.tsx`.
