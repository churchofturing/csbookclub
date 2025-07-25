-- DropIndex
DROP INDEX "Reply_threadId_createdAt_idx";

-- DropIndex
DROP INDEX "Thread_topicId_pinned_lastBumped_idx";

-- CreateIndex
CREATE INDEX "Reply_threadId_createdAt_idx" ON "Reply"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Thread_topicId_pinned_lastBumped_idx" ON "Thread"("topicId", "pinned", "lastBumped");
