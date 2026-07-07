import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsUUID, Min, MinLength } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  eventId: number;

  @IsNotEmpty()
  @MinLength(2)
  customerName: string;

  @IsEmail()
  customerEmail: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats: number;
}
