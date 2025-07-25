-- DropIndex
DROP INDEX "Reply_threadId_createdAt_idx";

-- DropIndex
DROP INDEX "Thread_pinned_lastBumped_idx";

-- CreateIndex
CREATE INDEX "Reply_threadId_createdAt_idx" ON "Reply"("threadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Thread_pinned_idx" ON "Thread"("pinned");

-- CreateIndex
CREATE INDEX "Thread_lastBumped_idx" ON "Thread"("lastBumped" DESC);

-- CreateIndex
CREATE INDEX "Topic_slug_idx" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");
