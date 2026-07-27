import { IsIn } from 'class-validator';

export class ReplyNotificationDto {
  @IsIn(['confirmed', 'cancelled'])
  status: 'confirmed' | 'cancelled';
}
