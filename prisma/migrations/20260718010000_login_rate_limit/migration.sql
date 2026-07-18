-- Backs the login rate-limit check in signIn() — no in-memory counter would
-- work correctly across serverless instances, so this is DB-backed.
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "login_attempts_email_created_at_idx" ON "login_attempts" ("email", "created_at");
