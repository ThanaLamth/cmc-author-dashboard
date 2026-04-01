-- CreateTable
CREATE TABLE "PublishedPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "articleVariantId" TEXT NOT NULL,
    "variantNo" INTEGER NOT NULL,
    "publishOrder" INTEGER NOT NULL,
    "wordpressPostId" TEXT,
    "wordpressUrl" TEXT,
    "publishStatus" TEXT NOT NULL,
    "scheduledAt" DATETIME,
    "sheetRowId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublishedPost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishedPost_articleVariantId_fkey" FOREIGN KEY ("articleVariantId") REFERENCES "ArticleVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PublishedPost_jobId_publishOrder_idx" ON "PublishedPost"("jobId", "publishOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPost_jobId_variantNo_key" ON "PublishedPost"("jobId", "variantNo");
