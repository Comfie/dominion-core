/**
 * Push notification utilities for Dominion Core
 */

// VAPID public key would typically come from env, but for local notifications we don't need it
const NOTIFICATION_ICON = '/icon-192x192.png';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported in this browser');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Send a local notification (works when app is in foreground)
 */
export async function sendLocalNotification(options: NotificationOptions): Promise<boolean> {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    // Use service worker if available for better reliability
    if (isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || NOTIFICATION_ICON,
        badge: options.badge || '/icon-96x96.png',
        tag: options.tag,
        data: options.data,
      });
    } else {
      // Fallback to basic Notification API
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || NOTIFICATION_ICON,
        tag: options.tag,
        data: options.data,
      });
    }
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Pre-defined notification types
 */
export const NotificationTypes = {
  budgetAlert: (category: string, percentage: number) => ({
    title: '⚠️ Budget Alert',
    body: `You've used ${percentage}% of your ${category} budget`,
    tag: `budget-${category}`,
    data: { type: 'budget_alert', category },
  }),

  upcomingBill: (name: string, amount: number, daysUntil: number) => ({
    title: '📅 Upcoming Bill',
    body: daysUntil === 0 
      ? `${name} (R${amount.toLocaleString()}) is due today!`
      : `${name} (R${amount.toLocaleString()}) is due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
    tag: `bill-${name}`,
    data: { type: 'upcoming_bill', name, amount, daysUntil },
  }),

  paydayReminder: (daysUntil: number) => ({
    title: '💰 Payday Coming!',
    body: daysUntil === 0 
      ? 'Today is payday! 🎉'
      : `Payday in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
    tag: 'payday',
    data: { type: 'payday_reminder', daysUntil },
  }),

  goalProgress: (goalName: string, percentage: number) => ({
    title: '🎯 Goal Update',
    body: percentage >= 100 
      ? `Congratulations! You've reached your "${goalName}" goal! 🎉`
      : `You're ${percentage}% of the way to "${goalName}"`,
    tag: `goal-${goalName}`,
    data: { type: 'goal_progress', goalName, percentage },
  }),

  goalMilestone: (goalName: string, milestone: number) => ({
    title: '🏆 Milestone Reached!',
    body: `You've hit ${milestone}% on your "${goalName}" goal!`,
    tag: `goal-milestone-${goalName}`,
    data: { type: 'goal_milestone', goalName, milestone },
  }),
};

/**
 * Schedule a notification check (to be called periodically)
 */
export async function checkAndSendNotifications(
  settings: {
    notifyBudgetAlerts: boolean;
    notifyUpcomingBills: boolean;
    notifyPayday: boolean;
    notifyGoalProgress: boolean;
    payday: number;
  },
  upcomingBills: Array<{ name: string; amount: number; daysUntil: number }>,
  budgetStatus: Array<{ category: string; percentage: number }>,
  goals: Array<{ name: string; percentage: number }>
): Promise<void> {
  const today = new Date();
  const currentDay = today.getDate();

  // Payday reminder (3 days before, 1 day before, and on payday)
  if (settings.notifyPayday) {
    const daysUntilPayday = (settings.payday - currentDay + 31) % 31;
    if (daysUntilPayday <= 3 || daysUntilPayday === 0) {
      await sendLocalNotification(NotificationTypes.paydayReminder(daysUntilPayday));
    }
  }

  // Upcoming bills (3 days before)
  if (settings.notifyUpcomingBills) {
    for (const bill of upcomingBills) {
      if (bill.daysUntil <= 3 && bill.daysUntil >= 0) {
        await sendLocalNotification(NotificationTypes.upcomingBill(bill.name, bill.amount, bill.daysUntil));
      }
    }
  }

  // Budget alerts (over 80%)
  if (settings.notifyBudgetAlerts) {
    for (const budget of budgetStatus) {
      if (budget.percentage >= 80) {
        await sendLocalNotification(NotificationTypes.budgetAlert(budget.category, budget.percentage));
      }
    }
  }

  // Goal milestones (25%, 50%, 75%, 100%)
  if (settings.notifyGoalProgress) {
    for (const goal of goals) {
      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (goal.percentage >= milestone && goal.percentage < milestone + 5) {
          await sendLocalNotification(NotificationTypes.goalMilestone(goal.name, milestone));
          break;
        }
      }
    }
  }
}
