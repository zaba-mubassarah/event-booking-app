import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index } from 'typeorm';
import { EventEntity } from '../events/events.entity';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

@Entity('bookings')
@Index(['requestId'], { unique: true })
export class BookingEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  bookingReference: string;

  @Column({ unique: true })
  requestId: string;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  seats: number;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: BookingStatus;

  @Column({ nullable: true })
  failureReason?: string;

  @ManyToOne(() => EventEntity, (event) => event.bookings, { eager: true, onDelete: 'RESTRICT' })
  event: EventEntity;

  @Column()
  eventId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
