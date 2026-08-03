import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicSettings } from '../entities/clinic-settings.entity';
import { UpdateClinicSettingsDto } from '../dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(ClinicSettings)
    private readonly settingsRepository: Repository<ClinicSettings>,
  ) {}

  async getSettings(clinicId: string): Promise<ClinicSettings> {
    const existing = await this.settingsRepository.findOne({ where: { clinicId } });
    if (existing) return existing;

    const defaults = this.settingsRepository.create({
      clinicId,
      theme: 'default',
      dateFormat: 'dd/mm/yyyy',
      timeZone: 'America/Sao_Paulo',
      notificationPreferences: {
        appointmentReminders: true,
        lowStockAlerts: true,
        paymentAlerts: true,
      },
    });

    return this.settingsRepository.save(defaults);
  }

  async updateSettings(clinicId: string, dto: UpdateClinicSettingsDto): Promise<ClinicSettings> {
    const settings = await this.getSettings(clinicId);

    const payload: Partial<ClinicSettings> = {
      ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
      ...(dto.dateFormat !== undefined ? { dateFormat: dto.dateFormat } : {}),
      ...(dto.timeZone !== undefined ? { timeZone: dto.timeZone } : {}),
    };

    if (dto.notificationPreferences) {
      payload.notificationPreferences = {
        appointmentReminders:
          dto.notificationPreferences.appointmentReminders ??
          settings.notificationPreferences.appointmentReminders,
        lowStockAlerts:
          dto.notificationPreferences.lowStockAlerts ??
          settings.notificationPreferences.lowStockAlerts,
        paymentAlerts:
          dto.notificationPreferences.paymentAlerts ??
          settings.notificationPreferences.paymentAlerts,
      };
    }

    await this.settingsRepository.update({ id: settings.id, clinicId }, payload);
    return this.getSettings(clinicId);
  }

  async resetSettings(clinicId: string): Promise<ClinicSettings> {
    const settings = await this.getSettings(clinicId);
    await this.settingsRepository.delete({ id: settings.id, clinicId });
    return this.getSettings(clinicId);
  }
}
