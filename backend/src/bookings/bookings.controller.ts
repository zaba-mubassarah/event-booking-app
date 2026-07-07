import { Body, Controller, Get, HttpCode, Param, Post, Query, ValidationPipe } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('bookings')
  @HttpCode(202)
  async create(@Body(new ValidationPipe({ transform: true })) dto: CreateBookingDto) {
    return this.bookingsService.createBooking(dto);
  }

  @Get('bookings')
  async list(@Query(new ValidationPipe({ transform: true })) query: BookingQueryDto) {
    return this.bookingsService.listBookings(query);
  }

  @Get('events')
  async listEvents() {
    return this.bookingsService.listEvents();
  }

  @Get('bookings/:id')
  async findOne(@Param('id') id: number) {
    return this.bookingsService.listBookings({ page: 1, limit: 10, eventId: id });
  }
}
