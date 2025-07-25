-- CreateIndex
CREATE INDEX "Reply_threadId_idx" ON "Reply"("threadId");

-- CreateIndex
CREATE INDEX "Reply_threadId_createdAt_idx" ON "Reply"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Reply_createdById_idx" ON "Reply"("createdById");

-- CreateIndex
CREATE INDEX "Thread_topicId_idx" ON "Thread"("topicId");

-- CreateIndex
CREATE INDEX "Thread_pinned_lastBumped_idx" ON "Thread"("pinned", "lastBumped");

-- CreateIndex
CREATE INDEX "Thread_createdById_idx" ON "Thread"("createdById");
