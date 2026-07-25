import { IsString, Length } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(1, 60)
  name: string;
}
