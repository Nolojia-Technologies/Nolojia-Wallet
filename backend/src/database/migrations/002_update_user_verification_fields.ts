import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserVerificationFields1703001000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new verification fields to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "isEmailVerified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "isPhoneVerified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "isKycVerified" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "kycVerifiedAt" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "loginAttempts" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lockedUntil" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "lastPasswordReset" timestamp NULL,
      ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "twoFactorSecret" varchar(100) NULL
    `);

    // Update existing users to have email verification required
    await queryRunner.query(`
      UPDATE "users"
      SET "isEmailVerified" = false,
          "isPhoneVerified" = false,
          "isKycVerified" = false
      WHERE "isEmailVerified" IS NULL
    `);

    // Add indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email_verified" ON "users" ("isEmailVerified");
      CREATE INDEX IF NOT EXISTS "IDX_users_phone_verified" ON "users" ("isPhoneVerified");
      CREATE INDEX IF NOT EXISTS "IDX_users_kyc_verified" ON "users" ("isKycVerified");
      CREATE INDEX IF NOT EXISTS "IDX_users_locked_until" ON "users" ("lockedUntil");
      CREATE INDEX IF NOT EXISTS "IDX_users_login_attempts" ON "users" ("loginAttempts");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_email_verified";
      DROP INDEX IF EXISTS "IDX_users_phone_verified";
      DROP INDEX IF EXISTS "IDX_users_kyc_verified";
      DROP INDEX IF EXISTS "IDX_users_locked_until";
      DROP INDEX IF EXISTS "IDX_users_login_attempts";
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "isEmailVerified",
      DROP COLUMN IF EXISTS "emailVerifiedAt",
      DROP COLUMN IF EXISTS "isPhoneVerified",
      DROP COLUMN IF EXISTS "phoneVerifiedAt",
      DROP COLUMN IF EXISTS "isKycVerified",
      DROP COLUMN IF EXISTS "kycVerifiedAt",
      DROP COLUMN IF EXISTS "loginAttempts",
      DROP COLUMN IF EXISTS "lockedUntil",
      DROP COLUMN IF EXISTS "lastPasswordReset",
      DROP COLUMN IF EXISTS "twoFactorEnabled",
      DROP COLUMN IF EXISTS "twoFactorSecret"
    `);
  }
}