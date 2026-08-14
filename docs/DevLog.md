# Historico de Desenvolvimento

## 23/08 - O que já foi montado

Estrutura completa: **`(/home/claude/dentalcare-saas)`**: árvore de diretórios do backend **(18 módulos, cada um com `controllers/services/repositories/dto/entities/interfaces/validators`)** e do frontend **`(components/pages/services/contexts/hooks/types/utils/styles)`**.
*
Configuração do backend: `package.json`, `tsconfig.json`, `nest-cli.json`, `.env.example`, `main.ts` (com Swagger, ValidationPipe global, CORS), `app.config.ts`, `database.config.ts`.

Núcleo transversal (`common/`): *TenantBaseEntity + TenantRepository* (garantem que toda tabela é isolada por clinic_id), guards de JWT e Roles, decorators `@CurrentUser/@Roles/@Public`, filtro global de exceções, interface de paginação.

Módulos totalmente implementados (como referência para os demais):

- Auth — login com JWT, bcrypt, estratégia Passport
- Users — funcionários com perfis (`Admin` - `Dentista` - `Recepcionista`)
- Clinics — entidade do tenant
- Patients — CRUD completo (módulo-modelo para replicar)
- Appointments — com o serviço central de detecção de conflitos (dentista/sala sobrepostos) pedido na "Agenda inteligente"
- Treatment Plans — entidade modelada (novo módulo que você pediu)

Módulos restantes (medical-records, procedures, financial, payments, inventory, suppliers, dashboard, reports, notifications, settings, audit, dentists): criados como stubs com comentários TODO detalhados explicando exatamente o que implementar e como cada um se conecta aos outros (ex.: Inventory dando baixa automática por procedimento, Financial escutando eventos do Treatment Plan, Notifications reagindo a appointment.created).

app.module.ts já amarra tudo com os guards globais de autenticação.

Ainda faltava fazer (próximos passos)
Scaffold do frontend (package.json, vite, App.tsx, AuthContext, api client)
README explicando a estrutura
Empacotar tudo em .zip para download

## 
