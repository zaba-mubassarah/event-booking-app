import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingEntity } from './bookings.entity';
import { EventEntity } from '../events/events.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(BookingEntity)
    private readonly bookingRepository: Repository<BookingEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @Optional()
    @InjectQueue('bookings')
    private readonly bookingsQueue?: Queue,
  ) {}

  async onModuleInit() {
    await this.seedEvents();
  }

  async seedEvents() {
    const count = await this.eventRepository.count();
    if (count > 0) {
      return;
    }

    const events = this.eventRepository.create([
      { name: 'Tech Meetup', date: '2026-08-10', totalSeats: 50, pricePerSeat: 15, confirmedSeats: 0 },
      { name: 'Design Conference', date: '2026-09-02', totalSeats: 30, pricePerSeat: 25, confirmedSeats: 0 },
      { name: 'Live Jazz Night', date: '2026-10-15', totalSeats: 20, pricePerSeat: 18, confirmedSeats: 0 },
    ]);

    await this.eventRepository.save(events);
  }

  async createBooking(dto: CreateBookingDto) {
    const existing = await this.bookingRepository.findOne({ where: { requestId: dto.requestId } });
    if (existing) {
      return {
        bookingReference: existing.bookingReference,
        status: existing.status,
        message: 'Duplicate request ignored',
      };
    }

    const bookingReference = `BK-${uuidv4().slice(0, 8).toUpperCase()}`;
    const booking = this.bookingRepository.create({
      bookingReference,
      requestId: dto.requestId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      seats: dto.seats,
      status: 'PENDING',
      eventId: dto.eventId,
    });

    try {
      await this.bookingRepository.save(booking);
    } catch (error: any) {
      if (error?.code === '23505') {
        const duplicate = await this.bookingRepository.findOne({ where: { requestId: dto.requestId } });
        return {
          bookingReference: duplicate?.bookingReference,
          status: duplicate?.status || 'PENDING',
          message: 'Duplicate request ignored',
        };
      }
      throw error;
    }

    try {
      this.logger.log(`Processing booking ${booking.id} inline during request`);
      await this.processBooking(booking.id);

      const updatedBooking = await this.bookingRepository.findOne({ where: { id: booking.id } });
      if (this.bookingsQueue) {
        await this.bookingsQueue.add('process-booking', { bookingId: booking.id }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
      }

      const status = updatedBooking?.status || 'PENDING';
      return {
        bookingReference,
        status,
        message: status === 'CONFIRMED'
          ? 'Booking accepted and confirmed'
          : status === 'FAILED'
            ? 'Booking accepted but could not be confirmed'
            : 'Booking accepted and queued',
      };
    } catch (error) {
      this.logger.error(`Booking processing failed for ${booking.id}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async listBookings(query: BookingQueryDto) {
    const { page, limit, eventId, status } = query;
    const qb = this.bookingRepository.createQueryBuilder('booking').leftJoinAndSelect('booking.event', 'event');

    if (eventId) qb.andWhere('booking.eventId = :eventId', { eventId });
    if (status) qb.andWhere('booking.status = :status', { status });

    const [items, total] = await qb.orderBy('booking.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, total, page, limit };
  }

  async listEvents() {
    const events = await this.eventRepository.find();
    return events.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      totalSeats: event.totalSeats,
      pricePerSeat: Number(event.pricePerSeat),
      remainingSeats: event.totalSeats - event.confirmedSeats,
    }));
  }

  async processBooking(bookingId: number) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status !== 'PENDING') {
      return;
    }

    const event = await this.eventRepository.findOne({ where: { id: booking.eventId } });
    if (!event) {
      booking.status = 'FAILED';
      booking.failureReason = 'Event not found';
      await this.bookingRepository.save(booking);
      return;
    }

    try {
      await this.eventRepository.manager.transaction(async (manager) => {
        const freshEvent = await manager.createQueryBuilder(EventEntity, 'event')
          .where('event.id = :id', { id: event.id })
          .setLock('pessimistic_write')
          .getOne();

        if (!freshEvent) {
          throw new Error('Event not found during transaction');
        }

        const freshRemaining = freshEvent.totalSeats - freshEvent.confirmedSeats;
        if (booking.seats > freshRemaining) {
          throw new Error('Sold out during transaction');
        }

        freshEvent.confirmedSeats += booking.seats;
        await manager.save(freshEvent);

        booking.status = 'CONFIRMED';
        booking.failureReason = undefined;
        await manager.save(booking);
      });
    } catch (error) {
      booking.status = 'FAILED';
      booking.failureReason = error instanceof Error ? error.message : 'Processing failed';
      await this.bookingRepository.save(booking);
    }
  }
}
