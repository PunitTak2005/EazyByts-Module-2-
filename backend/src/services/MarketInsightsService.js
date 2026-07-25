import MarketDataService from './MarketDataService.js';
import axios from 'axios';
import Cache from '../models/Cache.js';

class MarketInsightsService {
  async getMarketOverview() {
    try {
      const [indices, gainers, losers, active] = await Promise.all([
        MarketDataService.getIndices(),
        MarketDataService.getTopGainers(),
        MarketDataService.getTopLosers(),
        MarketDataService.getMostActive()
      ]);

      return {
        indices,
        gainers,
        losers,
        active
      };
    } catch (error) {
      console.error('Error fetching market overview:', error.message);
      throw error;
    }
  }

  async getAiMarketSummary() {
    try {
      // Check cache first
      const cached = await Cache.findOne({ key: 'ai_market_summary' });
      if (cached && cached.expiresAt > new Date()) {
        return cached.value;
      }

      // Fetch market data to feed to AI
      const indices = await MarketDataService.getIndices();
      const gainers = await MarketDataService.getTopGainers();
      const losers = await MarketDataService.getTopLosers();

      let summary = '';
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const prompt = `
          Generate a 3-sentence daily market summary for a stock trading platform based on the following data:
          Indices: ${indices.map(i => `${i.name} (${i.changePercent?.toFixed(2)}%)`).join(', ')}.
          Top Gainers: ${gainers.slice(0,3).map(g => `${g.symbol} (+${g.changePercent?.toFixed(2)}%)`).join(', ')}.
          Top Losers: ${losers.slice(0,3).map(l => `${l.symbol} (${l.changePercent?.toFixed(2)}%)`).join(', ')}.
          Keep it professional, engaging, and concise. Do not use formatting like bold or bullet points.
        `;
        
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          contents: [{ parts: [{ text: prompt }] }]
        });
        
        summary = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } 
      
      if (!summary) {
        // Fallback programmatic summary
        const topIndex = indices.reduce((prev, current) => (prev && prev.changePercent > current.changePercent) ? prev : current, indices[0]);
        const direction = topIndex?.changePercent >= 0 ? 'gains' : 'losses';
        const topGainer = gainers[0]?.symbol;
        
        summary = `The market closed with mixed results today, led by ${direction} in major indices like the ${topIndex?.name || 'S&P 500'}. Highly active stocks like ${topGainer || 'AAPL'} saw significant movement as trading volumes surged. Investors remain cautious ahead of upcoming economic data and earnings reports.`;
      }

      const summaryText = summary.trim();

      // Cache for 6 hours
      await Cache.findOneAndUpdate(
        { key: 'ai_market_summary' },
        { 
          value: summaryText, 
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) 
        },
        { upsert: true, new: true }
      );

      return summaryText;
    } catch (error) {
      console.error('Error generating AI market summary:', error.message);
      return 'The market experienced typical volatility today. Major indices tracked closely with global economic trends. Tech and financial sectors continue to show interesting momentum shifts.';
    }
  }

  async getMarketSentiment() {
    try {
      const indices = await MarketDataService.getIndices();
      let positiveCount = 0;
      let totalCount = 0;
      
      indices.forEach(idx => {
        if (idx.changePercent !== undefined) {
          totalCount++;
          if (idx.changePercent > 0) positiveCount++;
        }
      });
      
      const ratio = totalCount > 0 ? positiveCount / totalCount : 0.5;
      
      let label = 'Neutral';
      if (ratio > 0.6) label = 'Bullish';
      if (ratio < 0.4) label = 'Bearish';

      return {
        score: Math.round(ratio * 100), // 0 to 100
        label,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { score: 50, label: 'Neutral', timestamp: new Date().toISOString() };
    }
  }
}

export default new MarketInsightsService();
