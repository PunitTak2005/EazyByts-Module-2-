import Watchlist from '../models/Watchlist.js';
import Stock from '../models/Stock.js';

class WatchlistService {
  async getWatchlistsSummary(userId) {
    const watchlists = await Watchlist.find({ userId });
    const populated = [];

    for (const wl of watchlists) {
      const stocksList = await Stock.find({ symbol: { $in: wl.stocks } }).select('-history');
      
      const populatedStocks = wl.stocks.map(sym => {
        const s = stocksList.find(st => st.symbol === sym);
        if (!s) return { symbol: sym, name: 'Unknown', price: 0, changePercent: 0 };
        const change = parseFloat((s.currentPrice - s.previousClose).toFixed(2));
        const pct = parseFloat(((change / s.previousClose) * 100).toFixed(2));
        return {
          symbol: s.symbol,
          name: s.companyName,
          price: s.currentPrice,
          change,
          changePercent: pct
        };
      });

      populated.push({
        _id: wl._id,
        name: wl.name,
        symbols: wl.stocks,
        stocks: populatedStocks
      });
    }

    return populated;
  }

  async create(userId, name) {
    const exists = await Watchlist.findOne({ userId, name: name.trim() });
    if (exists) throw new Error('Watchlist with this name already exists');

    return await Watchlist.create({
      userId,
      name: name.trim(),
      stocks: []
    });
  }

  async addStock(userId, watchlistId, symbol) {
    const wl = await Watchlist.findOne({ _id: watchlistId, userId });
    if (!wl) throw new Error('Watchlist not found');

    const sym = symbol.toUpperCase().trim();
    const stockExists = await Stock.findOne({ symbol: sym });
    if (!stockExists) throw new Error('Stock security not found');

    if (wl.stocks.includes(sym)) {
      throw new Error('Stock already exists in watchlist');
    }

    wl.stocks.push(sym);
    await wl.save();
    return wl;
  }

  async removeStock(userId, watchlistId, symbol) {
    const wl = await Watchlist.findOne({ _id: watchlistId, userId });
    if (!wl) throw new Error('Watchlist not found');

    const sym = symbol.toUpperCase().trim();
    wl.stocks = wl.stocks.filter(s => s !== sym);
    await wl.save();
    return wl;
  }

  async delete(userId, watchlistId) {
    const wl = await Watchlist.findOneAndDelete({ _id: watchlistId, userId });
    if (!wl) throw new Error('Watchlist not found');
    return { id: watchlistId, message: 'Watchlist deleted successfully' };
  }
}

export default new WatchlistService();
