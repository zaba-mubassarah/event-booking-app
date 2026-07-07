import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEntity } from './bookings.entity';
import { EventEntity } from '../events/events.entity';
import { BookingsProcessor } from './bookings.processor';

const isQueueEnabled = process.env.NODE_ENV !== 'test' && process.env.DISABLE_QUEUE !== 'true';
const queueImports = isQueueEnabled
  ? [
      BullModule.registerQueue({
        name: 'bookings',
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379,
          ...(process.env.REDIS_URL ? { url: process.env.REDIS_URL } : {}),
        },
      }),
    ]
  : [];
const providers = [BookingsService, ...(isQueueEnabled ? [BookingsProcessor] : [])];

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, EventEntity]),
    ...queueImports,
  ],
  controllers: [BookingsController],
  providers,
  exports: [BookingsService],
})
export class BookingsModule {}
