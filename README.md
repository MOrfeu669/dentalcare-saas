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
projeto. Os módulos **Auth**, **Users**, **Clinics**, **Patients** e
**Appointments** estão implementados por completo e servem de
referência para os demais, que existem como *stubs* com `// TODO`
explicando o que fazer em cada um.

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

## Próximos passos sugeridos

1. ~~Gerar as primeiras migrations~~ ✅ e ~~seeds de dados~~ ✅ — feito, ver `docs/ARCHITECTURE.md`.
2. Implementar `Dentists` e `Rooms` (pré-requisito direto da Agenda).
3. Implementar `Procedures` → `Treatment Plans` (services/controller).
4. Seguir a ordem de dependência descrita em `docs/ARCHITECTURE.md`.
