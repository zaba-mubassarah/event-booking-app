import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BookingsService } from './bookings.service';

@Processor('bookings')
export class BookingsProcessor extends WorkerHost {
  constructor(private readonly bookingsService: BookingsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'process-booking') {
      await this.bookingsService.processBooking(job.data.bookingId);
      return { ok: true };
    }

    return { ok: true };
  }
}
