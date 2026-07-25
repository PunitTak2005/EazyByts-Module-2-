import AnalyticsService from '../services/AnalyticsService.js';
import { sendSuccess } from './authController.js';

export const getFullAnalytics = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getFullDashboard(req.user._id);
    return sendSuccess(res, 'Full analytics retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const getPerformance = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getPerformanceMetrics(req.user._id);
    return sendSuccess(res, 'Performance metrics retrieved', {
      winRate: result.winRate,
      lossRate: result.lossRate,
      winCount: result.winCount,
      lossCount: result.lossCount,
      bestTrade: result.bestTrade,
      worstTrade: result.worstTrade
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioAnalytics = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getPerformanceMetrics(req.user._id);
    return sendSuccess(res, 'Portfolio analytics details retrieved', {
      netWorth: result.netWorth,
      totalInvestment: result.totalInvestment,
      currentValue: result.currentValue,
      totalProfitLoss: result.totalProfitLoss,
      overallReturnPercent: result.overallReturnPercent
    });
  } catch (error) {
    next(error);
  }
};

export const getReturns = async (req, res, next) => {
  try {
    const returns = await AnalyticsService.getReturnsBreakdown(req.user._id);
    return sendSuccess(res, 'Returns analysis completed', returns);
  } catch (error) {
    next(error);
  }
};

export const getSectorsAllocation = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getPerformanceMetrics(req.user._id);
    return sendSuccess(res, 'Sectors allocation weights retrieved', result.sectorsAllocation);
  } catch (error) {
    next(error);
  }
};

export const getHistoryCurve = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getPerformanceMetrics(req.user._id);
    return sendSuccess(res, 'Historical net worth progress chart points retrieved', result.performanceCurve);
  } catch (error) {
    next(error);
  }
};

export const generateReport = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const result = await AnalyticsService.getPerformanceMetrics(req.user._id);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=TickerSim_Report_${Date.now()}.csv`);
      
      let csv = 'Portfolio Summary Metrics\n';
      csv += `Net Worth,${result.netWorth}\n`;
      csv += `Invested Value,${result.totalInvestment}\n`;
      csv += `Current Value,${result.currentValue}\n`;
      csv += `Win Rate,${result.winRate}%\n`;
      
      return res.status(200).send(csv);
    }
    
    return res.status(400).json({ success: false, message: 'Invalid format requested. Use csv.' });
  } catch (error) {
    next(error);
  }
};

export const getReportsList = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Reports list retrieved', [
      { id: '1', name: 'Initial Portfolio Audit', date: new Date().toISOString(), format: 'CSV' }
    ]);
  } catch (error) {
    next(error);
  }
};
