import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum OrderStatus {
  created = 'created',
  paid = 'paid',
  shipped = 'shipped',
}

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'jsonb', nullable: false })
  items: any[];

  @Column({ type: 'integer', nullable: false })
  total: number;

  @Column({ type: 'varchar', nullable: false })
  status: OrderStatus; // created → paid → shipped
}
