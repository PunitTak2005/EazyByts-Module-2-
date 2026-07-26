import Notification from '../models/Notification.js';

class NotificationService {
  async list(userId) {
    return await Notification.find({ userId })
      .select('_id title message type read readAt createdAt')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
  }

  async markRead(userId, notificationId) {
    const notif = await Notification.findOne({ _id: notificationId, userId });
    if (!notif) throw new Error('Notification alert not found');

    notif.read = true;
    notif.readAt = new Date();
    await notif.save();
    return notif;
  }

  async markAllRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return { updatedCount: result.modifiedCount };
  }

  async delete(userId, notificationId) {
    const notif = await Notification.findOneAndDelete({ _id: notificationId, userId });
    if (!notif) throw new Error('Notification alert not found');
    return { id: notificationId, message: 'Notification deleted successfully' };
  }
}

export default new NotificationService();
