import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const toNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export class BookingQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  eventId?: number;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'FAILED'])
  status?: 'PENDING' | 'CONFIRMED' | 'FAILED';
}
