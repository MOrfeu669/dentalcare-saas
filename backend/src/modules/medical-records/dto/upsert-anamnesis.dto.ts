import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpsertAnamnesisDto {
  @IsOptional() @IsString() allergies?: string;
  @IsOptional() @IsString() currentMedications?: string;
  @IsOptional() @IsString() chronicConditions?: string;
  @IsOptional() @IsString() previousSurgeries?: string;
  @IsOptional() @IsBoolean() isPregnant?: boolean;
  @IsOptional() @IsBoolean() bleedingDisorders?: boolean;
  @IsOptional() @IsBoolean() smoker?: boolean;
  @IsOptional() @IsString() additionalNotes?: string;
}
