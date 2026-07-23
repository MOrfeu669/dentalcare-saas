import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { TenantBaseEntity } from './tenant-base.entity';

/**
 * Wrapper fino sobre o Repository do TypeORM que injeta automaticamente
 * `clinic_id` em toda operação de leitura/escrita.
 *
 * Objetivo: tornar estruturalmente difícil um bug de "vazamento" de dados
 * entre clínicas — nenhum module.service deveria montar um `where` na mão
 * sem passar por aqui.
 */
export class TenantRepository<T extends TenantBaseEntity> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly clinicId: string,
  ) {}

  findAll(where: FindOptionsWhere<T> = {} as FindOptionsWhere<T>) {
    return this.repository.find({
      where: { ...where, clinicId: this.clinicId } as FindOptionsWhere<T>,
    });
  }

  findOne(where: FindOptionsWhere<T>) {
    return this.repository.findOne({
      where: { ...where, clinicId: this.clinicId } as FindOptionsWhere<T>,
    });
  }

  create(data: DeepPartial<T>) {
    const entity = this.repository.create({
      ...data,
      clinicId: this.clinicId,
    } as DeepPartial<T>);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>) {
    await this.repository.update(
      { id, clinicId: this.clinicId } as unknown as FindOptionsWhere<T>,
      data as never,
    );
    return this.findOne({ id } as FindOptionsWhere<T>);
  }

  async softDelete(id: string) {
    return this.repository.softDelete({
      id,
      clinicId: this.clinicId,
    } as FindOptionsWhere<T>);
  }
}
