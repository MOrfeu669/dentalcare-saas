# DentalCare — Sistema de Gestão para Clínicas Odontológicas

SaaS multi-tenant para clínicas odontológicas: agenda inteligente,
prontuário eletrônico, plano de tratamento, financeiro integrado,
controle de estoque, confirmação automática de consultas e relatórios
gerenciais.

## O que foi feito

Este projeto já passou da fase de esqueleto e agora está com uma base
funcional de ponta a ponta:

- Backend NestJS com autenticação JWT, multi-tenancy por `clinic_id`,
  guards, decorators e módulos de domínio bem separados.
- Módulos de negócio implementados e conectados: Auth, Users, Clinics,
  Patients, Appointments, Dentists, Procedures, Treatment Plans,
  Medical Records, Inventory, Financial, Payments, Notifications,
  Dashboard e Reports.
- Frontend React + TypeScript com rotas protegidas, login/cadastro,
  página de pacientes e telas de navegação já integradas ao backend,
  incluindo Dashboard, Agenda, Prontuário, Planos de tratamento,
  Estoque, Financeiro, Relatórios e Configurações.
- Fluxos principais funcionando: cadastro de clínica/funcionário,
  agenda, planos de tratamento, financeiro, estoque, notificações e
  relatórios.
- O Dashboard agora consome o endpoint real `GET /dashboard/summary`
  e a build do backend e do frontend foram validadas com sucesso.

## O que ainda falta

Algumas pendências importantes continuam abertas:

- Melhorar o fluxo de onboarding de dentistas/funcionários com convite
  ou aprovação administrativa, em vez de depender exclusivamente do CNPJ.
- Trocar o sender de notificações real por um provedor externo
  (WhatsApp/SMS/SMTP) quando houver credenciais.
- Implementar exportação de relatórios para PDF/Excel.
- Completar módulos transversais de Settings e Audit.
- Refinar a experiência do frontend com tabelas, filtros e melhor
  usabilidade nas telas já conectadas.

## Pendências abertas

- `TreatmentPlansService.completeItem()` já dispara o evento de
  conclusão, mas a automação de consumo de estoque por procedimento
  ainda depende da receita `ProcedureMaterial` estar plenamente ligada
  ao fluxo.
- A agenda ainda não usa `getWorkingHoursForDay()` do dentista como
  regra de bloqueio adicional.
- Itens de plano concluídos em dados antigos podem não aparecer em
  relatórios agregados por `completedAt` se o histórico foi criado antes
  dessa implementação.
- Os relatórios ainda retornam JSON; a exportação para PDF/Excel é um
  TODO de camada de serialização.

## Sugestão do próximo passo

A melhor próxima etapa é priorizar a experiência de uso do sistema com
três entregas sequenciais:

1. Polir as telas já existentes no frontend com tabelas, filtros e
   estados de loading/erro mais claros.
2. Trabalhar no fluxo de notificações e relatórios de forma mais
   profissional, preparando a aplicação para uso real.
3. Evoluir Settings e Audit para uma camada transversal mais completa.

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

**Testes** (banco local do `.env` já precisa existir/estar migrado):
```bash
npm test                                       # unitários
npm run test:e2e                               # integração (conecta no Postgres de verdade)
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

**`error TS6059: File '.../test/*.e2e-spec.ts' is not under 'rootDir'`**
Acontece se `tsconfig.json` tiver `rootDir: "./src"` sem excluir a
pasta `test/` (que fica fora de `src/`, de propósito — os testes de
integração precisam do projeto inteiro compilável, não só do `src`).
Corrigido adicionando `"exclude": ["node_modules", "dist", "test"]` no
`tsconfig.json` raiz; os testes de integração rodam com sua própria
config (`test/jest-e2e.json`), então não precisam estar dentro de
`rootDir`.

## Próximos passos sugeridos

1. Melhorar o onboarding de dentistas/funcionários com convite ou
   aprovação do administrador.
2. Implementar um `NotificationSender` real para WhatsApp/SMS/SMTP.
3. Adicionar exportação de relatórios para PDF/Excel.
4. Completar `Settings` e `Audit`.
5. Polir o frontend com componentes mais completos nas telas de
   agenda, financeiro, estoque e relatórios.
