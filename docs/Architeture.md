# Monolito Modular Multi_Tenant. Módulos de Feature
Se você está entrando agora no projeto, existem **duas decisões arquiteturais que precisa entender antes de escrever qualquer código**:

1. O sistema é um **monólito modular multi-tenant**.
2. Cada módulo é responsável pelos seus próprios dados e **não acessa diretamente os repositórios de outro módulo**.
3. Módulos de Featura. organiza uma única base de código em partes separadas por funções de negócio

Essas duas decisões estão diretamente relacionadas.

## 1. Primeiro: o que significa "monólito modular"?

Nosso backend roda como **uma única aplicação**, mas internamente é dividido em módulos bem definidos.
Por exemplo:
````
Backend
Modules
	│
	├── Auth
	├── Clinics
	├── Patients
	├── Appointments
	├── Treatments
	├── Financial
	├── Inventory
	├── Notifications
	└── Reports
```` 
Isso **não significa** que cada módulo seja um microsserviço. Mas são;

- **Fronteira Clara**: Define um escopo restrito de uma parte da aplicação, isolando seu código interno dos demais módulos.
- **API Pública / Contrato**: Expõe apenas o estritamente necessário para outros módulos consumirem, escondendo detalhes internos de implementação.
- **Regras de Negócio Próprias**: Concentra os casos de uso, validações e modelos de domínio específicos daquela funcionalidade.
- **Persistência Localizada**: Gerencia seus próprios dados ou tabelas, evitando acessos diretos e arbitrários ao banco de dados por parte de outros módulos.

Todos continuam dentro da mesma aplicação:
```
┌──────────────────────────┐
│      NestJS Backend      │
│                          │
│ Auth     Patients        │
│ Agenda   Financial       │
│ Estoque  Reports         │
│                          │
└────────────┬─────────────┘
             │
         PostgreSQL
```

## 2. O que significa "multi-tenant"?
Aqui está uma das decisões mais importantes do projeto.
O sistema será utilizado por **várias clínicas diferentes**.
```
Clínica A
├── Pacientes
├── Agendamentos
├── Estoque
└── Financeiro

Clínica B
├── Pacientes
├── Agendamentos
├── Estoque
└── Financeiro

Clínica C
├── Pacientes
├── Agendamentos
├── Estoque
└── Financeiro
```
Todas essas clínicas utilizam **a mesma aplicação e o mesmo 
Porém:

> **Uma clínica jamais pode enxergar ou alterar os dados de outra clínica.**

É exatamente isso que o conceito de **tenant** resolve.

Nesse projeto:  

Tenant = Clínica

## 3. Por que existe `clinicId` em praticamente todas as tabelas?

Essa é provavelmente a primeira coisa que você vai estranhar olhando o banco.

Você encontrará algo parecido com:
```
patients
---------
id
clinic_id
name
cpf
birth_date
```
```
appointments
------------
id
clinic_id
patient_id
dentist_id
start_at
status
```
```
products
--------
id
clinic_id
name
quantity
minimum_stock
```
```
products
--------
id
clinic_id
name
quantity
minimum_stock
```
A pergunta natural é:

> "Se o paciente já está relacionado à clínica, por que precisamos colocar `clinicId` também no agendamento?"

Porque o `clinicId` não está ali apenas para indicar relacionamento.

Ele é uma **fronteira de isolamento do tenant**.
### 3.1. Pense no `clinicId` como um "muro"
Suponha que o banco tenha:
```
patients

id    clinic_id    name
1     10           João
2     10           Maria
3     20           Carlos
4     20           Ana
```
Cada clinica só pode trabalhar com o seu próprio `Id`

Então uma consulta do sistema nunca deveria ser simplesmente:
```SQL
SELECT *
FROM patients;
```
Ela deveria ser conceitualmente:
```SQL
SELECT *
FROM patients
WHERE clinic_id = :clinicId;
```
O mesmo vale para todos os serviços que iram consumir o banco.
### 3.2. Segurança
Imagine que uma recepcionista da Clínica A faça uma requisição:
```HTTP
GET /patients/123
```
O sistema ira retornar
```
Patients 123
clinicId = 20
```
Mas o Usuário pertence  ao `clinicId = 10`
O sistema não ira conseguir retornar o paciente.

A regra é
```
Usuário → Clínica A → clinicId = 10
```
Portanto, uma busca por ID deve ser pensada como:
```SQL
SELECT *
FROM patients
WHERE id = :patientId
  AND clinic_id = :clinicId;
```
### 3.3. Por que não colocar `clinicId` apenas nas tabelas principais?"
Mesmo sendo possível, isso aumentaria a complexidade. obrigaria várias operações a fazer algo como:
```
Treatment
   ↓
Appointment
   ↓
Patient
   ↓
Clinic
```
Com `clinicId` diretamente na entidade:
```
Treatment
├── id
├── clinicId
└── ...
```
a fronteira do tenant (entre as clinicas) fica explicita.
### 3.4. Performace
Imagine: 
```SQL
SELECT *
FROM appointments
WHERE clinic_id = 15
  AND start_at >= '2026-08-10';
```
Podemos criar um index que permita ao banco localizar rapidamente os registros daquela clínica.
```SQL
CREATE INDEX idx_appointments_clinic_date
ON appointments(clinic_id, start_at);
```