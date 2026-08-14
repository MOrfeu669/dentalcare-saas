## 1. Install
- Abra dois terminais
- Em cada terminal entre nas respectivas pastas, `cd backend` `cd frontend`
- E em cada terminal rode `npm istall`

 ## 2. Migrations
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
## 3. ## Seeds (dados de exemplo)

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
## rodando localmente
apor realizar os passo anteriore execute os seguites codigos em dois terminais separados.
```bash
cd backend
npm run start:dev
```
```bash
cd frontend
npm run dev
```
apos isso copie e cole o localhost no browser