-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cmcUrl" TEXT NOT NULL,
    "coinSlug" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "currentStage" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobStageRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobStageRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "variantNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metaDescription" TEXT,
    "thumbnailPrompt" TEXT,
    "scoreJson" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArticleVariant_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SelectedArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "articleVariantId" TEXT NOT NULL,
    "variantNo" INTEGER NOT NULL,
    "bestAngle" TEXT,
    "whyBest" TEXT,
    "banRiskSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SelectedArticle_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SelectedArticle_articleVariantId_fkey" FOREIGN KEY ("articleVariantId") REFERENCES "ArticleVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublishResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "wordpressPostId" TEXT,
    "wordpressUrl" TEXT,
    "sheetRowId" TEXT,
    "telegramMessageId" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublishResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_coinSlug_idx" ON "Job"("coinSlug");

-- CreateIndex
CREATE INDEX "JobStageRun_jobId_stage_idx" ON "JobStageRun"("jobId", "stage");

-- CreateIndex
CREATE INDEX "JobStageRun_status_idx" ON "JobStageRun"("status");

-- CreateIndex
CREATE INDEX "ArticleVariant_jobId_idx" ON "ArticleVariant"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleVariant_jobId_variantNo_key" ON "ArticleVariant"("jobId", "variantNo");

-- CreateIndex
CREATE UNIQUE INDEX "SelectedArticle_jobId_key" ON "SelectedArticle"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectedArticle_articleVariantId_key" ON "SelectedArticle"("articleVariantId");

-- CreateIndex
CREATE INDEX "SelectedArticle_articleVariantId_idx" ON "SelectedArticle"("articleVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishResult_jobId_key" ON "PublishResult"("jobId");

-- CreateIndex
CREATE INDEX "PublishResult_wordpressPostId_idx" ON "PublishResult"("wordpressPostId");
