import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BookingEntity } from '../bookings/bookings.entity';
import { EventEntity } from '../events/events.entity';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const useSqlite = process.env.NODE_ENV === 'test';

  if (useSqlite) {
    return {
      type: 'better-sqlite3',
      database: process.env.SQLITE_DATABASE || ':memory:',
      entities: [BookingEntity, EventEntity],
      synchronize: true,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'event_booking',
    entities: [BookingEntity, EventEntity],
    synchronize: true,
    logging: false,
  };
}

export const typeOrmConfig = getTypeOrmConfig();
