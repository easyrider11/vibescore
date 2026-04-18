-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN "publicReportToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_publicReportToken_key" ON "InterviewSession"("publicReportToken");
