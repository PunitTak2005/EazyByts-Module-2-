import { getSectorForSymbol } from './sectorMap.js';

/**
 * Normalizes a raw Yahoo Finance quote object to match the frontend schema.
 */
export const normalizeYahooQuote = (quote) => {
  if (!quote) return null;

  const rawSymbol = quote.symbol;
  const rawPrice = quote.regularMarketPrice ?? quote.price ?? 0;
  const rawPrevClose = quote.regularMarketPreviousClose ?? rawPrice;
  const rawChange = quote.regularMarketChange ?? (rawPrevClose !== 0 ? rawPrice - rawPrevClose : 0);
  const rawChangePercent = quote.regularMarketChangePercent ?? quote.changesPercentage;
  const rawCurrency = quote.currency || 'USD';

  console.log('Raw API Response:', {
    symbol: rawSymbol,
    price: rawPrice,
    previousClose: rawPrevClose,
    change: rawChange,
    changesPercentage: rawChangePercent,
    currency: rawCurrency
  });

  // Calculate percentage change using raw API field or pre-conversion values
  let changePercent = rawChangePercent;
  if (changePercent === undefined || changePercent === null || isNaN(changePercent)) {
    if (rawPrevClose && rawPrevClose !== 0) {
      changePercent = ((rawPrice - rawPrevClose) / rawPrevClose) * 100;
    } else {
      changePercent = 0;
    }
  }

  // Currency conversion (USD -> INR) occurs ONLY ONCE on backend
  const isINR = rawCurrency === 'INR' || (rawSymbol && (rawSymbol.endsWith('.NS') || rawSymbol.endsWith('.BO')));
  const exchangeRate = isINR ? 1 : 83;

  const price = rawPrice * exchangeRate;
  const prevClose = rawPrevClose * exchangeRate;
  const change = rawChange * exchangeRate;

  const companyName = quote.longName || quote.shortName || rawSymbol;
  const mappedSector = getSectorForSymbol(rawSymbol, 'Equities');

  const processedResponse = {
    symbol: rawSymbol,
    companyName,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(Number(changePercent).toFixed(2)),
    currency: 'INR',
    prevClose: Number(prevClose.toFixed(2)),
    openPrice: Number((quote.regularMarketOpen ? quote.regularMarketOpen * exchangeRate : price).toFixed(2)),
    highPrice: Number((quote.regularMarketDayHigh ? quote.regularMarketDayHigh * exchangeRate : price).toFixed(2)),
    lowPrice: Number((quote.regularMarketDayLow ? quote.regularMarketDayLow * exchangeRate : price).toFixed(2)),
    volume: quote.regularMarketVolume || 0,
    marketCap: (quote.marketCap || 0) * exchangeRate,
    sector: quote.sector || mappedSector,
    marketState: quote.marketState || 'REGULAR',
    exchange: quote.fullExchangeName || quote.exchange || 'Unknown'
  };

  console.log('Processed Backend Response:', processedResponse);

  return processedResponse;
};



