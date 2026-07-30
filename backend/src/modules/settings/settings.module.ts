import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './controllers/settings.controller';
import { ClinicSettings } from './entities/clinic-settings.entity';
import { SettingsService } from './services/settings.service';

/** Configurações gerais da clínica e preferências do sistema. */
@Module({
  imports: [TypeOrmModule.forFeature([ClinicSettings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}

// TODO: entities/clinic-settings.entity.ts (clinicId 1:1, theme, notificationPreferences jsonb)
