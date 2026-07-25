import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDentistProfileDto } from './create-dentist-profile.dto';

export class UpdateDentistProfileDto extends PartialType(
  OmitType(CreateDentistProfileDto, ['userId'] as const),
) {}
