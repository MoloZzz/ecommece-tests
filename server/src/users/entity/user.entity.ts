import { OrderEntity } from 'src/orders/entity/order.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];
}
