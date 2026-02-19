import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1771198531696 implements MigrationInterface {
  name = 'Migration1771198531696';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"`,
    );
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "orderId"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "productId"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "order_id"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "order_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "product_id" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "user_id" uuid NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "user_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "product_id" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN "order_id"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "order_id" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "productId" uuid`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD "orderId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
