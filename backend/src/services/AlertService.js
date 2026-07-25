import Alert from '../models/Alert.js';
import Notification from '../models/Notification.js';
import Stock from '../models/Stock.js';
import SocketService from './SocketService.js';
import AppError from '../utils/AppError.js';

class AlertService {
  async createAlert(userId, symbol, targetPrice, type) {
    if (!['ABOVE', 'BELOW'].includes(type)) {
      throw new AppError('Invalid alert type', 400);
    }
    const alert = await Alert.create({
      userId,
      symbol: symbol.toUpperCase(),
      targetPrice,
      type,
      isActive: true
    });
    return alert;
  }

  async getAlerts(userId) {
    return await Alert.find({ userId }).sort({ createdAt: -1 });
  }

  async deleteAlert(userId, alertId) {
    const alert = await Alert.findOneAndDelete({ _id: alertId, userId });
    if (!alert) {
      throw new AppError('Alert not found', 404);
    }
    return alert;
  }

  async checkAlerts(stock) {
    // stock has { symbol, currentPrice }
    const activeAlerts = await Alert.find({ symbol: stock.symbol, isActive: true });
    
    for (const alert of activeAlerts) {
      let triggered = false;
      if (alert.type === 'ABOVE' && stock.currentPrice >= alert.targetPrice) {
        triggered = true;
      } else if (alert.type === 'BELOW' && stock.currentPrice <= alert.targetPrice) {
        triggered = true;
      }

      if (triggered) {
        // Trigger notification
        await Notification.create({
          userId: alert.userId,
          title: 'Price Alert Triggered',
          message: `${alert.symbol} is now ${alert.type === 'ABOVE' ? 'above' : 'below'} your target of ₹${alert.targetPrice.toFixed(2)}. Current price: ₹${stock.currentPrice.toFixed(2)}`,
          type: 'Price Alert'
        });

        // Mark inactive
        alert.isActive = false;
        await alert.save();

        // Emit socket event to update alerts UI if user is connected
        SocketService.broadcastToRoom(`user:${alert.userId}`, 'alertTriggered', { alertId: alert._id, symbol: alert.symbol });
      }
    }
  }
}

export default new AlertService();
