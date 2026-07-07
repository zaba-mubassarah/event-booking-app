import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BookingQueryDto } from './booking-query.dto';

describe('BookingQueryDto', () => {
  it('coerces numeric query params from strings', async () => {
    const dto = plainToInstance(BookingQueryDto, {
      page: '1',
      limit: '8',
      eventId: '2',
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(8);
    expect(dto.eventId).toBe(2);
  });
});
