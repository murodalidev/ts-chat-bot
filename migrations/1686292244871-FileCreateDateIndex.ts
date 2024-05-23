import { MigrationInterface, QueryRunner } from 'typeorm'

export class FileCreateDateIndex1686292244871 implements MigrationInterface {
  name = 'FileCreateDateIndex1686292244871'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_2901752f1d771f97a8bb45cb4c" ON "files" ("createdAt") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_2901752f1d771f97a8bb45cb4c"`)
  }
}
