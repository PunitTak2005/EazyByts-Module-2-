export const SECTOR_MAP = {
  // US Mega Cap Tech
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'AMZN': 'Consumer Cyclical', 'META': 'Technology', 'NVDA': 'Technology', 'TSLA': 'Automotive',
  // Finance & Payments
  'V': 'Financial Services', 'MA': 'Financial Services', 'JPM': 'Financial Services', 'BAC': 'Financial Services', 'GS': 'Financial Services', 'MS': 'Financial Services', 'PYPL': 'Financial Services', 'SQ': 'Financial Services',
  // Consumer & Retail
  'WMT': 'Retail', 'TGT': 'Retail', 'COST': 'Retail', 'KO': 'Consumer Defensive', 'PEP': 'Consumer Defensive', 'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical', 'SBUX': 'Consumer Cyclical',
  // Healthcare & Pharma
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'ABBV': 'Healthcare', 'LLY': 'Healthcare', 'MRK': 'Healthcare', 'TMO': 'Healthcare',
  // Energy & Industrials
  'XOM': 'Energy', 'CVX': 'Energy', 'BA': 'Industrials', 'CAT': 'Industrials', 'DE': 'Industrials', 'GE': 'Industrials', 'HON': 'Industrials',
  // Media & Telecom
  'DIS': 'Entertainment', 'NFLX': 'Entertainment', 'CMCSA': 'Entertainment', 'T': 'Telecommunications', 'VZ': 'Telecommunications', 'TMUS': 'Telecommunications',
  // High-Growth & SaaS
  'CRM': 'Technology', 'ADBE': 'Technology', 'NOW': 'Technology', 'SNOW': 'Technology', 'DDOG': 'Technology', 'CRWD': 'Technology', 'PLTR': 'Technology',
  // EV & Auto
  'RIVN': 'Automotive', 'LCID': 'Automotive', 'F': 'Automotive', 'GM': 'Automotive', 'TM': 'Automotive', 'HMC': 'Automotive', 'FSR': 'Automotive', 'NKLA': 'Automotive', 'RIDE': 'Automotive', 'WKHS': 'Automotive', 'GOEV': 'Automotive',
  // Crypto & Fintech
  'COIN': 'Financial Services', 'HOOD': 'Financial Services', 'MARA': 'Financial Services', 'RIOT': 'Financial Services', 'MSTR': 'Technology',
  'CLSK': 'Financial Services', 'HUT': 'Financial Services', 'BITF': 'Financial Services', 'HIVE': 'Financial Services', 'ANY': 'Financial Services', 'GREE': 'Financial Services', 'SDIG': 'Financial Services', 'CIFR': 'Financial Services', 'WULF': 'Financial Services', 'IREN': 'Financial Services', 'BTBT': 'Financial Services', 'MIGI': 'Financial Services', 'CORZ': 'Financial Services', 'ARBK': 'Financial Services', 'GLXY': 'Financial Services', 'HUT8': 'Financial Services',
  
  // Semiconductors
  'AMD': 'Technology', 'INTC': 'Technology', 'TSM': 'Technology', 'ASML': 'Technology', 'AVGO': 'Technology', 'QCOM': 'Technology', 'TXN': 'Technology', 'MU': 'Technology',
  // Biotech
  'MRNA': 'Healthcare', 'BNTX': 'Healthcare', 'NVAX': 'Healthcare', 'VRTX': 'Healthcare', 'REGN': 'Healthcare', 'GILD': 'Healthcare', 'BIIB': 'Healthcare',
  // E-commerce
  'BABA': 'Consumer Cyclical', 'JD': 'Consumer Cyclical', 'PDD': 'Consumer Cyclical', 'MELI': 'Consumer Cyclical', 'SE': 'Technology', 'SHOP': 'Technology', 'EBAY': 'Consumer Cyclical',
  // Travel & Hospitality
  'ABNB': 'Consumer Cyclical', 'BKNG': 'Consumer Cyclical', 'EXPE': 'Consumer Cyclical', 'MAR': 'Consumer Cyclical', 'HLT': 'Consumer Cyclical', 'RCL': 'Consumer Cyclical', 'CCL': 'Consumer Cyclical',
  // Cybersecurity
  'PANW': 'Technology', 'FTNT': 'Technology', 'ZS': 'Technology', 'NET': 'Technology', 'OKTA': 'Technology', 'CHKP': 'Technology',
  // Cloud & Infrastructure
  'DOCN': 'Technology', 'FSLY': 'Technology', 'TTD': 'Technology', 'LMND': 'Financial Services', 'UPST': 'Financial Services', 'AI': 'Technology', 'PATH': 'Technology', 'TOST': 'Technology', 'MNDY': 'Technology', 'ASAN': 'Technology', 'BILL': 'Technology', 'BSY': 'Technology',
  
  // Banks (from the list)
  'SI': 'Financial Services', 'SBNY': 'Financial Services', 'FRC': 'Financial Services', 'SIVB': 'Financial Services', 'PACW': 'Financial Services', 'WAL': 'Financial Services', 'ZION': 'Financial Services',

  // Indian Large Cap
  'RELIANCE.NS': 'Energy', 'TCS.NS': 'Technology', 'INFY.NS': 'Technology', 'HDFCBANK.NS': 'Financial Services', 'ICICIBANK.NS': 'Financial Services',
  'SBIN.NS': 'Financial Services', 'BHARTIARTL.NS': 'Telecommunications', 'ITC.NS': 'Consumer Defensive', 'HINDUNILVR.NS': 'Consumer Defensive', 'LT.NS': 'Industrials',
  'BAJFINANCE.NS': 'Financial Services', 'KOTAKBANK.NS': 'Financial Services', 'AXISBANK.NS': 'Financial Services', 'MARUTI.NS': 'Automotive', 'ASIANPAINT.NS': 'Consumer Cyclical',
  // Indian Mid Cap
  'BEL.NS': 'Industrials', 'BSE.NS': 'Financial Services', 'CDSL.NS': 'Financial Services', 'KPITTECH.NS': 'Technology', 'PERSISTENT.NS': 'Technology',
  'POLYCAB.NS': 'Industrials', 'RVNL.NS': 'Industrials', 'IRFC.NS': 'Financial Services', 'IREDA.NS': 'Financial Services', 'NHPC.NS': 'Utilities',
  'HUDCO.NS': 'Financial Services', 'MAZDOCK.NS': 'Industrials', 'COCHINSHIP.NS': 'Industrials', 'CYIENT.NS': 'Technology', 'IDFCFIRSTB.NS': 'Financial Services',
  'TATAELXSI.NS': 'Technology', 'LTIM.NS': 'Technology', 'COFORGE.NS': 'Technology', 'MPHASIS.NS': 'Technology', 'LTTS.NS': 'Technology',
  // Indian Small Cap
  'BLS.NS': 'Industrials', 'RAILTEL.NS': 'Telecommunications', 'RITES.NS': 'Industrials', 'IRCTC.NS': 'Industrials', 'NBCC.NS': 'Industrials',
  'J&KBANK.NS': 'Financial Services', 'UCOBANK.NS': 'Financial Services', 'IOB.NS': 'Financial Services', 'MAHABANK.NS': 'Financial Services', 'PSB.NS': 'Financial Services',
  'SUZLON.NS': 'Industrials', 'JPPOWER.NS': 'Utilities', 'RPOWER.NS': 'Utilities', 'GMRINFRA.NS': 'Industrials', 'IRB.NS': 'Industrials'
};

export const getSectorForSymbol = (symbol, defaultSector = 'Equities') => {
  if (!symbol) return defaultSector;
  return SECTOR_MAP[symbol.toUpperCase()] || defaultSector;
};
