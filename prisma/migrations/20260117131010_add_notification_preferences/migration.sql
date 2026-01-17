-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "notifyBudgetAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyGoalProgress" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyPayday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyUpcomingBills" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushSubscription" JSONB;
