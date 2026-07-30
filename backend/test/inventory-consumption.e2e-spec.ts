import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule, EventEmitter2 } from '@nestjs/event-emitter';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';

import { InventoryModule } from '../src/modules/inventory/inventory.module';
import { ProceduresModule } from '../src/modules/procedures/procedures.module';
import { Procedure } from '../src/modules/procedures/entities/procedure.entity';
import { Material } from '../src/modules/inventory/entities/material.entity';
import { ProcedureMaterial } from '../src/modules/inventory/entities/procedure-material.entity';
import { StockMovement } from '../src/modules/inventory/entities/stock-movement.entity';

/**
 * Integração de verdade: sobe InventoryModule + ProceduresModule com
 * conexão real ao Postgres local (mesmas credenciais do .env de dev —
 * num pipeline de CI, isto deveria apontar para um banco efêmero
 * dedicado a testes; aqui, ambiente de desenvolvimento local, reaproveita
 * o mesmo). `clinicId` não tem FK de verdade no banco (ver
 * TenantBaseEntity), então não precisa existir uma Clinic real — só um
 * UUID consistente entre os registros de teste.
 */
describe('Consumo automático de estoque (integração: evento → baixa de estoque)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let eventEmitter: EventEmitter2;

  const clinicId = randomUUID();
  let procedureId: string;
  let materialId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST ?? 'localhost',
          port: parseInt(process.env.DB_PORT ?? '5432', 10),
          username: process.env.DB_USERNAME ?? 'postgres',
          password: process.env.DB_PASSWORD ?? 'postgres',
          database: process.env.DB_DATABASE ?? 'dentalcare',
          autoLoadEntities: true,
          synchronize: false,
        }),
        InventoryModule,
        ProceduresModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dataSource = module.get(DataSource);
    eventEmitter = module.get(EventEmitter2);

    const procedure = await dataSource.getRepository(Procedure).save(
      dataSource.getRepository(Procedure).create({
        clinicId,
        name: `Procedimento de teste ${randomUUID()}`,
        defaultValue: 100,
        estimatedMinutes: 30,
      }),
    );
    procedureId = procedure.id;

    const material = await dataSource.getRepository(Material).save(
      dataSource.getRepository(Material).create({
        clinicId,
        name: `Material de teste ${randomUUID()}`,
        unit: 'un',
        minStock: 5,
        currentStock: 10,
      }),
    );
    materialId = material.id;

    await dataSource.getRepository(ProcedureMaterial).save(
      dataSource.getRepository(ProcedureMaterial).create({ clinicId, procedureId, materialId, quantity: 3 }),
    );
  });

  afterAll(async () => {
    // Limpeza — remove só o que este teste criou, pelo clinicId isolado.
    await dataSource.getRepository(StockMovement).delete({ clinicId });
    await dataSource.getRepository(ProcedureMaterial).delete({ clinicId });
    await dataSource.getRepository(Material).delete({ clinicId });
    await dataSource.getRepository(Procedure).delete({ clinicId });
    await app.close();
  });

  it('reduz o estoque automaticamente ao emitir o evento de conclusão de item', async () => {
    await eventEmitter.emitAsync('treatment-plan-item.completed', {
      clinicId,
      treatmentPlanId: randomUUID(),
      patientId: randomUUID(),
      dentistId: randomUUID(),
      item: { id: randomUUID(), procedureId, description: 'Item de teste' },
    });

    const material = await dataSource.getRepository(Material).findOne({ where: { id: materialId } });
    expect(Number(material!.currentStock)).toBe(7); // 10 - 3

    const movements = await dataSource
      .getRepository(StockMovement)
      .find({ where: { clinicId, materialId } });
    expect(movements).toHaveLength(1);
    expect(Number(movements[0].quantity)).toBe(3);
    expect(movements[0].reason).toContain('Consumo automático');
  });

  it('não deixa o saldo inconsistente quando a receita pede mais do que o estoque disponível', async () => {
    // Saldo atual é 7 (resultado do teste anterior); ajusta a receita
    // pra pedir mais do que existe.
    await dataSource
      .getRepository(ProcedureMaterial)
      .update({ clinicId, procedureId, materialId }, { quantity: 999 });

    const before = await dataSource.getRepository(Material).findOne({ where: { id: materialId } });

    // Não deve lançar — a falha de saldo insuficiente é isolada por
    // item dentro do listener (ver procedure-consumption.service.ts).
    await expect(
      eventEmitter.emitAsync('treatment-plan-item.completed', {
        clinicId,
        treatmentPlanId: randomUUID(),
        patientId: randomUUID(),
        dentistId: randomUUID(),
        item: { id: randomUUID(), procedureId, description: 'Item sem saldo suficiente' },
      }),
    ).resolves.not.toThrow();

    const after = await dataSource.getRepository(Material).findOne({ where: { id: materialId } });
    // Saldo não muda — a transação de StockMovementsService.register()
    // é revertida quando a validação de saldo insuficiente dispara.
    expect(Number(after!.currentStock)).toBe(Number(before!.currentStock));
  });
});
