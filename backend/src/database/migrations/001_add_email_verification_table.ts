import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddEmailVerificationTable1703001000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_verifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '500',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'],
            isNullable: false,
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'usedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ipAddress',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'userAgent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_email_verification_user',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'email_verifications',
      new Index('IDX_email_verification_token', ['token']),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new Index('IDX_email_verification_email_type', ['email', 'type']),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new Index('IDX_email_verification_user_type', ['userId', 'type']),
    );

    await queryRunner.createIndex(
      'email_verifications',
      new Index('IDX_email_verification_expires', ['expiresAt']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verifications');
  }
}