import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateUserEntity1686138383992 implements MigrationInterface {
  name = 'CreateUserEntity1686138383992'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "fullName" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "tgUsername" character varying, "tgId" bigint NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_874622b3ec0857db1cc9a877b5" ON "users" ("tgId", "phoneNumber") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_874622b3ec0857db1cc9a877b5"`)
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
