-- DropIndex
DROP INDEX "Thread_lastBumped_idx";

-- DropIndex
DROP INDEX "Thread_pinned_idx";

-- DropIndex
DROP INDEX "Thread_topicId_idx";

-- CreateIndex
CREATE INDEX "Thread_topicId_pinned_lastBumped_idx" ON "Thread"("topicId", "pinned" DESC, "lastBumped" DESC);
