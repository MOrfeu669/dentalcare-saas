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
| Banco de dados | PostgreSQL (hospedado no Supabase) |
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
projeto. Os módulos **Auth**, **Users**, **Clinics**, **Patients** e
**Appointments** estão implementados por completo e servem de
referência para os demais, que existem como *stubs* com `// TODO`
explicando o que fazer em cada um.

## Como rodar localmente

### Backend
```bash
cd backend
cp .env.example .env    # preencha com as credenciais do seu Supabase/Postgres
npm install
npm run start:dev       # http://localhost:3000/api/v1 · docs em /docs
```

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

## Próximos passos sugeridos

1. Gerar as primeiras migrations a partir das entidades já modeladas.
2. Implementar `Dentists` e `Rooms` (pré-requisito direto da Agenda).
3. Implementar `Procedures` → `Treatment Plans` (services/controller).
4. Seguir a ordem de dependência descrita em `docs/ARCHITECTURE.md`.
