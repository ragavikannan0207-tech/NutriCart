import type { Id, IsoDateTime, NotificationType } from './common';

/** A real event-driven notification stored for the signed-in account. */
export interface AppNotification {
  id: Id;
  userId: Id;
  personProfileId: Id | null;
  type: NotificationType;
  title: string;
  message: string;
  /** Router path opened when the notification is clicked. */
  actionPath: string;
  isImportant: boolean;
  isRead: boolean;
  createdAt: IsoDateTime;
}

export const IMPORTANT_NOTIFICATION_TYPES: NotificationType[] = [
  'Order Confirmed',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Budget Warning',
  'Pantry Expiring',
];
