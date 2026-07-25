/**
 * learningSeeds.js
 * Run with: node backend/src/seeds/learningSeeds.js
 * Seeds Courses, Lessons, Quizzes, GlossaryTerms, Achievements
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import GlossaryTerm from '../models/GlossaryTerm.js';
import Achievement from '../models/Achievement.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/stock-simulator';

// ──────────────────────────────────────────────────────────────────────────────
// GLOSSARY TERMS
// ──────────────────────────────────────────────────────────────────────────────
const loadGlossaryDataset = () => {
  try {
    const rootData = path.resolve(__dirname, '../../../data/glossary/glossary.json');
    const publicData = path.resolve(__dirname, '../../../frontend/public/data/glossary/glossary.json');
    const gPath = fs.existsSync(rootData) ? rootData : publicData;
    if (fs.existsSync(gPath)) {
      const raw = fs.readFileSync(gPath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed.data || [];
    }
  } catch (e) {
    console.error('Error loading glossary dataset in learningSeeds:', e.message);
  }
  return [];
};
const GLOSSARY_TERMS = loadGlossaryDataset();

// ──────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ──────────────────────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  {
    key: 'first_lesson',
    title: 'First Step',
    description: 'Complete your very first lesson in the Learning Center.',
    icon: '🎓',
    xpReward: 50,
  },
  {
    key: 'beginner_investor',
    title: 'Beginner Investor',
    description: 'Complete the Beginner course track.',
    icon: '🌱',
    xpReward: 200,
  },
  {
    key: 'technical_analyst',
    title: 'Technical Analyst',
    description: 'Complete the Intermediate course track.',
    icon: '📈',
    xpReward: 400,
  },
  {
    key: 'portfolio_master',
    title: 'Portfolio Master',
    description: 'Complete the Advanced course track.',
    icon: '🎯',
    xpReward: 800,
  },
  {
    key: 'quiz_champion',
    title: 'Quiz Champion',
    description: 'Score 100% on any quiz.',
    icon: '🏆',
    xpReward: 100,
  },
  {
    key: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Maintain a 7-day learning streak.',
    icon: '🔥',
    xpReward: 150,
  },
  {
    key: 'monthly_master',
    title: 'Monthly Master',
    description: 'Maintain a 30-day learning streak.',
    icon: '⚡',
    xpReward: 500,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// COURSES & LESSONS
// ──────────────────────────────────────────────────────────────────────────────
const COURSE_DATA = [
  // ── BEGINNER ────────────────────────────────────────────────────────────────
  {
    title: 'Stock Market Fundamentals',
    slug: 'stock-market-fundamentals',
    description:
      'Build a solid foundation in stock market investing. Learn how markets work, what stocks are, and how to start your investment journey with confidence.',
    level: 'beginner',
    category: 'Investing Basics',
    tags: ['stocks', 'investing', 'beginner', 'markets'],
    estimatedHours: 3,
    xpReward: 200,
    order: 1,
    lessons: [
      {
        title: 'What is the Stock Market?',
        slug: 'what-is-the-stock-market',
        estimatedMinutes: 10,
        difficulty: 'beginner',
        xpReward: 50,
        order: 1,
        summary:
          'Understand the stock market as a marketplace where buyers and sellers trade ownership stakes in companies.',
        keyTakeaways: [
          'A stock market is a regulated exchange for buying and selling company shares.',
          'Two major Indian exchanges are BSE (Bombay Stock Exchange) and NSE (National Stock Exchange).',
          'Stock prices are driven by supply and demand and reflect a company\'s perceived value.',
          'Investors participate to grow wealth; companies list to raise capital.',
        ],
        glossaryTerms: ['Stock', 'Market Cap', 'Liquidity'],
        simulatorContext: 'stocks',
        content: `## What is the Stock Market?

The **stock market** is a collection of exchanges and markets where buyers and sellers come together to trade shares of publicly listed companies. Think of it like a giant bazaar — but instead of vegetables or clothing, people buy and sell small ownership stakes in businesses.

### How Does It Work?

When a company needs money to grow, it can "go public" by listing its shares on a stock exchange. This is called an **Initial Public Offering (IPO)**. After the IPO, existing shareholders can sell their shares to other investors on the secondary market.

> **Real-world analogy**: Imagine a pizza restaurant expanding to 10 cities. Instead of borrowing from a bank, it sells 40% of its business to the public in exchange for capital. Every person who buys a share becomes a part-owner.

### Key Indian Exchanges

| Exchange | Full Name | Notable Index |
|----------|-----------|---------------|
| **BSE** | Bombay Stock Exchange | SENSEX (Top 30 companies) |
| **NSE** | National Stock Exchange | NIFTY 50 (Top 50 companies) |

### Who Participates?

- **Retail Investors** – Individuals like you
- **Institutional Investors** – Mutual funds, insurance companies, pension funds
- **Foreign Institutional Investors (FIIs)** – Global funds investing in India
- **Market Makers** – Entities that ensure market liquidity

### How Are Prices Determined?

Stock prices change constantly based on **supply and demand**. When more people want to buy a stock than sell it, the price rises. When more want to sell, the price falls. This is influenced by:

- Company earnings and financial health
- Economic indicators (GDP, inflation, interest rates)
- Investor sentiment and news
- Global market trends

### Key Takeaways

✅ The stock market connects companies needing capital with investors seeking returns  
✅ India has two primary exchanges: BSE and NSE  
✅ Stock prices reflect the collective judgment of all market participants  
✅ You can start investing with as little as ₹500 through ETFs or mutual funds
`,
        quiz: {
          title: 'Stock Market Basics Quiz',
          questions: [
            {
              text: 'What does BSE stand for?',
              type: 'mcq',
              options: [
                'Bombay Stock Exchange',
                'Business Stock Exchange',
                'Bangalore Stock Exchange',
                'Bond Securities Exchange',
              ],
              correctIndex: 0,
              explanation:
                'BSE stands for Bombay Stock Exchange, the oldest stock exchange in Asia, founded in 1875.',
            },
            {
              text: 'When a company sells its shares to the public for the first time, it is called:',
              type: 'mcq',
              options: ['Secondary offering', 'IPO', 'Bond issuance', 'Stock split'],
              correctIndex: 1,
              explanation:
                'An IPO (Initial Public Offering) is the first sale of stock by a company to the general public.',
            },
            {
              text: 'Stock prices are primarily driven by supply and demand.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation:
                'True. When more buyers than sellers exist, prices rise; when more sellers exist, prices fall.',
            },
          ],
        },
      },
      {
        title: 'How Stock Exchanges Work',
        slug: 'how-stock-exchanges-work',
        estimatedMinutes: 12,
        difficulty: 'beginner',
        xpReward: 50,
        order: 2,
        summary:
          'Learn the mechanics of stock exchanges, order types, settlement cycles, and SEBI\'s regulatory role.',
        keyTakeaways: [
          'Stock exchanges provide a transparent, regulated platform for trading.',
          'SEBI (Securities and Exchange Board of India) regulates the Indian market.',
          'Trades settle in T+1 days in India (next business day).',
          'Orders flow from brokers to exchanges through an electronic order book.',
        ],
        glossaryTerms: ['Limit Order', 'Liquidity', 'Stop Loss'],
        simulatorContext: 'stocks',
        content: `## How Stock Exchanges Work

A stock exchange is not just a building — it is a sophisticated electronic ecosystem that matches millions of buy and sell orders every second.

### The Trading Chain

\`\`\`
You (Investor)
    ↓
Your Broker (Zerodha, Groww, Upstox)
    ↓
Exchange (NSE / BSE)
    ↓
Counterparty Broker
    ↓
Counterparty Investor
\`\`\`

### Order Matching System

Exchanges use an **electronic order book** that constantly matches buy orders with sell orders. Orders are matched based on:
1. **Price Priority** – Best price gets priority
2. **Time Priority** – For the same price, earlier orders execute first

### Order Types

| Order Type | Description | When to Use |
|------------|-------------|-------------|
| **Market Order** | Buy/sell immediately at current price | When speed matters |
| **Limit Order** | Buy/sell at a specified price or better | When price matters |
| **Stop-Loss Order** | Sell when price falls below a level | Risk management |

### SEBI – The Market Regulator

**SEBI (Securities and Exchange Board of India)** is the watchdog of Indian capital markets. It:
- Registers brokers, mutual funds, and exchanges
- Prevents insider trading and market manipulation
- Ensures fair disclosure of company information
- Protects retail investor interests

### Settlement Cycle

In India, stock trades now settle on **T+1** (Trade plus 1 business day). This means:
- If you buy stock on Monday, shares are credited to your Demat account by Tuesday
- Funds are debited from your trading account accordingly

### Demat & Trading Accounts

To trade stocks in India, you need:
- **Demat Account** – Holds your shares electronically (like a bank for stocks)
- **Trading Account** – Allows you to place buy/sell orders
- **Bank Account** – Linked for fund transfers

Both are provided by your broker.
`,
        quiz: null,
      },
      {
        title: 'Stocks vs Mutual Funds vs ETFs',
        slug: 'stocks-vs-mutual-funds-vs-etfs',
        estimatedMinutes: 15,
        difficulty: 'beginner',
        xpReward: 60,
        order: 3,
        summary:
          'Compare individual stocks, mutual funds, and ETFs to decide which investment vehicle suits your goals.',
        keyTakeaways: [
          'Individual stocks offer high potential returns but require research and carry company-specific risk.',
          'Mutual funds are professionally managed but charge expense ratios.',
          'ETFs combine the diversification of mutual funds with the liquidity of stocks.',
          'Beginners should start with diversified ETFs or index funds.',
        ],
        glossaryTerms: ['ETF', 'Mutual Fund', 'Stock', 'Diversification'],
        simulatorContext: 'stocks',
        content: `## Stocks vs Mutual Funds vs ETFs

Choosing between these three investment vehicles is one of the first decisions every investor faces.

### 1. Individual Stocks

**What it is**: Buying shares directly in a single company.

**Pros**:
- Highest potential returns if you pick the right company
- No expense ratio (management fees)
- Full control over your investments

**Cons**:
- Requires significant research
- High company-specific risk
- Need capital to diversify (₹50,000+ for meaningful diversification)

**Best for**: Experienced investors who can research companies deeply.

---

### 2. Mutual Funds

**What it is**: A pool of money from many investors, managed by a professional fund manager.

**Pros**:
- Professional management
- Built-in diversification
- Start with as little as ₹500 via SIP

**Cons**:
- Expense ratio (0.5-2% annually)
- Cannot be traded during market hours like a stock
- Returns limited by fund manager decisions

**Types of Mutual Funds**:
- Equity Funds (invest in stocks)
- Debt Funds (invest in bonds)
- Hybrid Funds (mix of both)
- Index Funds (track a market index)

---

### 3. ETFs (Exchange Traded Funds)

**What it is**: A basket of securities that trades on a stock exchange like a single stock.

**Pros**:
- Low expense ratio (0.05-0.3%)
- Tradeable throughout the day
- Automatically diversified (often tracking an index)
- Transparent holdings

**Cons**:
- Subject to market price fluctuations during the day
- Brokerage commission on each trade

**Popular Indian ETFs**:
- Nippon India ETF Nifty 50
- HDFC Sensex ETF
- SBI Nifty Next 50 ETF

---

### Quick Comparison

| Feature | Stocks | Mutual Funds | ETFs |
|---------|--------|--------------|------|
| Management | You | Fund Manager | Passive/Index |
| Minimum Investment | 1 share (₹10–₹5,000) | ₹500 SIP | 1 unit (₹50–₹500) |
| Diversification | Low | High | High |
| Expense Ratio | None | 0.5–2% | 0.05–0.3% |
| Tradeable intraday | ✅ | ❌ | ✅ |

### 💡 Recommendation for Beginners

Start with a **Nifty 50 ETF** — you get exposure to India's top 50 companies, low costs, and great diversification in a single purchase.
`,
        quiz: {
          title: 'Stocks vs Funds Quiz',
          questions: [
            {
              text: 'Which investment vehicle has the LOWEST expense ratio on average?',
              type: 'mcq',
              options: ['Individual Stocks', 'Actively Managed Mutual Funds', 'ETFs', 'ULIP Plans'],
              correctIndex: 2,
              explanation:
                'ETFs typically have expense ratios of 0.05-0.3%, much lower than actively managed mutual funds (0.5-2%) and ULIPs.',
            },
            {
              text: 'Mutual funds can be traded throughout the trading day, just like stocks.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. Mutual funds are priced at the end of the trading day (NAV), not intraday. ETFs can be traded throughout the day.',
            },
            {
              text: 'A Nifty 50 ETF gives you exposure to:',
              type: 'mcq',
              options: [
                'Only 1 company',
                'The top 50 companies listed on NSE',
                'All listed companies in India',
                'Only IT sector companies',
              ],
              correctIndex: 1,
              explanation:
                'The Nifty 50 is an index of the 50 largest and most liquid companies on the National Stock Exchange.',
            },
          ],
        },
      },
      {
        title: 'Understanding IPOs',
        slug: 'understanding-ipos',
        estimatedMinutes: 12,
        difficulty: 'beginner',
        xpReward: 50,
        order: 4,
        summary:
          'Understand what happens when a company goes public and how retail investors can participate in IPOs.',
        keyTakeaways: [
          'IPO lets companies raise capital by selling shares to the public for the first time.',
          'SEBI mandates a DRHP (Draft Red Herring Prospectus) for transparency.',
          'Retail investors can apply through their broker using UPI or ASBA.',
          'Shares are allotted via lottery if an IPO is oversubscribed.',
        ],
        glossaryTerms: ['IPO', 'Market Cap'],
        simulatorContext: 'stocks',
        content: `## Understanding IPOs

An **Initial Public Offering (IPO)** is one of the most exciting events in the financial world. It's when a private company opens its doors to public investors for the first time.

### Why Do Companies Go Public?

- **Raise Capital** for expansion, R&D, or debt repayment
- **Provide liquidity** to early investors and founders
- **Build brand credibility** and public trust
- **Use stock as currency** for future acquisitions

### The IPO Process

\`\`\`
Company Decision
    ↓
Hire Investment Bank (Book Running Lead Manager)
    ↓
File DRHP with SEBI
    ↓
SEBI Review & Approval
    ↓
Road Show (marketing to investors)
    ↓
Price Band Announced
    ↓
Subscription Window (3 days for retail)
    ↓
Allotment & Listing
\`\`\`

### How to Apply for an IPO

1. Open your broker app (Zerodha, Groww, etc.)
2. Find the IPO under the IPO section
3. Enter your UPI ID and bid at the cut-off or a specific price
4. Funds are blocked (not debited) via UPI mandate
5. If allotted, shares appear in your Demat account on listing day
6. If not allotted, funds are released immediately

### Key Terms

| Term | Meaning |
|------|---------|
| **DRHP** | Draft Red Herring Prospectus – the IPO document |
| **Price Band** | Range within which you can bid (e.g., ₹900-₹950) |
| **Cut-off Price** | Final IPO price determined post-subscription |
| **GMP** | Grey Market Premium – unofficial pre-listing price expectation |
| **Oversubscription** | More shares applied for than available |
| **Allotment** | How many shares you receive |

### IPO Risk vs Reward

**Not all IPOs are winners.** Many high-profile IPOs have listed below issue price. Always research:
- Company financials and growth track record
- Industry prospects and competition
- Promoter credibility
- Valuation vs peers

### 💡 Pro Tip

Apply in the retail quota at the cut-off price to maximize allotment probability. Avoid applying only at the lower band in popular IPOs.
`,
        quiz: null,
      },
      {
        title: 'Risk vs Reward in Investing',
        slug: 'risk-vs-reward-in-investing',
        estimatedMinutes: 10,
        difficulty: 'beginner',
        xpReward: 50,
        order: 5,
        summary:
          'Learn the fundamental relationship between risk and reward and how to assess your own risk tolerance.',
        keyTakeaways: [
          'Higher potential returns always come with higher risk.',
          'Risk tolerance depends on time horizon, income stability, and emotional capacity.',
          'Diversification reduces unsystematic risk but cannot eliminate systematic risk.',
          'Asset allocation (stocks vs bonds) is the most powerful risk management tool.',
        ],
        glossaryTerms: ['Volatility', 'Diversification', 'CAGR'],
        simulatorContext: 'portfolio',
        content: `## Risk vs Reward in Investing

The most fundamental principle of investing: **higher potential returns always come with higher risk**. Understanding and managing this relationship is the foundation of successful investing.

### Types of Risk

| Risk Type | Description | Can Be Reduced? |
|-----------|-------------|-----------------|
| **Market Risk** | Overall market decline (2008, COVID crash) | Partially |
| **Company Risk** | Company-specific bad news | Yes, by diversifying |
| **Liquidity Risk** | Cannot sell when you need to | Yes, buy liquid assets |
| **Inflation Risk** | Returns don't beat inflation | Yes, with equity investing |
| **Concentration Risk** | Too much in one stock/sector | Yes, by diversifying |

### The Risk-Return Spectrum

\`\`\`
Higher Risk / Higher Return
        ↑
        |  Small Cap Stocks
        |  Mid Cap Stocks
        |  Large Cap Stocks
        |  Balanced Funds
        |  Debt Mutual Funds
        |  Fixed Deposits
        ↓
Lower Risk / Lower Return
\`\`\`

### How to Assess Your Risk Tolerance

Ask yourself:
1. **Time Horizon** – How long can you stay invested? (Longer = can take more risk)
2. **Income Stability** – Is your job/income secure?
3. **Emergency Fund** – Do you have 6 months of expenses saved?
4. **Emotional Capacity** – Can you watch your portfolio drop 30% without panic-selling?

### Diversification: Your Best Friend

Diversification spreads investments across different companies, sectors, and asset classes. This reduces **company-specific (unsystematic) risk**.

**Example**: If you hold only Jet Airways stock and the airline goes bankrupt — you lose everything. If you hold 50 stocks across sectors, one company's failure has minimal impact.

However, diversification cannot protect against **market risk** (systematic risk) — events like COVID-19 that affect all markets.

### The Magic of Asset Allocation

The single most important investment decision is how you split between:
- **Equity (stocks/ETFs)** – High risk, high return
- **Debt (bonds/FDs)** – Low risk, stable return

**Rule of thumb**: Equity % = 100 - Your Age  
(A 25-year-old might hold 75% equity, 25% debt)

### 💡 Key Insight

Short-term volatility is the *price* of long-term returns. The Nifty 50 has fallen 50%+ multiple times but has delivered ~12% CAGR over 20 years. **Stay invested through the downturns.**
`,
        quiz: {
          title: 'Risk & Reward Quiz',
          questions: [
            {
              text: 'Which type of risk CANNOT be eliminated through diversification?',
              type: 'mcq',
              options: [
                'Company-specific risk',
                'Concentration risk',
                'Market risk (Systematic risk)',
                'Liquidity risk',
              ],
              correctIndex: 2,
              explanation:
                'Market risk (systematic risk) affects all investments and cannot be diversified away. Company-specific (unsystematic) risk can be reduced through diversification.',
            },
            {
              text: 'A longer investment time horizon generally allows you to take MORE risk.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation:
                'True. With a longer time horizon, you have more time to recover from market downturns, allowing you to take on more risk for higher potential returns.',
            },
            {
              text: 'Using the age-based rule of thumb, a 30-year-old should hold approximately what % in equity?',
              type: 'mcq',
              options: ['30%', '50%', '70%', '100%'],
              correctIndex: 2,
              explanation: '100 - 30 = 70% equity. This is a general guideline, not a strict rule.',
            },
          ],
        },
      },
    ],
  },

  // ── INTERMEDIATE ─────────────────────────────────────────────────────────────
  {
    title: 'Technical Analysis Mastery',
    slug: 'technical-analysis-mastery',
    description:
      'Master the art of reading price charts, identifying patterns, and using technical indicators to make informed trading decisions.',
    level: 'intermediate',
    category: 'Technical Analysis',
    tags: ['technical analysis', 'charts', 'indicators', 'trading'],
    estimatedHours: 5,
    xpReward: 400,
    order: 2,
    lessons: [
      {
        title: 'Introduction to Technical Analysis',
        slug: 'intro-to-technical-analysis',
        estimatedMinutes: 15,
        difficulty: 'intermediate',
        xpReward: 60,
        order: 1,
        summary:
          'Understand the three core assumptions of technical analysis and how to read price charts effectively.',
        keyTakeaways: [
          'Technical analysis assumes that price already reflects all available information.',
          'Prices move in trends that persist over time.',
          'History tends to repeat itself in stock market patterns.',
          'Chart types: Line, Bar, and Candlestick each provide different insights.',
        ],
        glossaryTerms: ['Volatility', 'Liquidity'],
        simulatorContext: 'stocks',
        content: `## Introduction to Technical Analysis

**Technical Analysis (TA)** is the study of past price and volume data to forecast future price movements. Unlike fundamental analysis (which looks at company financials), TA focuses purely on the chart.

### The Three Core Assumptions

**1. The Market Discounts Everything**
All known information — earnings, news, insider views — is already reflected in the current price. You don't need to read a balance sheet; just read the chart.

**2. Prices Move in Trends**
Stocks don't move randomly. Once a trend begins (upward or downward), it's more likely to continue than reverse. The trader's goal is to identify and ride the trend.

**3. History Repeats Itself**
Human psychology drives markets. Greed and fear create recurring price patterns. These patterns (head & shoulders, double tops, etc.) have predictive value.

### Types of Charts

| Chart Type | What It Shows | Best For |
|------------|---------------|----------|
| **Line Chart** | Closing price over time | Spotting broad trends |
| **Bar Chart** | Open, High, Low, Close | Day traders |
| **Candlestick** | Open, High, Low, Close with color | Most traders |

### Reading a Candlestick

\`\`\`
        ┌─ High
        │
        ██  ← Body (Green if Close > Open)
        │
        └─ Low
\`\`\`

- **Green/White candle**: Price closed HIGHER than it opened (bullish)
- **Red/Black candle**: Price closed LOWER than it opened (bearish)
- **Wick/Shadow**: The high and low reached during the session

### Timeframes

| Timeframe | Used By |
|-----------|---------|
| 1-minute, 5-minute | Scalpers & Day Traders |
| 15-minute, 1-hour | Swing Traders |
| Daily, Weekly | Position Traders & Long-term Investors |

### TA vs Fundamental Analysis

| Aspect | Technical Analysis | Fundamental Analysis |
|--------|-------------------|---------------------|
| Focus | Price & Volume charts | Financial statements |
| Time Horizon | Short to medium term | Medium to long term |
| Tools | Indicators, patterns | PE, EPS, ROE, etc. |
| Best For | Active traders | Long-term investors |

Both approaches have merit — many successful investors combine them (a "top-down" approach: fundamentals to pick the stock, technicals to time the entry).
`,
        quiz: {
          title: 'Technical Analysis Basics Quiz',
          questions: [
            {
              text: 'Technical analysis primarily studies:',
              type: 'mcq',
              options: [
                'Company balance sheets and income statements',
                'Price and volume data from charts',
                'Management quality and business moats',
                'Macroeconomic indicators',
              ],
              correctIndex: 1,
              explanation:
                'Technical analysis focuses on historical price and volume data to predict future price movements, not company fundamentals.',
            },
            {
              text: 'A green (bullish) candlestick means the closing price was LOWER than the opening price.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. A green candlestick indicates the closing price was HIGHER than the opening price, signifying buying pressure.',
            },
            {
              text: 'Which of the three core TA assumptions states that once a trend starts, it is more likely to continue?',
              type: 'mcq',
              options: [
                'The market discounts everything',
                'Prices move in trends',
                'History repeats itself',
                'Price follows fundamentals',
              ],
              correctIndex: 1,
              explanation: '"Prices move in trends" is the assumption that established trends persist until a reversal signal appears.',
            },
          ],
        },
      },
      {
        title: 'Candlestick Patterns',
        slug: 'candlestick-patterns',
        estimatedMinutes: 20,
        difficulty: 'intermediate',
        xpReward: 75,
        order: 2,
        summary:
          'Learn the most reliable single and multi-candle patterns and their bullish or bearish implications.',
        keyTakeaways: [
          'Doji patterns signal indecision and potential reversals.',
          'A Hammer pattern at the bottom of a downtrend suggests a bullish reversal.',
          'Engulfing patterns (bullish/bearish) are strong reversal signals.',
          'Always confirm candlestick signals with volume and support/resistance levels.',
        ],
        glossaryTerms: ['Volatility'],
        simulatorContext: 'stocks',
        content: `## Candlestick Patterns

Candlestick patterns are visual formations on price charts that give clues about the market's next move. They emerged from 18th-century Japanese rice traders and remain highly relevant today.

### Single Candlestick Patterns

#### 1. Doji
A Doji has nearly equal open and close prices, forming a tiny or no body.

\`\`\`
    │
   ─┼─  ← Very small or no body
    │
\`\`\`

**Meaning**: Market indecision. Buyers and sellers are evenly matched. A reversal may be coming.

---

#### 2. Hammer
A candle with a small body at the top and a long lower wick (at least 2x the body size).

\`\`\`
    ██  ← Small body at top
    │
    │  ← Long lower shadow
    │
\`\`\`

**Meaning**: After a downtrend, bears pushed price down but bulls recovered it. **Bullish reversal signal**.

---

#### 3. Shooting Star
Opposite of hammer. Small body at the bottom, long upper wick.

**Meaning**: After an uptrend, bulls pushed price up but bears pulled it back down. **Bearish reversal signal**.

---

### Two-Candle Patterns

#### 4. Bullish Engulfing
A small red candle followed by a large green candle that completely engulfs the red candle's body.

**Meaning**: Bulls have overwhelmed bears. Strong **bullish reversal** signal, especially after a downtrend.

#### 5. Bearish Engulfing
A small green candle followed by a large red candle that completely engulfs the green candle.

**Meaning**: Bears have overwhelmed bulls. Strong **bearish reversal** signal, especially after an uptrend.

---

### Three-Candle Patterns

#### 6. Morning Star
Three candles: Large red → Small candle (gap down) → Large green.

**Meaning**: Strong **bullish reversal** at the bottom of a downtrend.

#### 7. Evening Star
Three candles: Large green → Small candle (gap up) → Large red.

**Meaning**: Strong **bearish reversal** at the top of an uptrend.

---

### Pattern Reliability Matrix

| Pattern | Type | Reliability |
|---------|------|-------------|
| Doji | Reversal signal | Moderate |
| Hammer | Bullish reversal | High |
| Shooting Star | Bearish reversal | High |
| Bullish Engulfing | Bullish reversal | High |
| Bearish Engulfing | Bearish reversal | High |
| Morning Star | Bullish reversal | Very High |
| Evening Star | Bearish reversal | Very High |

### ⚠️ Important Caveats

- **Never trade on a candlestick pattern alone.** Always confirm with:
  - Support/Resistance levels
  - Volume (should increase on reversal candles)
  - Trend context
- Candlestick patterns work better on **daily** and **weekly** charts than on intraday.
`,
        quiz: {
          title: 'Candlestick Patterns Quiz',
          questions: [
            {
              text: 'A Hammer candlestick at the bottom of a downtrend is a:',
              type: 'mcq',
              options: [
                'Bearish continuation signal',
                'Bullish reversal signal',
                'Bearish reversal signal',
                'Neutral signal',
              ],
              correctIndex: 1,
              explanation:
                'A Hammer at the bottom of a downtrend signals that buyers are stepping in — a potential bullish reversal.',
            },
            {
              text: 'A Doji candlestick always signals a bullish reversal.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. A Doji signals market indecision and can precede a move in either direction. Context (trend, volume, support/resistance) determines significance.',
            },
            {
              text: 'Which multi-candle pattern is a very strong bullish reversal signal?',
              type: 'mcq',
              options: ['Shooting Star', 'Evening Star', 'Morning Star', 'Bearish Engulfing'],
              correctIndex: 2,
              explanation:
                'The Morning Star (large red → small candle → large green) is one of the strongest bullish reversal patterns.',
            },
          ],
        },
      },
      {
        title: 'Moving Averages',
        slug: 'moving-averages',
        estimatedMinutes: 18,
        difficulty: 'intermediate',
        xpReward: 75,
        order: 3,
        summary:
          'Master Simple Moving Averages (SMA) and Exponential Moving Averages (EMA) as trend-following tools.',
        keyTakeaways: [
          'SMA smooths price data by averaging closing prices over N periods.',
          'EMA gives more weight to recent prices, making it more responsive.',
          'Golden Cross (50 MA crossing above 200 MA) is a powerful bullish signal.',
          'Death Cross (50 MA crossing below 200 MA) signals a bearish trend.',
        ],
        glossaryTerms: ['Volatility', 'Liquidity'],
        simulatorContext: 'stocks',
        content: `## Moving Averages

A **Moving Average (MA)** is one of the simplest and most widely used technical indicators. It smooths out price data to help identify the direction of the trend by filtering out random "noise."

### Simple Moving Average (SMA)

SMA adds the closing prices of the last N periods and divides by N.

**Formula**: SMA(N) = (P1 + P2 + ... + PN) / N

**Example**: 5-day SMA
| Day | Close | 5-Day SMA |
|-----|-------|-----------|
| 1 | ₹100 | - |
| 2 | ₹102 | - |
| 3 | ₹98 | - |
| 4 | ₹105 | - |
| 5 | ₹103 | **₹101.6** |
| 6 | ₹107 | **₹103.0** |

**Common SMA periods**: 20, 50, 100, 200

### Exponential Moving Average (EMA)

EMA gives more weight to recent prices, making it faster to react to price changes.

- **EMA is preferred by traders** because it reacts quicker to new data
- **SMA is preferred by investors** for its simplicity

### How to Use Moving Averages

#### 1. Trend Identification
- Price **above** the MA → Uptrend (bullish)
- Price **below** the MA → Downtrend (bearish)

#### 2. Dynamic Support & Resistance
The 50-day and 200-day MAs often act as support (floor) in uptrends and resistance (ceiling) in downtrends.

#### 3. Crossover Signals

**Golden Cross** 🟡
- 50-day MA crosses **above** 200-day MA
- Strong long-term **bullish** signal
- Historically reliable on daily charts

**Death Cross** ☠️
- 50-day MA crosses **below** 200-day MA  
- Strong long-term **bearish** signal
- Often precedes prolonged downtrends

### MA Period Guide

| Period | What It Tracks |
|--------|----------------|
| 10-20 days | Short-term trend |
| 50 days | Medium-term trend |
| 100-200 days | Long-term trend |

### ⚠️ Limitations

Moving averages are **lagging indicators** — they are based on past data and confirm trends rather than predict them. Never use them in isolation:
- Combine with RSI or MACD for confirmation
- Check volume on crossover signals
`,
        quiz: {
          title: 'Moving Averages Quiz',
          questions: [
            {
              text: 'A Golden Cross occurs when:',
              type: 'mcq',
              options: [
                '200-day MA crosses above 50-day MA',
                '50-day MA crosses above 200-day MA',
                'Price crosses above 200-day MA',
                '50-day MA crosses below 200-day MA',
              ],
              correctIndex: 1,
              explanation:
                'A Golden Cross is when the shorter-term 50-day MA crosses above the longer-term 200-day MA, signaling a bullish trend shift.',
            },
            {
              text: 'Moving averages are leading indicators that predict future price moves.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. Moving averages are LAGGING indicators — they are calculated from past price data and confirm existing trends rather than predicting new ones.',
            },
          ],
        },
      },
    ],
  },

  {
    title: 'Value Investing',
    slug: 'value-investing',
    subtitle: 'Learn the strategies used by Warren Buffett and Benjamin Graham.',
    description: 'Learn the strategies used by Warren Buffett and Benjamin Graham to identify intrinsic value, evaluate economic moats, and build long-term wealth.',
    level: 'intermediate',
    category: 'Investing Basics',
    tags: ['value investing', 'warren buffett', 'benjamin graham', 'investing'],
    estimatedHours: 0.75,
    estimatedDuration: '45 mins',
    totalDuration: '45 mins',
    estimatedMinutes: 45,
    xpReward: 200,
    order: 2,
    lessons: [
      {
        title: 'Intrinsic Value & Margin of Safety',
        slug: 'intrinsic-value-margin-of-safety',
        estimatedMinutes: 15,
        difficulty: 'intermediate',
        xpReward: 60,
        order: 1,
        summary: 'Understand intrinsic value and Benjamin Graham\'s margin of safety concept.',
        keyTakeaways: ['Buy at a discount to intrinsic value to maintain a margin of safety.'],
        glossaryTerms: ['PE Ratio', 'Market Cap'],
        simulatorContext: 'stocks',
        content: `## Intrinsic Value & Margin of Safety\n\nLearn how Warren Buffett and Benjamin Graham evaluate stocks...`,
        quiz: null,
      },
      {
        title: 'Economic Moats & Competitive Advantage',
        slug: 'economic-moats-competitive-advantage',
        estimatedMinutes: 15,
        difficulty: 'intermediate',
        xpReward: 70,
        order: 2,
        summary: 'Identify durable economic moats that protect company profits over decades.',
        keyTakeaways: ['Durable moats protect long-term company profitability.'],
        glossaryTerms: ['Market Cap'],
        simulatorContext: 'stocks',
        content: `## Economic Moats & Competitive Advantage\n\nExplore durable competitive advantages...`,
        quiz: null,
      },
      {
        title: 'Financial Metrics for Value Investors',
        slug: 'financial-metrics-for-value-investors',
        estimatedMinutes: 15,
        difficulty: 'intermediate',
        xpReward: 70,
        order: 3,
        summary: 'Analyze P/E, P/B, ROE, and Free Cash Flow like Warren Buffett.',
        keyTakeaways: ['Use fundamental financial metrics to evaluate true corporate value.'],
        glossaryTerms: ['PE Ratio', 'EPS'],
        simulatorContext: 'stocks',
        content: `## Financial Metrics for Value Investors\n\nKey ratios used by Warren Buffett...`,
        quiz: null,
      },
    ],
  },
  // ── ADVANCED ──────────────────────────────────────────────────────────────────
  {
    title: 'Advanced Investment Strategies',
    slug: 'advanced-investment-strategies',
    description:
      'Deep-dive into professional-grade strategies: value investing, risk management, options basics, portfolio optimization, and behavioral finance.',
    level: 'advanced',
    category: 'Investment Strategies',
    tags: ['advanced', 'value investing', 'risk management', 'options', 'behavioral finance'],
    estimatedHours: 8,
    xpReward: 800,
    order: 3,
    lessons: [
      {
        title: 'Value Investing Principles',
        slug: 'value-investing-principles',
        estimatedMinutes: 25,
        difficulty: 'advanced',
        xpReward: 100,
        order: 1,
        summary:
          'Learn Warren Buffett\'s investment philosophy: intrinsic value, margin of safety, moats, and long-term compounding.',
        keyTakeaways: [
          'Value investing means buying great companies at prices below their intrinsic value.',
          'A margin of safety protects against valuation errors and unforeseen events.',
          'Economic moats (competitive advantages) sustain long-term profitability.',
          'Patience and discipline separate successful value investors from traders.',
        ],
        glossaryTerms: ['PE Ratio', 'EPS', 'Market Cap', 'CAGR'],
        simulatorContext: 'stocks',
        content: `## Value Investing Principles

Value investing is the practice of buying stocks that appear underpriced relative to their **intrinsic value** — and holding them until the market recognizes their true worth. It was pioneered by **Benjamin Graham** and perfected by **Warren Buffett**.

### Core Concept: Intrinsic Value

**Intrinsic value** is the true economic worth of a company, calculated by estimating future cash flows and discounting them to the present.

The key insight: Stock markets are voting machines in the short run, but weighing machines in the long run. Short-term prices fluctuate wildly based on sentiment, but eventually converge with fundamental value.

### Margin of Safety

> "Buy ₹1 of value for ₹0.60." — Benjamin Graham

The **margin of safety** is the difference between a stock's intrinsic value and its market price. Buying at a discount:
- Protects against valuation errors
- Provides buffer against business deterioration
- Amplifies returns when the market corrects

**Example**: If you calculate a company's intrinsic value at ₹200 per share but it trades at ₹130, you have a ~35% margin of safety.

### Economic Moats

An **economic moat** is a durable competitive advantage that protects a company's long-term profitability.

| Moat Type | Example |
|-----------|---------|
| **Brand** | Asian Paints, Titan — pricing power |
| **Network Effect** | NSE, Zomato — more users = more value |
| **Cost Advantage** | Tata Steel — scale reduces costs |
| **Switching Costs** | Tally, SAP — high cost to switch |
| **Regulatory** | HDFC Bank — banking licenses are scarce |

### Key Metrics for Value Investing

| Metric | Formula | What It Tells You |
|--------|---------|-------------------|
| **P/E Ratio** | Price ÷ EPS | How much you pay per ₹1 of earnings |
| **P/B Ratio** | Price ÷ Book Value | How much you pay per ₹1 of net assets |
| **ROE** | Net Profit ÷ Equity | How efficiently management uses equity |
| **Debt-to-Equity** | Total Debt ÷ Equity | Financial leverage and risk |
| **Free Cash Flow** | Operating CF - CapEx | Real cash the business generates |

### Buffett's Investment Checklist

✅ Do I understand the business?  
✅ Does it have a durable competitive moat?  
✅ Is management competent and honest?  
✅ Is the business trading below intrinsic value?  
✅ Can I hold this for 10+ years?

### The Power of Long-Term Compounding

₹1 lakh invested at 18% CAGR:
- After 10 years: **₹5.23 lakh**
- After 20 years: **₹27.4 lakh**
- After 30 years: **₹1.43 crore**

Compounding is time × return. Both matter — but *time* is the irreplaceable ingredient.

### Common Value Traps to Avoid

- **Low P/E doesn't always mean cheap** — sometimes earnings are about to collapse
- **High dividend yield** may signal a falling stock price, not generosity
- **Book value** can be misleading for asset-heavy businesses with outdated valuations
`,
        quiz: {
          title: 'Value Investing Quiz',
          questions: [
            {
              text: 'The "margin of safety" in value investing refers to:',
              type: 'mcq',
              options: [
                'The percentage gain you expect from a stock',
                'The discount at which you buy a stock below its intrinsic value',
                'A stop-loss order placed 10% below purchase price',
                'The percentage of cash in your portfolio',
              ],
              correctIndex: 1,
              explanation:
                'Margin of safety is the difference between a stock\'s calculated intrinsic value and its market price. Buying below intrinsic value provides a buffer against errors and market volatility.',
            },
            {
              text: 'An economic moat gives a company a temporary competitive advantage that lasts only 1-2 years.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. An economic moat is a DURABLE (long-lasting) competitive advantage — the key word is sustainability over many years, not months.',
            },
            {
              text: 'Which metric measures how efficiently a company uses shareholder equity to generate profit?',
              type: 'mcq',
              options: ['P/E Ratio', 'Debt-to-Equity', 'Return on Equity (ROE)', 'Price-to-Book Ratio'],
              correctIndex: 2,
              explanation:
                'ROE (Return on Equity) = Net Profit ÷ Shareholders\' Equity. Higher ROE indicates more efficient use of equity capital.',
            },
            {
              text: 'According to Benjamin Graham, you should ideally buy ₹1 of value for:',
              type: 'mcq',
              options: ['₹1.50', '₹1.00', '₹0.60', '₹0.90'],
              correctIndex: 2,
              explanation:
                'Graham advocated buying at a significant discount — paying ₹0.60 or less for ₹1 of intrinsic value to maintain an adequate margin of safety.',
            },
          ],
        },
      },
      {
        title: 'Risk Management in Trading',
        slug: 'risk-management-in-trading',
        estimatedMinutes: 20,
        difficulty: 'advanced',
        xpReward: 100,
        order: 2,
        summary:
          'Professional risk management techniques including position sizing, the 2% rule, portfolio heat, and drawdown management.',
        keyTakeaways: [
          'Never risk more than 1-2% of your total capital on a single trade.',
          'Position sizing determines how many shares to buy based on your risk per trade.',
          'Maximum drawdown defines the worst-case loss from peak to trough.',
          'Risk-reward ratio should be at least 1:2 for most trades.',
        ],
        glossaryTerms: ['Stop Loss', 'Volatility', 'Liquidity'],
        simulatorContext: 'portfolio',
        content: `## Risk Management in Trading

> "The first rule of investing is don't lose money. The second rule is don't forget the first rule." — Warren Buffett

Risk management separates professional traders from amateurs. You can be right only 40% of the time and still be profitable — if you manage risk correctly.

### The 2% Rule

**Never risk more than 2% of your total trading capital on a single trade.**

If your account = ₹5,00,000  
Maximum risk per trade = ₹10,000

This ensures that even 10 consecutive losing trades only reduces your account by 18% (not 20% due to compounding), keeping you in the game.

### Position Sizing Formula

\`\`\`
Shares to Buy = Risk Per Trade / (Entry Price - Stop Loss Price)

Example:
- Account: ₹5,00,000
- Risk: 2% = ₹10,000
- Stock price: ₹500
- Stop Loss: ₹480 (₹20 risk per share)
- Shares to Buy = ₹10,000 / ₹20 = 500 shares
- Total position = 500 × ₹500 = ₹2,50,000 (50% of capital)
\`\`\`

### Risk-Reward Ratio

The **Risk:Reward ratio** compares potential loss to potential gain.

| R:R Ratio | Interpretation |
|-----------|----------------|
| 1:1 | Break even at 50% win rate |
| 1:2 | Profitable at >33% win rate |
| 1:3 | Profitable at >25% win rate |

**Minimum target**: Always aim for at least **1:2 Risk-Reward**.

If stop loss is ₹20 below entry, your target should be at least ₹40 above entry.

### Portfolio Heat

**Portfolio heat** = Total risk across all open positions.

**Rule**: Keep total portfolio heat below **6-10%** of capital.

If you have 5 positions each risking 2%, your portfolio heat is 10%. Adding a 6th position would push it to 12% — too concentrated in risk.

### Drawdown Management

**Maximum Drawdown (MDD)** = (Peak Value - Trough Value) / Peak Value × 100

| MDD | Recovery Required |
|-----|------------------|
| 10% | 11.1% |
| 20% | 25% |
| 30% | 42.9% |
| 50% | 100% |

The deeper the loss, the harder to recover. **Protecting capital is always priority #1.**

### Practical Risk Management Rules

✅ Always set a stop-loss BEFORE entering a trade  
✅ Never average down on losing positions  
✅ Don't add to a position that's already losing  
✅ Move stop-loss to break-even once trade is +1R profitable  
✅ Journal every trade: entry, exit, reason, and result  
✅ Review your win rate and average R-multiple monthly
`,
        quiz: {
          title: 'Risk Management Quiz',
          questions: [
            {
              text: 'If your trading capital is ₹2,00,000 and you follow the 2% rule, the maximum you should risk on a single trade is:',
              type: 'mcq',
              options: ['₹20,000', '₹4,000', '₹10,000', '₹2,000'],
              correctIndex: 1,
              explanation:
                '2% of ₹2,00,000 = ₹4,000. This is the maximum loss you should accept on any single trade.',
            },
            {
              text: 'A Risk:Reward ratio of 1:2 means you need to be right more than 50% of the time to be profitable.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 1,
              explanation:
                'False. With 1:2 R:R, you only need to win >33% of trades to be profitable. (If you win 1 trade you make 2R; you can lose 2 trades at 1R each and still break even.)',
            },
          ],
        },
      },
      {
        title: 'Behavioral Finance & Investor Psychology',
        slug: 'behavioral-finance-investor-psychology',
        estimatedMinutes: 22,
        difficulty: 'advanced',
        xpReward: 100,
        order: 3,
        summary:
          'Understand the cognitive biases and emotional traps that destroy investor returns, and strategies to overcome them.',
        keyTakeaways: [
          'Loss aversion causes investors to feel losses twice as strongly as equivalent gains.',
          'Confirmation bias leads investors to seek only information that confirms their existing views.',
          'FOMO and herding behavior drive bubbles and crashes.',
          'A written investment plan and investment journal combat most behavioral biases.',
        ],
        glossaryTerms: ['Bull Market', 'Bear Market', 'Volatility'],
        simulatorContext: 'portfolio',
        content: `## Behavioral Finance & Investor Psychology

Standard finance theory assumes investors are rational. **Behavioral finance** studies why they aren't — and how these irrational patterns cause costly mistakes.

### 1. Loss Aversion

**The bias**: People feel the pain of losses approximately **2x more** than the pleasure of equivalent gains.

**How it hurts investors**:
- Holding losing stocks too long ("waiting to break even")
- Selling winning stocks too early to "lock in profits"
- Avoiding necessary portfolio rebalancing

**Solution**: Define exit criteria (stop-loss and target) BEFORE you invest.

### 2. Confirmation Bias

**The bias**: Seeking only information that confirms your existing belief while ignoring contradicting evidence.

**Example**: If you own Paytm stock, you read every bullish analyst note and dismiss every negative article.

**Solution**: Actively seek the bear case for every position you hold.

### 3. FOMO (Fear of Missing Out)

**The bias**: Chasing hot stocks/sectors after they've already moved up significantly.

**Classic example**: Retail investors poured into crypto/NFTs at peak prices in late 2021.

**Solution**: Set a maximum "FOMO premium" — never buy a stock that's more than 20% above your calculated fair value just because it's rising.

### 4. Overconfidence

**The bias**: Believing your stock-picking ability is above average (it's statistically impossible for everyone to be above average).

**How it hurts**:
- Excessive trading (high transaction costs)
- Underdiversification (concentrating in "sure bets")
- Ignoring risk

**Solution**: Track your trades honestly. Compare your returns to the Nifty 50 index over 3+ years.

### 5. Anchoring Bias

**The bias**: Fixing on an arbitrary price point (usually your purchase price or a 52-week high).

**Example**: "I won't sell until I get back to ₹500" — even if the business fundamentals have deteriorated.

**Solution**: Ask: "Would I buy this stock at today's price, knowing what I know now?"

### 6. Herding

**The bias**: Following the crowd. Buying because everyone is buying; selling because everyone is selling.

**This drives**:
- Asset bubbles (buying at peaks)
- Panic selling (selling at bottoms)

**Solution**: Be a contrarian. When the news is most negative, it's often the best time to buy.

### The Investor's Emotional Cycle

\`\`\`
         Euphoria (peak, best time to sell)
        /
       /
      Thrill
     /
    Optimism
   /
  Hope               Hope (recovery begins)
  ↑                 ↑
  Start of rise    Capitulation (trough, best time to buy)
                   ↓
                   Depression → Panic → Despair
\`\`\`

### Building a Bulletproof Investment Process

1. **Write an Investment Policy Statement (IPS)**: Asset allocation, rebalancing rules, stop-loss rules
2. **Keep an Investment Journal**: Record every buy/sell rationale
3. **Never check prices more than once a day** for long-term portfolios
4. **Automate** where possible (SIPs, auto-rebalancing)
5. **Have an accountability partner** or investment group to challenge your thinking
`,
        quiz: {
          title: 'Behavioral Finance Quiz',
          questions: [
            {
              text: 'Loss aversion means investors feel losses approximately how much more strongly than equivalent gains?',
              type: 'mcq',
              options: ['0.5x', '1x (equally)', '2x', '5x'],
              correctIndex: 2,
              explanation:
                'Research by Kahneman and Tversky found that losses feel approximately 2x more painful than equivalent gains feel pleasurable.',
            },
            {
              text: 'Herding behavior in markets typically leads to investors buying at peaks and selling at troughs.',
              type: 'tf',
              options: ['True', 'False'],
              correctIndex: 0,
              explanation:
                'True. Herding causes investors to follow the crowd — buying when euphoria is at its peak and panic-selling at market bottoms.',
            },
            {
              text: 'Confirmation bias means an investor:',
              type: 'mcq',
              options: [
                'Seeks information that contradicts their views',
                'Only seeks information that supports their existing beliefs',
                'Avoids all financial news',
                'Copies trades from other investors',
              ],
              correctIndex: 1,
              explanation:
                'Confirmation bias leads investors to seek and remember information that confirms what they already believe, while ignoring contradicting evidence.',
            },
            {
              text: 'Which behavioral strategy best combats the emotional cycle of fear and greed?',
              type: 'mcq',
              options: [
                'Check stock prices every hour for best entries',
                'Follow popular investor sentiment on social media',
                'Have a written investment plan with predefined entry/exit rules',
                'Invest only during bull markets',
              ],
              correctIndex: 2,
              explanation:
                'A written investment plan with predefined rules removes emotional decision-making from the process, preventing both FOMO buying and panic selling.',
            },
          ],
        },
      },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// SEED RUNNER
// ──────────────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  await mongoose.connect(MONGO_URI);
  console.log('📦 Connected to MongoDB');

  // Clear existing learning data
  await Promise.all([
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Quiz.deleteMany({}),
    GlossaryTerm.deleteMany({}),
    Achievement.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing learning data');

  // Seed achievements
  await Achievement.insertMany(ACHIEVEMENTS);
  console.log(`✅ Seeded ${ACHIEVEMENTS.length} achievements`);

  // Seed glossary
  await GlossaryTerm.insertMany(GLOSSARY_TERMS);
  console.log(`✅ Seeded ${GLOSSARY_TERMS.length} glossary terms`);

  // Seed courses, lessons, quizzes
  let totalLessons = 0;
  let totalQuizzes = 0;

  for (const courseData of COURSE_DATA) {
    const { lessons: lessonDataList, ...courseFields } = courseData;

    // Create course placeholder (lessons added after)
    const course = new Course({ ...courseFields, lessons: [] });

    const lessonIds = [];
    let prevLessonId = null;

    for (const lessonData of lessonDataList) {
      const { quiz: quizData, ...lessonFields } = lessonData;

      const lesson = await Lesson.create({
        ...lessonFields,
        courseId: course._id,
        relatedLessons: prevLessonId ? [prevLessonId] : [],
      });

      lessonIds.push(lesson._id);
      prevLessonId = lesson._id;
      totalLessons++;

      if (quizData) {
        await Quiz.create({
          ...quizData,
          lessonId: lesson._id,
          courseId: course._id,
        });
        totalQuizzes++;
      }
    }

    course.lessons = lessonIds;
    await course.save();
    console.log(`  📚 Created course: "${course.title}" (${lessonIds.length} lessons)`);
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Courses: ${COURSE_DATA.length}`);
  console.log(`   Lessons: ${totalLessons}`);
  console.log(`   Quizzes: ${totalQuizzes}`);
  console.log(`   Glossary Terms: ${GLOSSARY_TERMS.length}`);
  console.log(`   Achievements: ${ACHIEVEMENTS.length}`);

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
