export const normalizeCompleteStockDetails = (quote, summary, history) => {
  if (!quote) return null;

  const rawSymbol = quote.symbol || '';
  const companyName = quote.longName || quote.shortName || rawSymbol || 'Unknown';
  
  const rawPrice = quote.regularMarketPrice ?? quote.price ?? 0;
  const rawPrevClose = quote.regularMarketPreviousClose ?? 0;
  
  let rawChange = quote.regularMarketChange ?? 0;
  if (rawChange === 0 && rawPrice !== 0 && rawPrevClose !== 0) {
    rawChange = rawPrice - rawPrevClose;
  }
  
  let rawChangePercent = quote.regularMarketChangePercent ?? quote.changesPercentage ?? 0;
  if ((rawChangePercent === 0 || rawChangePercent === undefined) && rawChange !== 0 && rawPrevClose !== 0) {
    rawChangePercent = (rawChange / rawPrevClose) * 100;
  }

  const rawCurrency = quote.currency || 'USD';

  console.log('Raw API Response:', {
    symbol: rawSymbol,
    price: rawPrice,
    previousClose: rawPrevClose,
    change: rawChange,
    changesPercentage: rawChangePercent,
    currency: rawCurrency
  });

  const isINR = rawCurrency === 'INR' || (rawSymbol && (rawSymbol.endsWith('.NS') || rawSymbol.endsWith('.BO')));
  const exchangeRate = isINR ? 1 : 83;

  const price = Number((rawPrice * exchangeRate).toFixed(2));
  const previousClose = Number((rawPrevClose * exchangeRate).toFixed(2));
  const change = Number((rawChange * exchangeRate).toFixed(2));
  const changePercent = Number(Number(rawChangePercent).toFixed(2));

  // Extract from summary profile
  const assetProfile = summary?.assetProfile || {};
  const summaryProfile = summary?.summaryProfile || {};
  const defaultKeyStatistics = summary?.defaultKeyStatistics || {};
  const financialData = summary?.financialData || {};
  const summaryDetail = summary?.summaryDetail || {};

  const openVal = quote.regularMarketOpen ?? summaryDetail.open ?? 0;
  const dayHighVal = quote.regularMarketDayHigh ?? summaryDetail.dayHigh ?? 0;
  const dayLowVal = quote.regularMarketDayLow ?? summaryDetail.dayLow ?? 0;
  const yearHighVal = quote.fiftyTwoWeekHigh ?? summaryDetail.fiftyTwoWeekHigh ?? 0;
  const yearLowVal = quote.fiftyTwoWeekLow ?? summaryDetail.fiftyTwoWeekLow ?? 0;
  const marketCapVal = quote.marketCap ?? summaryDetail.marketCap ?? 0;

  const processedResponse = {
    symbol: rawSymbol,
    companyName,
    exchange: quote.fullExchangeName || quote.exchange || 'Unknown',
    currency: 'INR',
    marketState: quote.marketState || 'REGULAR',
    price,
    change,
    changePercent,
    previousClose,
    open: Number((openVal * exchangeRate).toFixed(2)),
    dayHigh: Number((dayHighVal * exchangeRate).toFixed(2)),
    dayLow: Number((dayLowVal * exchangeRate).toFixed(2)),
    yearHigh: Number((yearHighVal * exchangeRate).toFixed(2)),
    yearLow: Number((yearLowVal * exchangeRate).toFixed(2)),
    marketCap: Number((marketCapVal * exchangeRate).toFixed(2)),
    volume: quote.regularMarketVolume ?? summaryDetail.volume ?? 0,
    averageVolume: quote.averageDailyVolume3Month ?? summaryDetail.averageVolume ?? 0,
    peRatio: quote.trailingPE ?? summaryDetail.trailingPE ?? 0,
    eps: quote.epsTrailingTwelveMonths ?? defaultKeyStatistics.trailingEps ?? 0,
    dividendYield: quote.trailingAnnualDividendYield ?? summaryDetail.dividendYield ?? 0,
    beta: defaultKeyStatistics.beta ?? summaryDetail.beta ?? 0,
    sector: assetProfile.sector || summaryProfile.sector || 'Unknown',
    industry: assetProfile.industry || summaryProfile.industry || 'Unknown',
    description: assetProfile.longBusinessSummary || summaryProfile.longBusinessSummary || '',
    website: assetProfile.website || summaryProfile.website || '',
    history: {
      "1D": history?.["1D"] || [],
      "1W": history?.["1W"] || [],
      "1M": history?.["1M"] || [],
      "3M": history?.["3M"] || [],
      "6M": history?.["6M"] || [],
      "1Y": history?.["1Y"] || [],
      "5Y": history?.["5Y"] || [],
    }
  };

  console.log('Processed Backend Response:', processedResponse);

  return processedResponse;
};

