-- Project: per-project watermark text
ALTER TABLE "projects" ADD COLUMN "watermark_text" TEXT;

-- Password reset flow
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_type" "UserType" NOT NULL,
    "user_id" TEXT,
    "client_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");
CREATE INDEX "password_reset_tokens_client_id_idx" ON "password_reset_tokens"("client_id");
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- OTP email challenges
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "user_type" "UserType" NOT NULL,
    "user_id" TEXT,
    "client_id" TEXT,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otp_challenges_user_id_idx" ON "otp_challenges"("user_id");
CREATE INDEX "otp_challenges_client_id_idx" ON "otp_challenges"("client_id");
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges"("expires_at");
