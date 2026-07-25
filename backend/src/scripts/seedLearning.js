import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import GlossaryTerm from '../models/GlossaryTerm.js';

dotenv.config();

// ============================================================================
// 1. HARDCODED FLAGSHIP COURSES (3 Courses, ~6 Lessons Each)
// ============================================================================

const flagshipCourses = [
  {
    title: 'Introduction to Stock Markets',
    level: 'beginner',
    description: 'A comprehensive beginner guide to understanding the stock market, why it exists, and how to start investing.',
    category: 'General',
    tags: ['basics', 'intro', 'market'],
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    estimatedHours: 1.5,
    duration: '90 mins',
    xpReward: 150,
    order: 1,
    lessons: [
      {
        title: 'What is a Stock?',
        difficulty: 'beginner',
        estimatedMinutes: 15,
        content: `
# Introduction
Welcome to your first step into the financial world! A stock is one of the most fundamental concepts in finance, but what exactly is it? In simple terms, a stock represents a fraction of ownership in a business. When you buy a stock, you are buying a tiny slice of that company.

# Main Content
When a company wants to grow—perhaps to build a new factory, hire more employees, or research a new product—it needs money. While it could borrow money from a bank, another option is to sell pieces of the company to the public. These pieces are called "shares" or "stocks."

When you own a share of a company, you are known as a shareholder. As a shareholder, you have a claim on part of the company's assets and earnings. If the company does well, the value of your shares may increase. If the company distributes some of its profits, you may receive dividends.

## Why Do People Buy Stocks?
People buy stocks primarily for two reasons:
1. **Capital Appreciation**: The price of the stock goes up over time, and you sell it for a profit.
2. **Dividends**: The company pays you a portion of its profits regularly.

# Key Takeaways
✓ Stocks represent ownership in a company.
✓ Investors earn through capital appreciation and dividends.
✓ Public companies trade their shares on stock exchanges.

# Common Mistakes
- Thinking stocks are a guaranteed way to get rich quickly.
- Buying stocks just because they are cheap (low price doesn't mean good value).
- Investing money you need in the short term.

# Practical Example
Imagine you invest ₹10,000 in Company A by buying 100 shares at ₹100 each.
After one year, the company launches a successful product. The demand for the company's shares increases, and the price goes up to ₹120 per share.
Your investment is now worth: 100 shares × ₹120 = ₹12,000.
Your Profit = ₹2,000 (a 20% return).

# Mini Exercise
Imagine you have ₹50,000 to invest. Write down 5 companies whose products you use every day. How would you divide your money among them, and why?

# Summary
A stock is a share in the ownership of a company. Buying stocks is a way to build wealth over the long term, but it requires patience and an understanding of the risks involved.
        `,
        quiz: {
          title: 'Quiz: What is a Stock?',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What does a stock represent?', type: 'mcq', options: ['A loan to a company', 'Fractional ownership in a company', 'A type of bank account', 'A tax form'], correctIndex: 1, explanation: 'A stock represents equity, or ownership, in a corporation.' },
            { text: 'Which of the following is a reason people buy stocks?', type: 'mcq', options: ['To earn interest like a savings account', 'To get a guaranteed return', 'Capital appreciation and dividends', 'To avoid paying taxes'], correctIndex: 2, explanation: 'Investors buy stocks aiming for the price to rise (capital appreciation) and to receive dividends.' },
            { text: 'If you buy 50 shares at ₹200 each, what is your total investment?', type: 'mcq', options: ['₹5,000', '₹10,000', '₹20,000', '₹50,000'], correctIndex: 1, explanation: '50 shares × ₹200 = ₹10,000.' },
            { text: 'What is a common mistake when buying stocks?', type: 'mcq', options: ['Researching the company', 'Investing for the long term', 'Buying just because a stock is cheap', 'Diversifying your investments'], correctIndex: 2, explanation: 'A low share price does not necessarily mean the stock is a good value.' },
            { text: 'What happens if a company does well?', type: 'mcq', options: ['The share price usually drops', 'The company is forced to buy back your shares', 'The value of your shares may increase', 'Your shares turn into bonds'], correctIndex: 2, explanation: 'Strong company performance generally increases demand for its stock, driving up the share price.' }
          ]
        }
      },
      {
        title: 'Bull vs Bear Markets',
        difficulty: 'beginner',
        estimatedMinutes: 15,
        content: `
# Introduction
As you listen to financial news, you will frequently hear the terms "Bull Market" and "Bear Market." These terms are fundamental to understanding the general mood or "sentiment" of the stock market.

# Main Content
The stock market is essentially driven by human emotion—specifically, fear and greed. 

## The Bull Market 🐂
A Bull Market is characterized by optimism, investor confidence, and expectations that strong results will continue. During a bull market, stock prices are generally rising. The term is said to come from the way a bull attacks: by thrusting its horns up into the air.
Characteristics:
- Rising stock prices (usually a 20% rise after two declines of 20%).
- Strong economy and low unemployment.
- High investor confidence.

## The Bear Market 🐻
A Bear Market is the opposite. It is characterized by pessimism and a prolonged drop in investment prices. The term comes from the way a bear attacks: by swiping its paws down.
Characteristics:
- Falling stock prices (a 20% or more drop from recent highs).
- Weakening economy or recession.
- High unemployment and low investor confidence.

# Key Takeaways
✓ Bull markets mean prices are rising (optimism).
✓ Bear markets mean prices are falling (pessimism).
✓ Both are normal parts of the long-term economic cycle.

# Common Mistakes
- Panic selling during a bear market.
- Over-leveraging (borrowing money to invest) at the peak of a bull market.
- Thinking a bull market will last forever.

# Practical Example
In early 2020, due to global events, the market saw a rapid drop of over 30% in just a few weeks. This was a Bear Market. However, by late 2020 and throughout 2021, the market rebounded powerfully, entering a new Bull Market where major indices hit all-time highs.

# Mini Exercise
Look up the historical chart of the Nifty 50 or S&P 500. Identify one period that looks like a Bear Market (steep drop) and one that looks like a Bull Market (steady climb). 

# Summary
Understanding whether we are in a bull or bear market helps set your expectations. Long-term investors often use bear markets as opportunities to buy quality stocks at a discount.
        `,
        quiz: {
          title: 'Quiz: Bull vs Bear Markets',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is a Bull Market?', type: 'mcq', options: ['A market where prices are falling', 'A market where prices are rising', 'A market where agricultural stocks dominate', 'A market with no price movement'], correctIndex: 1, explanation: 'Bull markets are characterized by optimism and rising prices.' },
            { text: 'Where do the terms Bull and Bear come from?', type: 'mcq', options: ['Famous Wall Street traders', 'The way the animals attack (horns up vs paws down)', 'Constellations', 'Ancient Roman terms'], correctIndex: 1, explanation: 'A bull thrusts its horns up (rising), a bear swipes its paws down (falling).' },
            { text: 'Which is a common mistake in a bear market?', type: 'mcq', options: ['Panic selling', 'Holding quality stocks', 'Buying at a discount', 'Reinvesting dividends'], correctIndex: 0, explanation: 'Panic selling locks in your losses during a temporary downturn.' },
            { text: 'A bear market is typically defined by a drop of at least what percentage from recent highs?', type: 'mcq', options: ['5%', '10%', '20%', '50%'], correctIndex: 2, explanation: 'A 20% drop from recent broad market highs is the standard definition of a bear market.' },
            { text: 'What emotion primarily drives a bull market?', type: 'mcq', options: ['Fear', 'Greed/Optimism', 'Boredom', 'Anger'], correctIndex: 1, explanation: 'Optimism and confidence (sometimes greedy) drive bull markets.' }
          ]
        }
      },
      {
        title: 'Market Orders vs Limit Orders',
        difficulty: 'beginner',
        estimatedMinutes: 20,
        simulatorContext: 'limit_order',
        content: `
# Introduction
When you decide to buy a stock, you don't just say "Buy." You have to tell your broker *how* to buy it. The two most common instructions you will give are Market Orders and Limit Orders.

# Main Content
Understanding order types is crucial for executing your trades efficiently and at the price you want.

## Market Orders
A Market Order is an instruction to buy or sell a stock immediately at the best available current price. 
- **The Guarantee**: It guarantees that your order will be executed (filled).
- **The Risk**: It does not guarantee the price. In a fast-moving market, the price you get might be significantly different from the price you saw when you clicked "Buy."

## Limit Orders
A Limit Order is an instruction to buy or sell a stock at a specific price or better.
- **The Guarantee**: It guarantees the price. You will not pay more than your limit price when buying, and you will not receive less than your limit price when selling.
- **The Risk**: It does not guarantee execution. If the stock never reaches your specified limit price, your order will never be filled.

# Key Takeaways
✓ Market Orders prioritize speed and execution over price.
✓ Limit Orders prioritize price over speed and execution.
✓ Use Limit Orders to avoid unexpected prices in volatile markets.

# Common Mistakes
- Using Market Orders for thinly traded stocks, resulting in a terrible entry price.
- Setting Limit Orders too far away from the current price, causing the order to never fill.

# Practical Example
Company Z is currently trading at ₹105. 
- If you place a **Market Order** to buy, you will likely buy it at ₹105 or very close to it, immediately.
- If you place a **Limit Order** to buy at ₹100, you will only buy the stock if the price drops to ₹100. If it goes up to ₹110 instead, you buy nothing.

# Mini Exercise
Open the Trading Simulator. 
1. Buy 5 shares of a stock using a Market Order. Observe the execution price.
2. Place a Limit Order to buy a stock 5% below its current price. Wait and see if it fills.

# Summary
Choosing the right order type depends on your goal. If you absolutely must enter or exit a position right now, use a market order. If you want to strictly control your costs, use a limit order.
        `,
        quiz: {
          title: 'Quiz: Order Types',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What does a Market Order guarantee?', type: 'mcq', options: ['A specific price', 'Execution of the order', 'A profit', 'Low broker fees'], correctIndex: 1, explanation: 'Market orders guarantee execution, but not the price.' },
            { text: 'What does a Limit Order guarantee?', type: 'mcq', options: ['Execution', 'The price', 'Same-day settlement', 'Dividends'], correctIndex: 1, explanation: 'Limit orders guarantee you will get your specified price or better.' },
            { text: 'If a stock is at ₹50, and you place a Limit Buy at ₹45, what happens?', type: 'mcq', options: ['You buy it immediately at ₹50', 'You buy it immediately at ₹45', 'The order waits until the price drops to ₹45', 'The order is cancelled'], correctIndex: 2, explanation: 'The limit order will sit pending until the market price reaches ₹45.' },
            { text: 'When should you be cautious using a Market Order?', type: 'mcq', options: ['When buying Apple stock', 'During calm market hours', 'In a highly volatile, fast-moving market', 'When you have a lot of cash'], correctIndex: 2, explanation: 'In fast markets, the price can jump significantly before your market order executes.' },
            { text: 'What is the risk of a Limit Order?', type: 'mcq', options: ['You pay too much in fees', 'Your order might never execute', 'It forces you to buy more shares', 'It expires in 5 minutes'], correctIndex: 1, explanation: 'If the price never hits your limit, the order will not execute.' }
          ]
        }
      },
      {
        title: 'Diversification',
        difficulty: 'beginner',
        estimatedMinutes: 15,
        content: `
# Introduction
"Don't put all your eggs in one basket." This age-old proverb is the core principle of one of the most important concepts in investing: Diversification.

# Main Content
Diversification is a risk management strategy that mixes a wide variety of investments within a portfolio. The rationale behind this technique is that a portfolio constructed of different kinds of assets will, on average, yield higher long-term returns and lower the risk of any individual holding or security.

## How to Diversify
You can diversify in several ways:
1. **Across Asset Classes**: Holding a mix of stocks, bonds, real estate, and cash.
2. **Across Sectors**: Buying stocks in technology, healthcare, finance, and consumer goods.
3. **Across Geographies**: Investing in domestic companies as well as international markets.

## Why it Works
If you invest all your money in a single airline company, and a new regulation grounds all flights, your entire portfolio crashes. But if you own an airline, a software company, a hospital chain, and a supermarket, the negative impact on the airline is offset by the others, which might be doing fine or even thriving.

# Key Takeaways
✓ Diversification reduces unsystematic risk (the risk associated with a specific company or industry).
✓ It smooths out the volatility of your portfolio over time.
✓ ETFs and Mutual Funds are easy ways to achieve instant diversification.

# Common Mistakes
- **Over-diversification**: Owning so many different assets that your returns are diluted and it becomes impossible to manage.
- **Fake Diversification**: Buying 10 different stocks, but they are all in the technology sector. If tech crashes, you still lose heavily.

# Practical Example
Portfolio A: 100% invested in a single tech startup. High potential reward, but massive risk of going to zero.
Portfolio B: 20% Tech, 20% Banks, 20% Healthcare, 20% FMCG, 20% Government Bonds. Lower risk. If tech drops 10%, your overall portfolio only drops 2% (assuming the others stay flat).

# Mini Exercise
Imagine you are given ₹1,00,000 to invest. Write down a plan to diversify this money across 4 different economic sectors. Which sectors would you choose and why?

# Summary
Diversification is your primary defense against the unknown. By spreading your investments, you protect yourself from catastrophic losses while positioning yourself to capture general market growth.
        `,
        quiz: {
          title: 'Quiz: Diversification',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is the main goal of diversification?', type: 'mcq', options: ['To guarantee high returns', 'To minimize risk', 'To pay less taxes', 'To concentrate wealth'], correctIndex: 1, explanation: 'Diversification spreads risk to protect your portfolio from severe losses.' },
            { text: 'Which of the following is an example of poor diversification?', type: 'mcq', options: ['Owning stocks from 5 different sectors', 'Owning stocks, bonds, and real estate', 'Owning 10 different technology stocks', 'Owning an index fund'], correctIndex: 2, explanation: 'Owning 10 tech stocks means you are heavily exposed to the tech sector. If tech drops, your whole portfolio drops.' },
            { text: 'What is "unsystematic risk"?', type: 'mcq', options: ['Risk affecting the entire economy', 'Risk specific to a single company or industry', 'Inflation risk', 'Currency risk'], correctIndex: 1, explanation: 'Unsystematic risk is company-specific risk, which can be eliminated through diversification.' },
            { text: 'What financial instrument provides instant diversification?', type: 'mcq', options: ['A single stock', 'An ETF (Exchange Traded Fund)', 'A corporate bond', 'A call option'], correctIndex: 1, explanation: 'ETFs hold baskets of many different stocks, providing instant diversification.' },
            { text: 'Is it possible to be over-diversified?', type: 'mcq', options: ['Yes, it can dilute your returns and make tracking difficult', 'No, more diversification is always better', 'Yes, but it increases your risk', 'No, the SEC requires maximum diversification'], correctIndex: 0, explanation: 'Over-diversification can lead to average returns that fail to beat the market, while increasing management complexity.' }
          ]
        }
      },
      {
        title: 'Building Your First Portfolio',
        difficulty: 'beginner',
        estimatedMinutes: 25,
        content: `
# Introduction
You know what a stock is, how to place an order, and the importance of diversification. Now it's time to put it all together and build your first portfolio.

# Main Content
Building a portfolio is like building a house; you need a solid foundation before you add the decorative elements. 

## Step 1: Define Your Goals and Time Horizon
Are you investing for retirement in 30 years, or saving for a down payment on a house in 5 years? Your time horizon dictates your risk tolerance. Longer time horizons allow you to take more risk (more stocks).

## Step 2: The Core and Satellite Approach
A popular strategy for beginners is the "Core and Satellite" approach.
- **The Core (70-80%)**: Safe, broad-market index funds or ETFs (like the S&P 500 or Nifty 50). This provides steady, diversified growth.
- **The Satellites (20-30%)**: Individual stocks of companies you believe in, or specific sector ETFs. This provides the potential for higher returns and keeps investing engaging.

## Step 3: Regular Contributions (SIP/DCA)
Don't try to time the market. Use Dollar Cost Averaging (DCA) or a Systematic Investment Plan (SIP). This means investing a fixed amount of money at regular intervals (e.g., ₹5,000 every month), regardless of whether the market is up or down.

# Key Takeaways
✓ Start with a strong core of diversified index funds.
✓ Match your investments to your time horizon.
✓ Use Dollar Cost Averaging to remove emotion from investing.

# Common Mistakes
- Building a portfolio entirely out of highly speculative penny stocks.
- Stopping contributions during a bear market out of fear.
- Checking your portfolio every 5 minutes and reacting to daily noise.

# Practical Example
Your First Portfolio (₹1,00,000):
- Core: ₹75,000 in a broad market ETF (e.g., NIFTYBEES or VOO).
- Satellite 1: ₹15,000 in a blue-chip tech stock you understand well.
- Satellite 2: ₹10,000 in a consumer goods company whose products you use daily.

# Mini Exercise
Write down your investment goal and time horizon. Based on that, what percentage of your portfolio do you think should be in the "Core" versus the "Satellites"?

# Summary
Your first portfolio doesn't need to be complex. A simple, well-diversified portfolio that you contribute to regularly will outperform complex strategies that involve frequent trading and market timing.
        `,
        quiz: {
          title: 'Quiz: Building a Portfolio',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is the Core and Satellite approach?', type: 'mcq', options: ['Investing only in aerospace companies', 'Using a large index fund as a base and individual stocks for extra growth', 'Trading actively every day', 'Keeping 90% in cash'], correctIndex: 1, explanation: 'The core provides stability via index funds, while satellites offer growth via specific stocks.' },
            { text: 'What is Dollar Cost Averaging (DCA)?', type: 'mcq', options: ['Buying stocks only when they are cheap', 'Investing a fixed amount regularly, regardless of price', 'Averaging down on losing trades', 'Converting currencies'], correctIndex: 1, explanation: 'DCA involves regular, consistent investments to average out the purchase price over time.' },
            { text: 'How does a long time horizon affect your risk tolerance?', type: 'mcq', options: ['It allows you to take more risk (more stocks)', 'It means you should take zero risk (only bonds)', 'It has no effect on risk', 'It means you should day trade'], correctIndex: 0, explanation: 'A longer horizon gives you time to recover from market downturns, allowing for a riskier, higher-growth allocation.' },
            { text: 'Which is a common mistake for beginners?', type: 'mcq', options: ['Investing regularly', 'Buying broad market ETFs', 'Checking the portfolio constantly and reacting to noise', 'Having a 10-year time horizon'], correctIndex: 2, explanation: 'Constantly checking your portfolio leads to emotional decisions and panic selling.' },
            { text: 'What is a good instrument to form the "Core" of your portfolio?', type: 'mcq', options: ['A penny stock', 'A cryptocurrency', 'A broad market ETF', 'A speculative biotech company'], correctIndex: 2, explanation: 'Broad market ETFs provide immediate, low-cost diversification.' }
          ]
        }
      }
    ]
  },
  {
    title: 'Technical Analysis Basics',
    level: 'intermediate',
    description: 'Learn how to read charts, identify trends, and use indicators to time your trades.',
    category: 'Analysis',
    tags: ['technical', 'charts', 'indicators'],
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    estimatedHours: 4,
    xpReward: 200,
    order: 2,
    lessons: [
      {
        title: 'Introduction to Candlestick Charts',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        content: `
# Introduction
If you want to understand price movement, you need to read charts. The most popular chart type used by traders worldwide is the Candlestick Chart.

# Main Content
A candlestick provides a visual representation of price action during a specific timeframe (e.g., 1 day, 1 hour, or 1 minute).

## Anatomy of a Candlestick
Each candle has two parts:
1. **The Body**: Represents the opening and closing prices.
   - **Green (or White)**: Price closed higher than it opened (Bullish).
   - **Red (or Black)**: Price closed lower than it opened (Bearish).
2. **The Wicks (or Shadows)**: The thin lines above and below the body. They show the highest and lowest prices reached during that timeframe.

## Why Candlesticks?
Candlesticks show the battle between buyers (bulls) and sellers (bears). A long green body shows buyers were in control. A long upper wick shows buyers tried to push the price up, but sellers overpowered them by the end of the session.

# Key Takeaways
✓ Candlesticks show Open, High, Low, and Close (OHLC) prices.
✓ The color indicates whether the period ended up or down.
✓ The wicks show the extreme highs and lows.

# Common Mistakes
- Memorizing hundreds of candle patterns without understanding the psychology behind them.
- Trading based on a single candlestick on a very short timeframe (like 1-minute charts) which is often just market noise.

# Practical Example
Imagine a daily candle opens at ₹100. During the day, strong buying pushes it to ₹110 (High). Then, bad news hits, and sellers push it all the way down to ₹90 (Low). Finally, it settles and closes at ₹95.
This candle would be **Red** (Open 100 > Close 95), with a long upper wick reaching 110, and a lower wick reaching 90.

# Mini Exercise
Draw a bullish candlestick on a piece of paper. Label the Open, High, Low, and Close points.

# Summary
Candlesticks are the alphabet of technical analysis. By understanding how to read a single candle, you lay the groundwork for reading entire market trends.
        `,
        quiz: {
          title: 'Quiz: Candlestick Charts',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What are the four data points in a candlestick?', type: 'mcq', options: ['Volume, Price, Time, Date', 'Open, High, Low, Close (OHLC)', 'Bid, Ask, Spread, Volume', 'Start, Peak, Trough, End'], correctIndex: 1, explanation: 'Candlesticks display the Open, High, Low, and Close prices.' },
            { text: 'What does a green (or white) candlestick body indicate?', type: 'mcq', options: ['The price closed lower than it opened', 'The price closed higher than it opened', 'The volume was high', 'The stock paid a dividend'], correctIndex: 1, explanation: 'A green body means the closing price was higher than the opening price (bullish).' },
            { text: 'What do the wicks (shadows) represent?', type: 'mcq', options: ['The opening price', 'The closing price', 'The highest and lowest prices reached', 'The average price'], correctIndex: 2, explanation: 'Wicks show the extremes—the absolute high and low during the timeframe.' },
            { text: 'If a candle opens at 50, highs at 60, lows at 40, and closes at 45, what color is the body?', type: 'mcq', options: ['Green', 'Red', 'Doji (Neutral)', 'Blue'], correctIndex: 1, explanation: 'Because the close (45) is lower than the open (50), the candle is Red.' },
            { text: 'What does a long upper wick suggest?', type: 'mcq', options: ['Buyers were in complete control', 'Sellers were in complete control', 'Buyers pushed the price up, but sellers forced it back down', 'No one was trading'], correctIndex: 2, explanation: 'A long upper wick indicates price rejection at higher levels by sellers.' }
          ]
        }
      },
      {
        title: 'Support and Resistance',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        content: `
# Introduction
Support and Resistance are the most widely used concepts in technical analysis. They represent invisible price barriers where the market struggles to break through.

# Main Content

## Support (The Floor)
Support is a price level where a downtrend tends to pause due to a concentration of demand (buying interest). As the price drops, it becomes cheaper and more attractive to buyers, who step in and "support" the price, preventing it from falling further.

## Resistance (The Ceiling)
Resistance is a price level where an uptrend tends to pause due to a concentration of supply (selling interest). As the price rises, sellers take profits, creating a "ceiling" that the price struggles to break above.

## Role Reversal
A key principle of technical analysis is that once a resistance level is broken, it often becomes a new support level. Conversely, broken support often becomes new resistance.

# Key Takeaways
✓ Support = Floor (Buyers enter).
✓ Resistance = Ceiling (Sellers enter).
✓ Broken resistance becomes support; broken support becomes resistance.

# Common Mistakes
- Treating support and resistance as exact, down-to-the-penny numbers rather than "zones" or "areas."
- Assuming a level will hold forever. Every level eventually breaks.

# Practical Example
A stock bounces off ₹100 three different times over two months. ₹100 is clearly a strong Support level. Later, the stock rallies to ₹150 and falls back, doing this twice. ₹150 is the Resistance level. The stock is "channeling" between 100 and 150.

# Mini Exercise
Look at any stock chart. Find a price point where the stock stopped falling and bounced back up at least twice. You have found a support zone.

# Summary
Identifying support and resistance zones helps traders know where to place buy orders (near support), sell orders (near resistance), and stop-loss orders (just outside these zones).
        `,
        quiz: {
          title: 'Quiz: Support and Resistance',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is a Support level?', type: 'mcq', options: ['A price ceiling where sellers enter', 'A price floor where buyers enter', 'The moving average', 'The all-time high'], correctIndex: 1, explanation: 'Support acts as a floor where demand stops the price from falling.' },
            { text: 'What is a Resistance level?', type: 'mcq', options: ['A price ceiling where sellers enter', 'A price floor where buyers enter', 'The lowest point on the chart', 'Volume indicator'], correctIndex: 0, explanation: 'Resistance acts as a ceiling where selling pressure stops the price from rising.' },
            { text: 'What usually happens when a Resistance level is definitively broken?', type: 'mcq', options: ['It disappears', 'It becomes a new Resistance level lower down', 'It often becomes a new Support level', 'The stock is delisted'], correctIndex: 2, explanation: 'A core tenet of technical analysis is that broken resistance becomes new support.' },
            { text: 'Should support and resistance be viewed as exact numbers?', type: 'mcq', options: ['Yes, down to the exact cent', 'No, they are better viewed as zones or areas', 'Yes, algorithms demand exact numbers', 'No, they are totally random'], correctIndex: 1, explanation: 'Prices fluctuate; therefore, support and resistance are zones, not exact single price points.' },
            { text: 'Where would a trader traditionally place a buy order in a sideways market?', type: 'mcq', options: ['Near Resistance', 'In the middle of the channel', 'Near Support', 'Above Resistance'], correctIndex: 2, explanation: 'Buying near support provides a low-risk entry point.' }
          ]
        }
      },
      {
        title: 'Moving Averages',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        content: `
# Introduction
While candlesticks show you the immediate price action, they can be noisy. Moving Averages (MA) smooth out this price data to help you identify the underlying trend.

# Main Content
A Moving Average calculates the average price of a stock over a specific number of past periods.

## Types of Moving Averages
1. **Simple Moving Average (SMA)**: Calculates the straightforward average over X periods.
2. **Exponential Moving Average (EMA)**: Gives more weight to recent prices, making it react faster to price changes.

## Common Timeframes
- **Short-term trend**: 9 EMA, 20 SMA.
- **Medium-term trend**: 50 SMA.
- **Long-term trend**: 200 SMA. (The 200-day SMA is widely considered the ultimate indicator of a broad market trend).

## How to Use Them
1. **Trend Identification**: If the price is above the moving average, the trend is generally up.
2. **Dynamic Support/Resistance**: Moving averages often act as sloping support in an uptrend, or sloping resistance in a downtrend.
3. **Crossovers**: When a short-term MA crosses above a long-term MA (e.g., 50 SMA crosses above 200 SMA), it is a bullish signal known as a "Golden Cross."

# Key Takeaways
✓ Moving Averages smooth out price data to reveal the trend.
✓ EMAs react faster to recent price changes than SMAs.
✓ The 50-day and 200-day are the most widely watched moving averages.

# Common Mistakes
- Using moving averages in a sideways, choppy market. MAs are trend-following indicators and will give false signals in a flat market.
- Using too many moving averages on a chart, causing analysis paralysis.

# Practical Example
A stock is in a strong uptrend. Every time it drops slightly, it touches the 50-day SMA and bounces back up. The 50-day SMA is acting as dynamic support. If it finally breaks below the 50-day SMA, it might signal the trend is changing.

# Mini Exercise
Add a 50-day and a 200-day Simple Moving Average to a stock chart. Is the 50-day above or below the 200-day? What does that tell you about the trend?

# Summary
Moving averages are foundational trend-following indicators. They tell you what the trend is and provide dynamic zones of support and resistance.
        `,
        quiz: {
          title: 'Quiz: Moving Averages',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is the primary purpose of a Moving Average?', type: 'mcq', options: ['To predict exact future prices', 'To smooth out price data and identify trends', 'To calculate trading volume', 'To determine dividend payouts'], correctIndex: 1, explanation: 'MAs smooth out volatility to reveal the underlying direction of the market.' },
            { text: 'What is the difference between an SMA and an EMA?', type: 'mcq', options: ['SMA is faster than EMA', 'EMA gives more weight to recent prices', 'SMA is only used for bonds', 'EMA is illegal in some markets'], correctIndex: 1, explanation: 'The Exponential Moving Average (EMA) weights recent data more heavily, making it more responsive.' },
            { text: 'What is a "Golden Cross"?', type: 'mcq', options: ['When price crosses the 20 SMA', 'When a short-term MA crosses above a long-term MA', 'When the market closes at an all-time high', 'When volume doubles'], correctIndex: 1, explanation: 'A Golden Cross (e.g., 50 SMA crossing above 200 SMA) is a classic bullish trend reversal signal.' },
            { text: 'In what type of market do moving averages perform poorly?', type: 'mcq', options: ['Strong uptrends', 'Strong downtrends', 'Sideways, choppy markets', 'Bull markets'], correctIndex: 2, explanation: 'MAs are trend-following indicators and generate false signals (whipsaws) in trendless, sideways markets.' },
            { text: 'Which moving average is widely considered the ultimate indicator of the long-term trend?', type: 'mcq', options: ['9-day EMA', '20-day SMA', '50-day SMA', '200-day SMA'], correctIndex: 3, explanation: 'The 200-day SMA is the gold standard for defining the long-term trend of a stock or index.' }
          ]
        }
      }
    ]
  },
  {
    title: 'Options Basics',
    level: 'advanced',
    description: 'An advanced introduction to financial derivatives, call options, and put options.',
    category: 'Derivatives',
    tags: ['options', 'calls', 'puts', 'leverage'],
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    estimatedHours: 5,
    xpReward: 300,
    order: 3,
    lessons: [
      {
        title: 'What is an Option?',
        difficulty: 'advanced',
        estimatedMinutes: 20,
        content: `
# Introduction
Options are powerful, complex financial instruments known as derivatives. They derive their value from an underlying asset, like a stock.

# Main Content
An option is a contract that gives the buyer the **right, but not the obligation**, to buy or sell an underlying asset at a specific price on or before a specific date.

## Calls and Puts
There are two main types of options:
1. **Call Option**: Gives you the right to BUY the underlying stock. You buy a Call if you think the stock price will go UP.
2. **Put Option**: Gives you the right to SELL the underlying stock. You buy a Put if you think the stock price will go DOWN.

## The Vocabulary
- **Strike Price**: The specified price at which the contract can be exercised.
- **Expiration Date**: The date the contract expires and becomes worthless if not exercised.
- **Premium**: The price you pay to purchase the option contract.
- **Multiplier**: In the US and many markets, 1 standard option contract controls 100 shares of the underlying stock.

# Key Takeaways
✓ Options are contracts, not shares of a company.
✓ Calls are for bullish bets; Puts are for bearish bets.
✓ Options have an expiration date (unlike stocks which you can hold forever).

# Common Mistakes
- Buying options without understanding "Time Decay" (Theta). Options lose value every day they get closer to expiration.
- Risking your entire portfolio on short-dated, out-of-the-money options (which is essentially gambling).

# Practical Example
Stock X is trading at ₹100. You buy a Call Option with a Strike Price of ₹105, expiring in one month, for a Premium of ₹2.
If Stock X rockets to ₹120 before expiration, you have the right to buy it for ₹105. Your option becomes highly valuable.
If Stock X stays at ₹100, your option expires worthless, and you lose your ₹2 premium.

# Mini Exercise
Write down the definitions of Strike Price, Premium, and Expiration Date without looking at the text above.

# Summary
Options offer leverage and flexibility. They can be used to speculate on massive gains or to act as insurance (hedging) for your portfolio. However, they carry significant risk of total loss of the premium paid.
        `,
        quiz: {
          title: 'Quiz: Options Basics',
          passingScore: 60,
          xpReward: 50,
          questions: [
            { text: 'What is a Call Option?', type: 'mcq', options: ['The obligation to buy a stock', 'The right to buy a stock', 'The right to sell a stock', 'A dividend payment'], correctIndex: 1, explanation: 'A Call option gives the buyer the right—but NOT the obligation—to buy the underlying stock at the strike price.' },
            { text: 'When would you typically buy a Put Option?', type: 'mcq', options: ['When you think the stock will go up', 'When you think the stock will go down', 'When you want to earn voting rights', 'When you want to collect dividends'], correctIndex: 1, explanation: 'A Put option increases in value when the underlying stock price falls, making it a bearish instrument.' },
            { text: 'What is the "Strike Price" in an options contract?', type: 'mcq', options: ['The current market price of the stock', 'The price at which the option can be exercised', 'The maximum loss on the trade', 'The premium paid for the contract'], correctIndex: 1, explanation: 'The strike price is the pre-agreed price at which the option buyer can buy (call) or sell (put) the underlying asset.' },
            { text: 'What is the "Premium" of an option?', type: 'mcq', options: ['The stock\'s highest historical price', 'The price paid to purchase the option contract', 'The price at which the option is exercised', 'The broker\'s commission fee'], correctIndex: 1, explanation: 'The premium is the cost to buy the option contract. It is the maximum amount a buyer can lose if the option expires worthless.' },
            { text: 'What happens if an option is not exercised before its Expiration Date?', type: 'mcq', options: ['It automatically converts into shares', 'It is carried forward to next month', 'It expires worthless and the premium is lost', 'The broker refunds the premium'], correctIndex: 2, explanation: 'Unlike stocks, options have an expiration date. If the market does not move in your favour, the contract expires worthless and you lose the premium paid.' }
          ]
        }
      }
    ]
  },
  {
    title: 'Value Investing',
    level: 'intermediate',
    subtitle: 'Learn the strategies used by Warren Buffett and Benjamin Graham.',
    description: 'Learn the strategies used by Warren Buffett and Benjamin Graham to identify intrinsic value, evaluate economic moats, and build long-term wealth.',
    category: 'Strategy',
    tags: ['value investing', 'warren buffett', 'benjamin graham', 'investing'],
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    estimatedHours: 0.75,
    estimatedDuration: '45 mins',
    totalDuration: '45 mins',
    estimatedMinutes: 45,
    xpReward: 200,
    order: 2,
    lessons: [
      {
        title: 'Intrinsic Value & Margin of Safety',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        content: `
# Introduction
Value investing is the practice of buying stocks that appear underpriced relative to their intrinsic value — and holding them until the market recognizes their true worth. It was pioneered by Benjamin Graham and perfected by Warren Buffett.

# Main Content
Intrinsic value is the true economic worth of a company, calculated by estimating future cash flows and discounting them to the present.

## Margin of Safety
> Buy ₹1 of value for ₹0.60. — Benjamin Graham

The margin of safety is the difference between a stock's intrinsic value and its market price.

# Key Takeaways
✓ Buy at a discount to intrinsic value to maintain a margin of safety.
✓ Focus on durable competitive advantages.
        `,
        quiz: {
          title: 'Quiz: Intrinsic Value & Margin of Safety',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What does "intrinsic value" of a stock mean?', type: 'mcq', options: ['The current market price of the stock', 'The true economic worth based on future cash flows', 'The book value listed on the balance sheet', 'The highest price the stock has ever reached'], correctIndex: 1, explanation: 'Intrinsic value is the calculated true worth of a company—typically derived by discounting expected future cash flows back to the present.' },
            { text: 'What is the Margin of Safety in value investing?', type: 'mcq', options: ['A stop-loss order placed on every trade', 'The difference between intrinsic value and the market price paid', 'The cash reserve held by the company', 'The maximum drawdown a portfolio can absorb'], correctIndex: 1, explanation: 'Margin of safety means buying a stock at a meaningful discount to its intrinsic value—so if your estimate is wrong, you still don\'t lose much.' },
            { text: 'Who pioneered the concept of value investing?', type: 'mcq', options: ['George Soros', 'Benjamin Graham', 'Peter Lynch', 'John Maynard Keynes'], correctIndex: 1, explanation: 'Benjamin Graham, in his books "Security Analysis" and "The Intelligent Investor," laid the foundation of value investing. Warren Buffett was his most famous student.' },
            { text: 'If a company\'s intrinsic value is ₹200 per share and it trades at ₹140, what is the margin of safety?', type: 'mcq', options: ['₹60, or 30%', '₹140, or 70%', '₹200, or 100%', '₹60, or 43%'], correctIndex: 0, explanation: 'Margin of safety = (Intrinsic Value − Market Price) / Intrinsic Value = (200 − 140) / 200 = 30%. The ₹60 discount is the absolute margin of safety.' },
            { text: 'Why is a margin of safety important?', type: 'mcq', options: ['It guarantees a profit', 'It protects against estimation errors and unexpected bad news', 'It helps avoid paying brokerage fees', 'It is required by stock exchange regulators'], correctIndex: 1, explanation: 'No valuation model is perfect. The margin of safety cushions you against analytical errors, overly optimistic assumptions, or unforeseen events that hurt the business.' }
          ]
        }
      },
      {
        title: 'Economic Moats & Competitive Advantage',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        content: `
# Introduction
An economic moat is a durable competitive advantage that protects a company's long-term profitability.

# Main Content
Moats allow a business to earn high returns on capital over decades. Types of moats include brand power, network effects, cost advantages, switching costs, and regulatory barriers.

# Key Takeaways
✓ Durable moats sustain high corporate profitability.
        `,
        quiz: {
          title: 'Quiz: Economic Moats',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What is an "economic moat"?', type: 'mcq', options: ['A company\'s debt load', 'A durable competitive advantage protecting long-term profitability', 'A short-term promotional campaign', 'The geographic distance between competitors'], correctIndex: 1, explanation: 'Warren Buffett popularized the term "economic moat" to describe a company\'s durable structural advantages that prevent competitors from eroding its profits.' },
            { text: 'Which of the following is an example of a "network effect" moat?', type: 'mcq', options: ['A company that manufactures cheaply in bulk', 'A social media platform that becomes more valuable as more people use it', 'A firm with a government contract', 'A business with a famous logo'], correctIndex: 1, explanation: 'Network effects occur when a product or service becomes more valuable as more people use it—classic examples include payment networks, social media, and marketplaces.' },
            { text: 'What type of moat does a pharmaceutical company enjoy when it holds a 20-year patent on a drug?', type: 'mcq', options: ['Network effects', 'Cost advantage', 'Regulatory/Intangible asset moat', 'Switching cost moat'], correctIndex: 2, explanation: 'Patents are intangible assets that provide a legal monopoly on a product. They represent a regulatory/intangible asset moat.' },
            { text: 'A company\'s customers rarely switch because their entire workflow depends on the company\'s software. This is called:', type: 'mcq', options: ['A brand moat', 'A switching cost moat', 'A cost advantage moat', 'A network effect'], correctIndex: 1, explanation: 'Switching costs arise when it is expensive or disruptive for customers to move to a competitor. Enterprise software companies (like Oracle or SAP) often enjoy this moat.' },
            { text: 'Why do value investors specifically look for companies with wide moats?', type: 'mcq', options: ['Because moated companies have the most volatile stock prices', 'Because moats ensure the company can sustain high returns on capital over decades', 'Because regulators require moated companies to pay higher dividends', 'Because moats indicate the company has the lowest P/E ratio'], correctIndex: 1, explanation: 'A wide moat means the company can keep competitors at bay, allowing it to compound earnings at high rates for many years—the foundation of long-term wealth creation.' }
          ]
        }
      },
      {
        title: 'Financial Metrics for Value Investors',
        difficulty: 'intermediate',
        estimatedMinutes: 15,
        content: `
# Introduction
Value investors analyze financial metrics to evaluate corporate health and valuation.

# Main Content
Key metrics include Price-to-Earnings (P/E), Price-to-Book (P/B), Return on Equity (ROE), and Free Cash Flow.

# Key Takeaways
✓ Evaluate fundamental metrics before purchasing shares.
        `,
        quiz: {
          title: 'Quiz: Financial Metrics for Value Investors',
          passingScore: 60,
          xpReward: 40,
          questions: [
            { text: 'What does the Price-to-Earnings (P/E) ratio measure?', type: 'mcq', options: ['How much debt a company has relative to equity', 'How much investors are willing to pay for each ₹1 of earnings', 'The percentage of profits paid as dividends', 'The company\'s market cap divided by its book value'], correctIndex: 1, explanation: 'P/E = Market Price per Share ÷ Earnings per Share. A P/E of 20 means investors pay ₹20 for every ₹1 of annual earnings. Lower P/E can indicate undervaluation relative to peers.' },
            { text: 'A company has a Return on Equity (ROE) of 25%. What does this mean?', type: 'mcq', options: ['The stock has risen 25% this year', 'For every ₹100 of shareholders\' equity, the company earned ₹25 in profit', 'The company has a 25% profit margin on sales', 'Debt accounts for 25% of the company\'s capital structure'], correctIndex: 1, explanation: 'ROE = Net Income ÷ Shareholders\' Equity. An ROE of 25% means the company generates ₹25 of profit for every ₹100 invested by shareholders—a strong indicator of management efficiency.' },
            { text: 'Why do value investors prefer companies with high Free Cash Flow (FCF)?', type: 'mcq', options: ['High FCF means the stock price will always rise', 'FCF represents real cash generated after capital expenditures, which can be returned to shareholders or reinvested', 'High FCF guarantees a government subsidy', 'FCF determines the company\'s credit rating'], correctIndex: 1, explanation: 'Free Cash Flow = Operating Cash Flow − Capital Expenditures. Unlike reported earnings, FCF is hard to manipulate. Companies with strong FCF can pay dividends, reduce debt, or fund growth.' },
            { text: 'The Price-to-Book (P/B) ratio compares:', type: 'mcq', options: ['A company\'s revenue to its market cap', 'A company\'s market price to its net asset value per share', 'Annual earnings growth to the stock price', 'Total dividends paid to total earnings'], correctIndex: 1, explanation: 'P/B = Market Price ÷ Book Value per Share. Book value is what shareholders would theoretically receive if the company liquidated all assets and paid all debts. A P/B < 1 can signal deep value.' },
            { text: 'Which financial metric is often called the "price of growth" because it factors in earnings growth rate?', type: 'mcq', options: ['P/E Ratio', 'P/B Ratio', 'PEG Ratio', 'ROE'], correctIndex: 2, explanation: 'PEG = P/E ÷ Annual EPS Growth Rate. A PEG below 1.0 may indicate a stock is undervalued relative to its growth prospects. Peter Lynch popularized this metric for growth-at-a-reasonable-price investing.' }
          ]
        }
      }
    ]
  }
];

// ============================================================================
// 2. PROCEDURAL GENERATOR FOR REMAINING COURSES
// ============================================================================

// A list of topics to generate the remaining courses.
const TOPICS = [
  { title: 'Reading Stock Charts', level: 'beginner', cat: 'Analysis' },
  { title: 'Risk vs Reward', level: 'beginner', cat: 'General' },
  { title: 'Financial Statements Analysis', level: 'intermediate', cat: 'Fundamental' },
  { title: 'Growth Investing', level: 'intermediate', cat: 'Strategy' },
  { title: 'Behavioral Finance', level: 'advanced', cat: 'Psychology' },
  { title: 'Risk Management', level: 'advanced', cat: 'Strategy' },
  { title: 'Portfolio Rebalancing', level: 'intermediate', cat: 'Portfolio' },
  { title: 'Dividend Investing', level: 'beginner', cat: 'Strategy' },
  { title: 'Understanding ETFs', level: 'beginner', cat: 'Asset Classes' },
  { title: 'Market Sentiment Indicators', level: 'intermediate', cat: 'Analysis' },
  { title: 'Algorithmic Trading Basics', level: 'advanced', cat: 'Trading' },
  { title: 'Macroeconomics for Investors', level: 'advanced', cat: 'Economy' },
  { title: 'Short Selling', level: 'intermediate', cat: 'Trading' },
  { title: 'Cryptocurrency Basics', level: 'beginner', cat: 'Asset Classes' },
  { title: 'Real Estate Investment Trusts (REITs)', level: 'intermediate', cat: 'Asset Classes' },
  { title: 'Advanced Options Strategies', level: 'advanced', cat: 'Derivatives' }
];

// ── Topic-specific quiz bank ──────────────────────────────────────────────────
// Each topic has 2 quiz sets (A for modules 1-3, B for modules 4-6) of 5
// questions each. All correctIndex values are verified against their options.
const TOPIC_QUIZ_BANK = {
  'Reading Stock Charts': [
    { text: 'What does a stock chart primarily display?', type: 'mcq', options: ['A company\'s annual report', 'Price and volume history over time', 'Dividend payment schedule', 'List of shareholders'], correctIndex: 1, explanation: 'Stock charts plot price (and often volume) over a time period, allowing traders to analyse historical trends and patterns.' },
    { text: 'On a price chart, what does a "higher high and higher low" pattern indicate?', type: 'mcq', options: ['A downtrend', 'An uptrend', 'A sideways market', 'Market closure'], correctIndex: 1, explanation: 'A series of higher highs and higher lows is the classic definition of an uptrend, showing buyers are progressively in control.' },
    { text: 'What does trading volume represent on a stock chart?', type: 'mcq', options: ['The number of companies listed', 'The number of shares traded in a period', 'The price range during the day', 'The dividend amount'], correctIndex: 1, explanation: 'Volume measures how many shares changed hands during a given period. Rising price on high volume is a strong bullish confirmation.' },
    { text: 'Which chart type shows individual data points connected by a single line?', type: 'mcq', options: ['Bar chart', 'Candlestick chart', 'Line chart', 'Point-and-figure chart'], correctIndex: 2, explanation: 'A line chart connects closing prices with a single line—the simplest chart type, best for seeing the overall trend.' },
    { text: 'What does it mean when a stock makes a "new 52-week high"?', type: 'mcq', options: ['The stock has crashed to its lowest point in a year', 'The stock reached its highest price in the past 52 weeks', 'Trading volume doubled for 52 consecutive weeks', 'The stock was halted for 52 weeks'], correctIndex: 1, explanation: 'A 52-week high is a bullish milestone—the stock has not traded this high in the past year. It often attracts momentum buyers.' },
    { text: 'In chart analysis, what is a "trend line"?', type: 'mcq', options: ['A line connecting the broker to the stock exchange', 'A straight line drawn along a series of highs or lows to define the trend direction', 'A line showing the average price over 200 days', 'The daily closing price printed as a horizontal line'], correctIndex: 1, explanation: 'A trend line connects at least two swing highs (in a downtrend) or swing lows (in an uptrend) to identify the trajectory of price movement.' },
    { text: 'What is a "gap" on a stock chart?', type: 'mcq', options: ['A missing day of data due to a holiday', 'A price area where no trading occurred, causing a visible space between candles', 'The difference between bid and ask price', 'A pause in trading due to a circuit breaker'], correctIndex: 1, explanation: 'A gap occurs when a stock opens significantly above or below its previous close, leaving a visible empty space on the chart. Gaps often signal strong catalysts like earnings surprises.' },
    { text: 'What does a long consolidation pattern on a chart typically precede?', type: 'mcq', options: ['A stock delisting', 'A significant price move in either direction', 'A dividend cut', 'Guaranteed losses'], correctIndex: 1, explanation: 'Consolidation—price moving sideways in a narrow range—builds energy. When the range breaks out, it often leads to a sharp directional move.' }
  ],
  'Risk vs Reward': [
    { text: 'What does a risk/reward ratio of 1:3 mean?', type: 'mcq', options: ['You risk ₹3 to make ₹1', 'You risk ₹1 to potentially make ₹3', 'Your portfolio has 3× leverage', 'Your win rate is 33%'], correctIndex: 1, explanation: 'A 1:3 risk/reward ratio means for every ₹1 you risk (your stop-loss distance), your target profit is ₹3. Even a 40% win rate is profitable with this ratio.' },
    { text: 'What is a "stop-loss order"?', type: 'mcq', options: ['An order to buy more shares if the price rises', 'A pre-set instruction to sell a position if it falls to a certain price', 'An order that expires at market close', 'An instruction to hold shares for 30 days'], correctIndex: 1, explanation: 'A stop-loss is a risk management tool that automatically exits your position if the price drops to your pre-defined loss limit.' },
    { text: 'What is "position sizing"?', type: 'mcq', options: ['The number of different brokers you use', 'Deciding how much capital to allocate to each individual trade', 'The physical size of a trading firm\'s office', 'A technical analysis pattern'], correctIndex: 1, explanation: 'Position sizing determines what percentage of your capital to put in each trade. Proper sizing ensures no single loss can devastate your portfolio.' },
    { text: 'What is the relationship between risk and potential return in investing?', type: 'mcq', options: ['Higher risk always guarantees higher returns', 'Lower risk generally offers lower potential returns, and higher risk offers higher potential returns', 'Risk and return have no relationship', 'Risk only matters for short-term traders'], correctIndex: 1, explanation: 'Higher potential returns generally come with higher risk. This is a fundamental principle of investing—there is no free lunch.' },
    { text: 'What does "expected value" (EV) help a trader determine?', type: 'mcq', options: ['The exact profit of the next trade', 'Whether a trading strategy is profitable over many trades on average', 'The tax liability on gains', 'The total number of trades allowed per day'], correctIndex: 1, explanation: 'EV = (Win Probability × Avg Win) − (Loss Probability × Avg Loss). A positive EV strategy will be profitable over a large enough sample of trades, even with a below-50% win rate.' },
    { text: 'A trader risks 2% of their ₹5,00,000 portfolio on each trade. What is their maximum loss per trade?', type: 'mcq', options: ['₹500', '₹1,000', '₹5,000', '₹10,000'], correctIndex: 3, explanation: '2% of ₹5,00,000 = ₹10,000. Risking a fixed small percentage per trade ensures that a losing streak cannot destroy the portfolio.' },
    { text: 'What is "maximum drawdown" in a portfolio?', type: 'mcq', options: ['The total number of losing trades', 'The largest peak-to-trough decline in portfolio value before a new high is reached', 'The maximum amount invested at any point', 'The difference between the highest and lowest stock price in a day'], correctIndex: 1, explanation: 'Maximum drawdown measures the worst-case scenario—how far your portfolio fell from its peak before recovering. It is a key measure of downside risk.' },
    { text: 'Why do professional traders typically risk only 1-2% of their capital per trade?', type: 'mcq', options: ['Regulators require it', 'To ensure a long series of losses cannot wipe out the account', 'To maximize short-term profits', 'Because leverage caps risk at 2%'], correctIndex: 1, explanation: 'Risking 1-2% per trade means you need 50-100 consecutive losses to lose your capital. This allows a trader to survive drawdowns and recover without emotional distress.' }
  ],
  'Financial Statements Analysis': [
    { text: 'Which financial statement shows a company\'s revenues, expenses, and profit over a period?', type: 'mcq', options: ['Balance Sheet', 'Income Statement (P&L)', 'Cash Flow Statement', 'Statement of Shareholders\' Equity'], correctIndex: 1, explanation: 'The Income Statement (also called the Profit & Loss or P&L statement) summarizes revenues and expenses over a period, resulting in a net profit or loss figure.' },
    { text: 'On a Balance Sheet, the fundamental equation is:', type: 'mcq', options: ['Revenue − Expenses = Profit', 'Assets = Liabilities + Shareholders\' Equity', 'Cash Flow = Net Income + Depreciation', 'Dividends = Earnings per Share × Shares'], correctIndex: 1, explanation: 'The accounting equation Assets = Liabilities + Equity is the foundation of the balance sheet. It shows what a company owns (assets) vs. what it owes (liabilities) and what belongs to owners (equity).' },
    { text: 'What does the Cash Flow Statement reveal that the Income Statement does not?', type: 'mcq', options: ['Total revenue for the year', 'The actual movement of cash into and out of the business', 'The breakdown of operating expenses', 'The number of employees'], correctIndex: 1, explanation: 'A company can be profitable on paper but cash-poor. The Cash Flow Statement shows real cash inflows and outflows, revealing whether the business can sustain itself.' },
    { text: 'What is "Gross Profit"?', type: 'mcq', options: ['Revenue minus all expenses including tax', 'Revenue minus Cost of Goods Sold (COGS)', 'Operating income before interest and tax', 'Net income available to shareholders'], correctIndex: 1, explanation: 'Gross Profit = Revenue − COGS. It shows the profit from the core product/service before overhead costs, and reflects production efficiency.' },
    { text: 'What does a high Debt-to-Equity (D/E) ratio indicate?', type: 'mcq', options: ['The company has no debt', 'The company is primarily financed by equity', 'The company uses significantly more debt than equity in its capital structure', 'The company recently issued new shares'], correctIndex: 2, explanation: 'D/E = Total Debt ÷ Shareholders\' Equity. A high D/E ratio means the company is heavily leveraged. This amplifies returns in good times but increases bankruptcy risk in bad times.' },
    { text: 'What is "EBITDA" used to measure?', type: 'mcq', options: ['Employee benefits and tax deductions', 'Operational profitability before financing and accounting decisions', 'Extra dividends paid to shareholders', 'Exchange rate impact on revenues'], correctIndex: 1, explanation: 'EBITDA = Earnings Before Interest, Tax, Depreciation & Amortisation. It approximates a company\'s operating cash generation and is widely used for comparing companies regardless of their capital structure.' },
    { text: 'If a company\'s revenue grows but net profit margin shrinks, what does this likely indicate?', type: 'mcq', options: ['The business is becoming more efficient', 'Costs are rising faster than revenues', 'The company is reducing its debt', 'The dividend payout is increasing'], correctIndex: 1, explanation: 'A shrinking net margin despite revenue growth signals that operating costs, interest expense, or taxes are increasing faster than revenues—a red flag for investors.' },
    { text: 'What is "Working Capital"?', type: 'mcq', options: ['Total long-term assets of the company', 'Current Assets minus Current Liabilities', 'The company\'s total invested capital', 'Revenue multiplied by profit margin'], correctIndex: 1, explanation: 'Working Capital = Current Assets − Current Liabilities. Positive working capital means the company can cover its short-term obligations. Negative working capital can signal liquidity problems.' }
  ],
  'Growth Investing': [
    { text: 'What is the core idea behind growth investing?', type: 'mcq', options: ['Buying cheap, undervalued stocks', 'Investing in companies expected to grow revenues and earnings faster than the market average', 'Investing only in dividend-paying stocks', 'Buying government bonds during economic expansions'], correctIndex: 1, explanation: 'Growth investors seek companies growing revenues, earnings, and market share at an above-average rate—accepting higher valuations in exchange for superior future returns.' },
    { text: 'What metric is most commonly used to identify growth stocks?', type: 'mcq', options: ['Dividend Yield', 'Revenue Growth Rate', 'Debt-to-Equity Ratio', 'Current Ratio'], correctIndex: 1, explanation: 'Revenue growth rate is the primary indicator for growth investors. Consistent 20-30%+ annual revenue growth is a hallmark of a high-quality growth stock.' },
    { text: 'Why do growth stocks typically have high Price-to-Earnings (P/E) ratios?', type: 'mcq', options: ['Because they pay high dividends', 'Because investors are paying for expected future earnings, not current earnings', 'Because they have low risk', 'Because they are regulated by government authorities'], correctIndex: 1, explanation: 'Growth stocks are priced on future potential. Investors accept high P/E ratios because they expect earnings to grow dramatically, making the current premium worthwhile.' },
    { text: 'What is the main risk of growth investing?', type: 'mcq', options: ['Missing dividend payments', 'If growth slows or disappoints, the premium valuation can collapse sharply', 'Currency exchange rate losses', 'The company paying back too much cash to shareholders'], correctIndex: 1, explanation: 'Growth stocks are priced for perfection. If a company reports even slightly lower growth than expected, the stock can drop 20-40% rapidly as the valuation premium unwinds.' },
    { text: 'Which legendary investor developed the "CANSLIM" system for finding growth stocks?', type: 'mcq', options: ['Warren Buffett', 'William J. O\'Neil', 'Benjamin Graham', 'Ray Dalio'], correctIndex: 1, explanation: 'William J. O\'Neil developed the CANSLIM system (Current Earnings, Annual Earnings, New Products, Supply & Demand, Leader, Institutional Sponsorship, Market Direction) for identifying leading growth stocks.' },
    { text: 'What does the "TAM" (Total Addressable Market) concept help growth investors assess?', type: 'mcq', options: ['The total dividends paid by the market', 'The maximum potential revenue opportunity a company can pursue', 'The total assets managed by the company', 'Tax credits available for growth companies'], correctIndex: 1, explanation: 'TAM represents the total market demand for a product or service. A large, growing TAM indicates the company has a long runway for expansion.' },
    { text: 'Which sector is most commonly associated with growth stocks?', type: 'mcq', options: ['Utilities', 'Consumer Staples', 'Technology', 'Telecommunications'], correctIndex: 2, explanation: 'Technology companies often exhibit rapid product adoption, scalable business models, and high revenue growth rates—making the sector the most common home of growth stocks.' },
    { text: 'In growth investing, what does "Rule of 40" evaluate for SaaS companies?', type: 'mcq', options: ['Whether 40% of shares are held by institutions', 'Whether revenue growth rate + profit margin ≥ 40%', 'Whether the company has 40 product lines', 'Whether the P/E ratio is below 40'], correctIndex: 1, explanation: 'The Rule of 40 states that a healthy SaaS company\'s revenue growth rate plus profit margin (or FCF margin) should equal or exceed 40%. It balances growth and profitability.' }
  ],
  'Behavioral Finance': [
    { text: 'What is "loss aversion" in behavioral finance?', type: 'mcq', options: ['Avoiding all investments with any chance of loss', 'The tendency for losses to feel psychologically about twice as painful as equivalent gains feel good', 'Selling all stocks during a market crash', 'Refusing to sell a losing position under any circumstances'], correctIndex: 1, explanation: 'Research by Kahneman & Tversky found that losses feel roughly twice as painful as equivalent gains feel pleasurable. This causes investors to hold losing trades too long and sell winners too early.' },
    { text: 'What is "confirmation bias"?', type: 'mcq', options: ['Checking your portfolio every five minutes', 'The tendency to seek out information that confirms your existing beliefs and ignore contradicting evidence', 'Verifying a broker\'s credentials before investing', 'Buying stocks after their quarterly results confirm growth'], correctIndex: 1, explanation: 'Confirmation bias leads investors to only read bullish news about stocks they own and ignore bearish analysis—reinforcing poor decisions and preventing objective reassessment.' },
    { text: 'What is the "Herd Mentality" in markets?', type: 'mcq', options: ['Investing in livestock companies', 'The tendency to follow the crowd and copy the actions of other investors instead of thinking independently', 'A strategy of only buying S&P 500 index funds', 'Hiring multiple financial advisors simultaneously'], correctIndex: 1, explanation: 'Herd mentality drives speculative bubbles (everyone buys because everyone is buying) and crashes (everyone sells because everyone is selling). Contrarian investors try to exploit this predictable irrationality.' },
    { text: 'What is "Anchoring Bias"?', type: 'mcq', options: ['Setting an anchor price for a limit order', 'Over-relying on the first piece of information encountered when making decisions', 'Anchoring your portfolio to a benchmark index', 'Keeping a fixed allocation in bonds as an anchor'], correctIndex: 1, explanation: 'Anchoring occurs when investors fixate on a reference point—like a stock\'s purchase price or its 52-week high—and let that number irrationally influence future decisions.' },
    { text: 'What is "Overconfidence Bias" in investing?', type: 'mcq', options: ['Having confidence in blue-chip stocks', 'Overestimating your own ability to predict market movements and pick winning stocks', 'Being too conservative with position sizing', 'Choosing index funds over individual stocks'], correctIndex: 1, explanation: 'Studies consistently show most individual investors believe they are above-average stock pickers. This overconfidence leads to excessive trading, poor risk management, and underperformance vs. passive investing.' },
    { text: 'What is the "Sunk Cost Fallacy" as it applies to investing?', type: 'mcq', options: ['Investing in companies with high costs', 'Continuing to hold a losing position simply because of the amount already invested, rather than its future prospects', 'Calculating the true cost of investing including fees', 'A method of calculating your cost basis for taxes'], correctIndex: 1, explanation: 'The sunk cost fallacy causes investors to say "I can\'t sell—I\'m down 40%!" Instead, investment decisions should be based purely on future expected value, not past money spent.' },
    { text: 'What is "Recency Bias"?', type: 'mcq', options: ['Only investing in recently IPO-ed companies', 'Giving too much weight to recent events when forecasting the future', 'Reviewing your portfolio once a month', 'Investing based on last year\'s annual reports'], correctIndex: 1, explanation: 'Recency bias causes investors to extrapolate recent trends indefinitely—expecting the bull market to continue forever at the top, or selling everything at the bottom of a bear market.' },
    { text: 'How can an investor combat behavioral biases?', type: 'mcq', options: ['Check market news 24/7 to stay informed', 'Develop a written investment plan with pre-defined entry/exit rules and stick to it', 'Only invest in familiar local companies', 'Avoid using stop-losses to prevent emotional decisions'], correctIndex: 1, explanation: 'A pre-written investment policy statement with defined rules removes in-the-moment emotional decisions. Systematic strategies (like automatic rebalancing and stop-losses) enforce discipline.' }
  ],
  'Risk Management': [
    { text: 'What is "Systematic Risk"?', type: 'mcq', options: ['Risk specific to a single company', 'Risk that affects the entire market and cannot be diversified away', 'Risk from a computer system failure at a broker', 'Risk eliminated by using stop-loss orders'], correctIndex: 1, explanation: 'Systematic risk (market risk) affects all investments—examples include recessions, interest rate changes, or geopolitical events. It cannot be eliminated through diversification.' },
    { text: 'What is "Unsystematic Risk"?', type: 'mcq', options: ['Broad economic recession risk', 'Company-specific or sector-specific risk that can be reduced through diversification', 'Interest rate risk from central bank policy', 'Inflation risk over long time horizons'], correctIndex: 1, explanation: 'Unsystematic risk is unique to a specific company or industry—a product recall, management scandal, or sector downturn. Diversifying across many unrelated assets eliminates this type of risk.' },
    { text: 'What does a Portfolio "Beta" of 1.5 mean?', type: 'mcq', options: ['The portfolio returns 1.5% per year', 'The portfolio moves 1.5× as much as the broader market—more volatile', 'The portfolio holds 1.5× leverage', 'The portfolio outperforms the market by 50%'], correctIndex: 1, explanation: 'Beta measures a portfolio\'s volatility relative to the market (Beta=1). A Beta of 1.5 means if the market drops 10%, the portfolio is likely to drop ~15%—carrying more systematic risk.' },
    { text: 'What is "Value at Risk" (VaR)?', type: 'mcq', options: ['The maximum profit a portfolio can generate', 'A statistical estimate of the maximum loss a portfolio could suffer over a given period at a certain confidence level', 'The total market value of the portfolio', 'The current intrinsic value of the portfolio vs. its market value'], correctIndex: 1, explanation: 'VaR answers: "With 95% confidence, what is the worst loss I could experience in the next day (or week or month)?" It quantifies downside risk in a single number.' },
    { text: 'What is "Hedging" in portfolio management?', type: 'mcq', options: ['Investing in hedge funds', 'Taking an offsetting position to reduce the risk of adverse price movements in an existing position', 'Keeping 50% of the portfolio in cash at all times', 'Splitting investments evenly between stocks and bonds'], correctIndex: 1, explanation: 'Hedging involves opening a second position that profits when your primary position loses—like buying put options on stocks you own. It reduces risk at the cost of some potential profit.' },
    { text: 'What does the "Sharpe Ratio" measure?', type: 'mcq', options: ['A portfolio\'s total return over a year', 'Risk-adjusted return—how much excess return is generated per unit of risk taken', 'The ratio of winning trades to losing trades', 'The correlation between two assets in a portfolio'], correctIndex: 1, explanation: 'Sharpe Ratio = (Portfolio Return − Risk-Free Rate) ÷ Portfolio Standard Deviation. A higher Sharpe Ratio means more return per unit of risk. A ratio above 1.0 is generally considered good.' },
    { text: 'What is "Correlation" between two assets and why does it matter for risk?', type: 'mcq', options: ['The average return of two assets combined', 'The statistical measure of how two assets move in relation to each other; low/negative correlation reduces portfolio risk', 'The commission charged for holding two assets simultaneously', 'The regulatory relationship between two stock exchanges'], correctIndex: 1, explanation: 'Assets with low or negative correlation (they move differently or oppositely) reduce portfolio volatility when combined. This is why combining stocks and bonds historically lowers portfolio risk.' },
    { text: 'What is the "Kelly Criterion" used for in trading?', type: 'mcq', options: ['Determining when to contact your broker', 'Calculating the optimal position size to maximise long-term growth while avoiding ruin', 'Selecting the best performing mutual fund', 'Setting the correct take-profit price target'], correctIndex: 1, explanation: 'The Kelly Criterion is a mathematical formula: f = (bp − q) / b, where f is fraction of capital to bet, b is odds, p is win probability, and q is loss probability. It maximises long-run capital growth.' }
  ],
  'Portfolio Rebalancing': [
    { text: 'What is "portfolio rebalancing"?', type: 'mcq', options: ['Adding new money to a portfolio', 'Restoring a portfolio to its target asset allocation by buying or selling positions', 'Switching brokers for lower fees', 'Reinvesting all dividend payments'], correctIndex: 1, explanation: 'Over time, winning assets grow to represent a larger share of the portfolio, increasing risk. Rebalancing sells some winners and buys underweighted assets to restore the original target allocation.' },
    { text: 'If your target allocation is 60% stocks/40% bonds and stocks rise to 75%, what should you do to rebalance?', type: 'mcq', options: ['Sell bonds and buy more stocks', 'Sell some stocks and buy more bonds to restore the 60/40 split', 'Hold and wait for bonds to recover', 'Switch to a 100% stock portfolio'], correctIndex: 1, explanation: 'Rebalancing requires selling the outperformer (stocks at 75%) back to 60% and using the proceeds to buy the underweight asset (bonds) back to 40%.' },
    { text: 'What is the main benefit of systematic rebalancing?', type: 'mcq', options: ['It guarantees higher returns than buy-and-hold', 'It enforces "sell high, buy low" discipline automatically and maintains your target risk level', 'It eliminates the need for stop-loss orders', 'It maximises short-term trading profits'], correctIndex: 1, explanation: 'Systematic rebalancing forces you to take profits from winners and reinvest in laggards—implementing "sell high, buy low" without emotional decision-making.' },
    { text: 'What is "threshold-based rebalancing"?', type: 'mcq', options: ['Rebalancing every month regardless of market conditions', 'Rebalancing only when any asset class drifts more than a set percentage from its target (e.g., ±5%)', 'Rebalancing based on economic forecasts', 'Rebalancing after every quarterly earnings season'], correctIndex: 1, explanation: 'Threshold-based rebalancing (also called "percentage-of-portfolio" rebalancing) only triggers when an asset class has drifted sufficiently from its target—reducing unnecessary transaction costs.' },
    { text: 'What is a major tax consideration when rebalancing a taxable (non-retirement) account?', type: 'mcq', options: ['Rebalancing is always tax-free', 'Selling appreciated positions triggers capital gains taxes', 'Buying new positions creates a tax liability immediately', 'Bonds are never taxed when sold'], correctIndex: 1, explanation: 'Selling stocks that have appreciated creates a taxable capital gains event. Tax-efficient rebalancing strategies include using new contributions to rebalance, or rebalancing inside tax-advantaged accounts.' },
    { text: 'What is "drift" in portfolio management?', type: 'mcq', options: ['A technique for gradually buying into a position', 'When an asset allocation moves away from its target due to differing returns across assets', 'Switching from growth stocks to value stocks', 'A type of limit order that adjusts automatically'], correctIndex: 1, explanation: 'Drift occurs naturally as different assets grow at different rates. A portfolio initially set at 60/40 stocks/bonds might drift to 70/30 after a strong bull market—increasing unintended risk.' },
    { text: 'Why might an investor rebalance more frequently during high market volatility?', type: 'mcq', options: ['To increase leverage during fast-moving markets', 'Because extreme moves create larger allocation drift, and more rebalancing opportunities arise', 'Because volatile markets have no transaction costs', 'To exit the market entirely until calm returns'], correctIndex: 1, explanation: 'High volatility causes allocations to drift quickly and significantly. Frequent rebalancing during volatile markets keeps risk in check and can capture more "buy low, sell high" opportunities.' },
    { text: 'What does "tactical asset allocation" add to standard rebalancing?', type: 'mcq', options: ['Locking allocations in place for 10 years', 'Temporarily shifting allocations based on short-to-medium-term market outlooks, on top of a strategic baseline', 'Outsourcing rebalancing to a robo-advisor exclusively', 'Limiting the portfolio to only three asset classes'], correctIndex: 1, explanation: 'Strategic allocation is the long-term target; tactical allocation involves short-term deviations (e.g., reducing equities before a recession). Tactical rebalancing tries to add alpha beyond the passive baseline.' }
  ],
  'Dividend Investing': [
    { text: 'What is a dividend?', type: 'mcq', options: ['A loan from the company to its shareholders', 'A portion of a company\'s profits distributed to shareholders', 'A fee paid to a stockbroker', 'A tax levied on stock profits'], correctIndex: 1, explanation: 'A dividend is a cash payment (or additional shares) that profitable companies distribute to their shareholders as a share of the profits.' },
    { text: 'What is the "Dividend Yield"?', type: 'mcq', options: ['Total dividends paid in the company\'s history', 'Annual dividend per share divided by the stock price, expressed as a percentage', 'The growth rate of dividends year over year', 'The number of times dividends are paid per year'], correctIndex: 1, explanation: 'Dividend Yield = (Annual Dividend per Share ÷ Stock Price) × 100. A stock at ₹200 paying ₹8 annually has a 4% yield.' },
    { text: 'What does the "Dividend Payout Ratio" indicate?', type: 'mcq', options: ['How much the stock has risen since the dividend was announced', 'The percentage of earnings paid out as dividends', 'The number of shareholders receiving dividends', 'How frequently dividends are paid'], correctIndex: 1, explanation: 'Payout Ratio = Dividends ÷ Net Income. A ratio above 100% means the company is paying out more than it earns—unsustainable long-term. A ratio of 40-60% is generally considered healthy.' },
    { text: 'What is the "Ex-Dividend Date"?', type: 'mcq', options: ['The date the dividend is paid into your account', 'The cut-off date—you must own the stock before this date to receive the upcoming dividend', 'The date the company announces the dividend', 'The date dividends expire if unclaimed'], correctIndex: 1, explanation: 'If a stock has an ex-dividend date of July 10, you must buy the stock before July 10 to receive the dividend. Buying on or after the ex-date means you miss that payment.' },
    { text: 'What is a "Dividend Aristocrat"?', type: 'mcq', options: ['A high-yield dividend fund', 'An S&P 500 company that has increased its dividend every year for at least 25 consecutive years', 'A company paying the highest absolute dividend per share', 'An aristocratic family controlling a dividend-paying conglomerate'], correctIndex: 1, explanation: 'Dividend Aristocrats are S&P 500 companies with 25+ consecutive years of dividend increases. They represent stable, profitable businesses that have grown their payouts through multiple economic cycles.' },
    { text: 'What is "DRIP" in dividend investing?', type: 'mcq', options: ['A chart pattern of declining dividends', 'Dividend Reinvestment Plan—automatically using dividends to buy more shares', 'Diversified REIT Investment Plan', 'Dividend Risk Insurance Policy'], correctIndex: 1, explanation: 'A DRIP automatically reinvests dividend payments into additional shares of the same stock. This harnesses compound growth—dividends earning dividends over time.' },
    { text: 'Which type of company is most likely to pay consistent, growing dividends?', type: 'mcq', options: ['An early-stage tech startup burning through cash', 'A mature, profitable company in a stable industry with steady cash flows', 'A company that recently reported its first quarterly profit', 'A heavily indebted company prioritising debt repayment'], correctIndex: 1, explanation: 'Mature companies in stable industries (consumer staples, utilities, healthcare) generate reliable free cash flow—the foundation for consistent and growing dividend payments.' },
    { text: 'What risk should dividend investors watch for when a yield appears unusually high (e.g., 15%+)?', type: 'mcq', options: ['Excessive dividend payments increasing the stock price', 'A potential "dividend trap"—the high yield may reflect a falling stock price and an unsustainable dividend', 'Regulatory restrictions on high-yield securities', 'Automatic conversion of shares into bonds'], correctIndex: 1, explanation: 'An extremely high yield often signals the stock price has fallen sharply, potentially because the company is in financial distress and the dividend may be cut—a "dividend trap".' }
  ],
  'Understanding ETFs': [
    { text: 'What does ETF stand for?', type: 'mcq', options: ['Electronic Trading Forum', 'Exchange-Traded Fund', 'Equity Transfer Form', 'External Tax Filing'], correctIndex: 1, explanation: 'ETF stands for Exchange-Traded Fund. Like a mutual fund, it holds a basket of assets; unlike a mutual fund, it trades on a stock exchange throughout the day like a regular share.' },
    { text: 'What is the primary advantage of a passive index ETF over an actively managed mutual fund?', type: 'mcq', options: ['It guarantees better performance', 'Lower expense ratios and fees', 'It is less diversified', 'It can only be bought at end-of-day prices'], correctIndex: 1, explanation: 'Passive index ETFs simply track an index (like the Nifty 50 or S&P 500) without active stock selection. This eliminates fund manager fees, resulting in much lower expense ratios—typically 0.05-0.30% vs. 1-2% for active funds.' },
    { text: 'What is the "Expense Ratio" of an ETF?', type: 'mcq', options: ['The fee paid per trade of the ETF', 'The annual fee charged by the fund manager as a percentage of your investment', 'The ratio of equities to bonds in the ETF', 'The difference between the ETF price and its NAV'], correctIndex: 1, explanation: 'The expense ratio is the annual cost to hold an ETF, deducted from the fund\'s assets. A 0.10% expense ratio on a ₹1,00,000 investment costs ₹100 per year.' },
    { text: 'What is the "NAV" (Net Asset Value) of an ETF?', type: 'mcq', options: ['The ETF\'s stock exchange listing price', 'The per-share value of the ETF\'s underlying holdings', 'The total number of shares outstanding', 'The annual dividend paid by the ETF'], correctIndex: 1, explanation: 'NAV = (Total Assets − Liabilities) ÷ Number of Shares. Because ETFs trade on exchanges, their market price may slightly differ from NAV—this difference is the ETF premium or discount.' },
    { text: 'What does a "Sectoral ETF" focus on?', type: 'mcq', options: ['All companies in the S&P 500 index', 'Companies from a specific industry sector (e.g., Technology, Healthcare, Energy)', 'Government bonds and treasury bills', 'International developed market equities only'], correctIndex: 1, explanation: 'Sectoral ETFs hold stocks from a single industry sector—like the Financial Select Sector ETF (XLF) or the iShares Healthcare ETF. They allow targeted exposure to specific economic themes.' },
    { text: 'What is "Tracking Error" in an ETF?', type: 'mcq', options: ['A computer error when placing an ETF trade', 'The difference between an ETF\'s actual return and the return of its benchmark index', 'The incorrect number of shares purchased', 'The bid-ask spread on the ETF'], correctIndex: 1, explanation: 'Tracking error measures how closely an ETF follows its benchmark. A low tracking error (near 0%) means the ETF faithfully replicates the index. Higher tracking errors indicate management inefficiency.' },
    { text: 'What is the key difference between an ETF and a traditional Mutual Fund?', type: 'mcq', options: ['ETFs are only available to institutional investors', 'ETFs trade throughout the day on exchanges like stocks, while mutual fund units are priced and settled once daily at end of market', 'Mutual funds hold fewer stocks than ETFs', 'ETFs are always more expensive than mutual funds'], correctIndex: 1, explanation: 'ETF intraday tradability is its key structural distinction. Mutual fund orders are executed once per day at the closing NAV, while ETFs can be bought and sold at any time during market hours.' },
    { text: 'Which of the following is an example of a Commodity ETF?', type: 'mcq', options: ['NIFTY 50 ETF', 'An ETF that holds physical gold or gold futures', 'A Banking sector ETF', 'An ETF focused on dividend-paying companies'], correctIndex: 1, explanation: 'Commodity ETFs provide exposure to commodities like gold, silver, oil, or agricultural products without requiring you to physically own the commodity. Gold ETFs are the most popular example.' }
  ],
  'Market Sentiment Indicators': [
    { text: 'What is "Market Sentiment"?', type: 'mcq', options: ['The total trading volume of a market', 'The overall attitude of investors toward a particular market or asset', 'The average P/E ratio of all listed stocks', 'The daily change in interest rates'], correctIndex: 1, explanation: 'Market sentiment reflects whether investors collectively feel bullish (optimistic) or bearish (pessimistic) about the market. Extreme sentiment readings often signal contrarian opportunities.' },
    { text: 'What does the VIX (Volatility Index) measure?', type: 'mcq', options: ['The daily volume of the S&P 500', 'The market\'s expectation of near-term volatility derived from S&P 500 options prices', 'The annual return of the Dow Jones Industrial Average', 'The number of stocks hitting 52-week highs'], correctIndex: 1, explanation: 'The VIX is often called the "Fear Gauge". A high VIX (above 30) signals panic and high uncertainty; a low VIX (below 15) signals complacency. Extreme fear often precedes market bottoms.' },
    { text: 'What does the "Put/Call Ratio" indicate?', type: 'mcq', options: ['The ratio of profitable trades to losing trades', 'The ratio of put options to call options traded—a high ratio suggests bearish sentiment', 'The leverage ratio used by options traders', 'The ratio of institutional to retail options buyers'], correctIndex: 1, explanation: 'Put/Call Ratio = Put Volume ÷ Call Volume. A ratio above 1.0 means more puts (bearish bets) than calls are being bought—indicating fear. Extremely high readings are contrarian buy signals.' },
    { text: 'What does the "Advance/Decline Line" measure?', type: 'mcq', options: ['The trend of a single leading indicator stock', 'A running total of the number of advancing stocks minus declining stocks', 'Daily stock price changes converted to a percentage', 'The number of stocks hitting 52-week highs vs. lows'], correctIndex: 1, explanation: 'The A/D Line adds the net count of advancing minus declining stocks each day. If the market index rises but the A/D line falls, it signals the rally is narrow and potentially weakening.' },
    { text: 'What is the "CNN Fear & Greed Index" designed to measure?', type: 'mcq', options: ['CNN\'s stock market forecast for the week', 'The prevailing investor emotion driving the market at any given time, from Extreme Fear to Extreme Greed', 'Corporate earnings sentiment from major companies', 'Government budget sentiment affecting stock markets'], correctIndex: 1, explanation: 'The CNN Fear & Greed Index aggregates 7 market indicators (VIX, momentum, safe-haven demand, etc.) into a 0-100 sentiment score. Readings near 0 (Extreme Fear) are historically good buying opportunities.' },
    { text: 'What does a very low number of IPOs in a market indicate about sentiment?', type: 'mcq', options: ['Extreme bullish greed—companies rushing to market', 'Bearish or cautious sentiment—companies postpone listings when demand from investors is weak', 'A thriving economy with abundant job creation', 'Regulators are restricting new listings'], correctIndex: 1, explanation: 'IPO activity is a leading sentiment indicator. A dry IPO market means institutional investors are not willing to pay premium prices for new companies—a sign of cautious or bearish sentiment.' },
    { text: 'What is "Short Interest" as a market sentiment indicator?', type: 'mcq', options: ['The total value of interest earned on bond portfolios', 'The percentage of a company\'s shares that have been sold short by traders betting on a price decline', 'The interest rate charged on margin loans', 'The premium paid for put options'], correctIndex: 1, explanation: 'High short interest means many traders are betting the stock will fall. This can become a contrarian bullish indicator—if good news forces short sellers to buy back shares, a "short squeeze" can erupt.' },
    { text: 'What is the "Smart Money" vs "Dumb Money" concept in sentiment analysis?', type: 'mcq', options: ['A classification of investors by net worth', 'The idea that institutional investors (smart money) often act early and correctly, while retail investors (dumb money) react late', 'An SEC regulation on investor sophistication levels', 'A strategy of always copying the largest institutional trade'], correctIndex: 1, explanation: 'Smart money (hedge funds, institutions) tends to position ahead of major moves. Dumb money (retail investors) often buys at peaks and sells at bottoms. Tracking the divergence between the two is a powerful contrarian tool.' }
  ],
  'Algorithmic Trading Basics': [
    { text: 'What is algorithmic trading?', type: 'mcq', options: ['Trading stocks based on mathematical textbook problems', 'Using computer programs to execute trades automatically based on pre-defined rules, signals, or models', 'A type of trading restricted to mathematics professors', 'Manually placing trades based on chart patterns'], correctIndex: 1, explanation: 'Algorithmic trading uses computers to execute orders at speeds and frequencies impossible for human traders. Algorithms define the conditions (price, time, volume, indicators) that trigger a buy or sell.' },
    { text: 'What is "backtesting" in algorithmic trading?', type: 'mcq', options: ['Testing a broker\'s order matching system', 'Running a trading algorithm against historical data to evaluate how it would have performed in the past', 'Placing trades in reverse order', 'Testing algorithms on a paper trading account in real-time'], correctIndex: 1, explanation: 'Backtesting simulates a strategy on historical price data to assess profitability, drawdown, and risk-adjusted returns before risking real capital.' },
    { text: 'What is "slippage" in the context of algorithmic trading?', type: 'mcq', options: ['A bug in the algorithm code', 'The difference between the expected execution price and the actual price at which the trade is filled', 'A regulatory fine for excessive trading', 'The latency introduced by internet connectivity issues'], correctIndex: 1, explanation: 'Slippage occurs because markets move between the time an order is placed and when it is filled. Large orders or fast markets increase slippage—a critical cost that can make a profitable strategy unprofitable.' },
    { text: 'What is "High-Frequency Trading" (HFT)?', type: 'mcq', options: ['Placing more than 10 trades per day', 'Trading at extremely high speeds (milliseconds or microseconds) using algorithms to exploit tiny price discrepancies', 'A trading strategy focused on high-dividend stocks', 'Holding positions for very short periods of 1-2 days'], correctIndex: 1, explanation: 'HFT firms use co-located servers and ultra-low latency connections to execute thousands of orders per second, profiting from tiny bid-ask spreads and temporary price imbalances.' },
    { text: 'What is "overfitting" a trading algorithm?', type: 'mcq', options: ['Adding too much leverage to a strategy', 'Tuning a strategy too precisely to historical data so it performs brilliantly in the past but fails on new (live) data', 'Optimising an algorithm for speed rather than accuracy', 'Running the same algorithm on too many markets simultaneously'], correctIndex: 1, explanation: 'Overfitting is the most common pitfall in algo development. An overfitted strategy has been curve-fitted to past noise—it has memorised the past data rather than discovering a genuine edge.' },
    { text: 'What is a "mean reversion" strategy?', type: 'mcq', options: ['A strategy that follows strong trending markets', 'A strategy that bets prices will revert back toward their historical average after a large deviation', 'A strategy that calculates average returns across different asset classes', 'A strategy used exclusively in bond markets'], correctIndex: 1, explanation: 'Mean reversion assumes that extreme price deviations from an average are temporary. The algorithm buys when price falls sharply below its average and sells when it rises sharply above.' },
    { text: 'Why is "paper trading" an important step before deploying an algorithm with real money?', type: 'mcq', options: ['Regulators require 6 months of paper trading before live trading', 'It allows the algorithm to be tested in live market conditions without risking real capital', 'Paper trading guarantees the algorithm will profit in live markets', 'It helps the programmer find coding errors that backtesting missed'], correctIndex: 1, explanation: 'Paper trading (simulated live trading) exposes real-world issues like slippage, liquidity, and data latency that backtesting cannot capture—preventing expensive surprises when deploying real capital.' },
    { text: 'What is "execution latency" and why does it matter for algo traders?', type: 'mcq', options: ['The speed at which a broker processes client onboarding', 'The time delay between an algorithm generating a signal and the order being executed in the market', 'The delay in receiving end-of-day data feeds', 'The processing time for regulatory compliance checks'], correctIndex: 1, explanation: 'In fast markets, even milliseconds of latency can mean a worse fill price or a missed opportunity. For HFT firms, latency is existential—they invest heavily in co-location and dedicated network lines.' }
  ],
  'Macroeconomics for Investors': [
    { text: 'What does GDP (Gross Domestic Product) measure?', type: 'mcq', options: ['The total government debt of a country', 'The total monetary value of all goods and services produced within a country in a period', 'The total stock market capitalisation of a country', 'The income generated by a country\'s exports only'], correctIndex: 1, explanation: 'GDP measures the total economic output of a nation. Rising GDP signals a growing economy (generally bullish for stocks); falling GDP for two consecutive quarters is the technical definition of a recession.' },
    { text: 'How do rising interest rates generally affect stock markets?', type: 'mcq', options: ['They always cause stock markets to rise', 'They tend to put downward pressure on stock valuations as borrowing becomes more expensive and bonds become more competitive', 'They have no effect on stock prices', 'They cause only small-cap stocks to decline'], correctIndex: 1, explanation: 'Higher rates increase the discount rate used in valuation models, reducing the present value of future cash flows. They also make bonds more attractive relative to stocks, pulling capital away from equities.' },
    { text: 'What is inflation and how does it typically impact investors?', type: 'mcq', options: ['A decrease in the general price level, always beneficial to investors', 'The rate at which prices of goods and services rise, eroding purchasing power and impacting corporate margins', 'A government policy that increases stock market returns', 'The increase in money supply without impact on prices'], correctIndex: 1, explanation: 'Moderate inflation (2-3%) is normal. High inflation erodes real returns, hurts bond prices, compresses consumer spending, and pressures corporate margins—ultimately negative for most asset classes.' },
    { text: 'What is the role of a Central Bank (like RBI or the US Fed) in an economy?', type: 'mcq', options: ['To directly invest in the stock market to prevent crashes', 'To manage monetary policy—controlling interest rates and money supply to achieve price stability and employment goals', 'To regulate and tax corporate profits', 'To issue government bonds on behalf of the treasury'], correctIndex: 1, explanation: 'Central banks use tools like interest rate changes, open market operations, and quantitative easing/tightening to control inflation, support employment, and maintain financial system stability.' },
    { text: 'What happens to bond prices when interest rates rise?', type: 'mcq', options: ['Bond prices rise in parallel with interest rates', 'Bond prices fall when interest rates rise', 'Bond prices are unaffected by interest rate changes', 'Bond prices double when rates rise above 5%'], correctIndex: 1, explanation: 'Bonds have an inverse relationship with interest rates. When new bonds offer higher yields, existing lower-yielding bonds become less valuable and their prices fall to equilibrate the yield.' },
    { text: 'What is the "Yield Curve" and what does an inversion signal?', type: 'mcq', options: ['A chart showing a company\'s profit margins over time', 'A graph showing interest rates across different bond maturities; inversion (short > long rates) often precedes a recession', 'A technical chart pattern used in stock trading', 'The return generated by dividend-paying stocks'], correctIndex: 1, explanation: 'Normally, longer-maturity bonds have higher yields. An inverted yield curve (short-term rates exceed long-term rates) means the market expects economic slowdown—historically one of the most reliable recession predictors.' },
    { text: 'What is a "leading economic indicator"?', type: 'mcq', options: ['An indicator that confirms what already happened in the economy', 'Data that tends to change before the overall economy changes, helping forecast future economic direction', 'A country\'s most important economic statistic', 'GDP data reported after a quarter ends'], correctIndex: 1, explanation: 'Leading indicators (like PMI, building permits, consumer confidence, yield curve) predict economic direction. Lagging indicators (like unemployment, CPI) confirm trends that have already begun.' },
    { text: 'What is "Quantitative Easing" (QE)?', type: 'mcq', options: ['A strategy for pricing government bonds at auction', 'A central bank policy of buying large quantities of assets (bonds, securities) to inject liquidity and stimulate the economy', 'A method of reducing the money supply to fight inflation', 'A regulation requiring banks to hold more reserves'], correctIndex: 1, explanation: 'QE involves the central bank creating new money to purchase financial assets. This injects liquidity into the banking system, lowers interest rates, and encourages lending and investment—stimulating the economy.' }
  ],
  'Short Selling': [
    { text: 'What is "short selling" (shorting) a stock?', type: 'mcq', options: ['Selling stocks you\'ve owned for less than 12 months', 'Borrowing shares and selling them, with the intention of buying them back cheaper later to return to the lender', 'Selling a stock immediately after buying it for a small profit', 'Placing a sell order below the current market price'], correctIndex: 1, explanation: 'Short selling is a bet that a stock\'s price will fall. You borrow shares from a broker, sell them, wait for the price to drop, buy them back cheaper, return them to the broker, and pocket the difference.' },
    { text: 'What is the maximum profit of a short position?', type: 'mcq', options: ['Unlimited profit, same as buying shares', 'The full value of the initial sale (i.e., the stock price reaches zero)', 'Exactly double the amount invested', 'Capped at the broker\'s lending fee'], correctIndex: 1, explanation: 'The maximum profit on a short is limited: the stock can only fall to zero. If you short a ₹100 stock, the most you can make per share is ₹100 (if it goes to zero).' },
    { text: 'What is a "short squeeze"?', type: 'mcq', options: ['A broker closing a short position due to margin requirements', 'When a heavily shorted stock rises sharply, forcing short sellers to buy back shares at higher prices, causing the price to rise even faster', 'A regulatory limit on the number of short positions allowed', 'Squeezing a profit from a short position before expiry'], correctIndex: 1, explanation: 'Short squeezes can cause dramatic price spikes. As the price rises, short sellers face mounting losses and must buy to close positions—their buying adds further upward momentum. GameStop in 2021 is a famous example.' },
    { text: 'What is the maximum possible loss when short selling a stock?', type: 'mcq', options: ['The amount initially borrowed from the broker', 'Theoretically unlimited, since a stock price can rise infinitely', 'Capped at twice the initial margin deposit', 'Equal to the premium paid for a put option'], correctIndex: 1, explanation: 'This is the defining risk of short selling. Unlike buying (where you can only lose what you invested), a stock can rise infinitely—meaning short losses are theoretically unlimited.' },
    { text: 'What is a "margin call" in the context of a short position?', type: 'mcq', options: ['A phone call from a broker to open a new short position', 'A demand from the broker to deposit more funds because your short position\'s losses have reduced your margin below the required level', 'A request to pay the stock lending fee', 'An instruction to cover your short position immediately because the company is being acquired'], correctIndex: 1, explanation: 'If a stock you\'ve shorted rises, your unrealised losses consume your margin. When the loss exceeds the maintenance margin threshold, the broker issues a margin call requiring you to deposit more cash or face forced liquidation.' },
    { text: 'What does it mean for a stock to have "high short interest"?', type: 'mcq', options: ['The stock pays high interest like a bond', 'A large percentage of the company\'s available shares have been sold short by traders betting on a price decline', 'The broker charges a high fee to lend the stock', 'The company has high interest expense on its debt'], correctIndex: 1, explanation: 'Short interest is expressed as a percentage of the float. High short interest (>20%) means many investors are bearish. It can signal expected bad news, but also increases short squeeze risk.' },
    { text: 'What is "stock borrow" cost and why does it matter for short sellers?', type: 'mcq', options: ['The original price paid for the shares by the current owner', 'The daily fee paid to borrow shares for shorting; high borrow costs erode profits on short positions', 'The commission charged by the broker for each short sale', 'The tax rate applied to short-term capital gains'], correctIndex: 1, explanation: 'To short, you must borrow shares from someone who owns them—and pay a daily borrow fee. For in-demand, heavily-shorted stocks, this fee can be 50-100%+ annualised, significantly increasing the cost of holding a short.' },
    { text: 'What regulatory concept requires short sellers to locate available shares before short selling?', type: 'mcq', options: ['Short sale restriction rule (SSR)', 'Locate requirement—brokers must confirm shares are available to borrow before approving a short sale', 'Regulation T margin requirements', 'The Uptick Rule allowing shorting only on price increases'], correctIndex: 1, explanation: 'The locate requirement (part of SEC Regulation SHO in the US) prevents naked short selling. Brokers must confirm shares are available to borrow before executing a short sale.' }
  ],
  'Cryptocurrency Basics': [
    { text: 'What is a blockchain?', type: 'mcq', options: ['A type of digital wallet app', 'A distributed, immutable ledger of transactions shared across a peer-to-peer network', 'A centralised database owned by a cryptocurrency exchange', 'A government registry of digital asset owners'], correctIndex: 1, explanation: 'A blockchain is a chain of records (blocks) linked together cryptographically and stored across thousands of computers simultaneously—making it very difficult to alter any historical record.' },
    { text: 'What is Bitcoin primarily designed to be?', type: 'mcq', options: ['A smart contract platform for decentralized applications', 'A decentralized digital currency for peer-to-peer value transfer without intermediaries', 'A government-backed digital token', 'A platform for issuing new altcoins'], correctIndex: 1, explanation: 'Bitcoin was created by Satoshi Nakamoto in 2009 as a peer-to-peer electronic cash system. Its primary design goal is to enable borderless, permissionless, trustless transfer of value.' },
    { text: 'What is "mining" in the context of Bitcoin?', type: 'mcq', options: ['Extracting precious metals to back Bitcoin\'s value', 'The process by which computers solve complex mathematical puzzles to validate transactions and earn newly issued Bitcoin as a reward', 'Creating new cryptocurrency exchanges', 'The process of converting fiat currency into Bitcoin'], correctIndex: 1, explanation: 'Mining uses "Proof of Work"—miners compete to solve computationally expensive puzzles. The winner validates the next block and earns the block reward (currently 3.125 BTC after the April 2024 halving).' },
    { text: 'What is a "crypto wallet"?', type: 'mcq', options: ['A physical device for storing paper cash', 'Software or hardware that stores the cryptographic keys allowing you to access and transact your cryptocurrency', 'An account at a centralised cryptocurrency exchange', 'A tool for converting one cryptocurrency to another'], correctIndex: 1, explanation: 'A crypto wallet doesn\'t store coins—it stores the private keys that prove ownership. Whoever controls the private key controls the funds. "Not your keys, not your coins."' },
    { text: 'What is a "stablecoin"?', type: 'mcq', options: ['A cryptocurrency with the most stable price track record', 'A cryptocurrency designed to maintain a fixed value relative to a reference asset (usually the US dollar)', 'A government-issued central bank digital currency (CBDC)', 'Bitcoin after its price has been stable for 30 days'], correctIndex: 1, explanation: 'Stablecoins (like USDT, USDC, DAI) are pegged to a fiat currency or collateral. They provide price stability for DeFi transactions and are widely used for trading pairs on exchanges.' },
    { text: 'What is "DeFi" (Decentralized Finance)?', type: 'mcq', options: ['A type of cryptocurrency exchange regulated by the government', 'Financial services (lending, borrowing, trading) built on blockchain smart contracts without traditional intermediaries', 'A financial planning service for cryptocurrency investors', 'A centralised financial platform that uses blockchain for settlement'], correctIndex: 1, explanation: 'DeFi recreates traditional financial services (banks, exchanges, insurance) using blockchain smart contracts—accessible to anyone with a crypto wallet and internet, removing the need for banks or brokers.' },
    { text: 'What is the "Halving" event in Bitcoin?', type: 'mcq', options: ['When Bitcoin\'s price drops by 50%', 'A pre-programmed event approximately every 4 years that cuts the block reward for miners in half, reducing Bitcoin\'s issuance rate', 'When 50% of all Bitcoin has been spent', 'A vote by the Bitcoin community to split the network'], correctIndex: 1, explanation: 'Bitcoin\'s halving reduces the supply of new BTC entering circulation by 50%. Historically, halvings have been followed by significant bull markets as the supply shock meets consistent demand.' },
    { text: 'Why is cryptocurrency considered highly volatile compared to traditional assets?', type: 'mcq', options: ['Because cryptocurrency exchanges close at 5pm', 'Because the market is relatively small and liquid, driven heavily by speculation, retail sentiment, and regulatory news', 'Because all cryptocurrencies are backed by unstable commodities', 'Because governments force daily price resets'], correctIndex: 1, explanation: 'Crypto markets are 24/7, have relatively small total market capitalisation compared to traditional markets, and are driven by sentiment, narrative, and speculation—resulting in extreme volatility.' }
  ],
  'Real Estate Investment Trusts (REITs)': [
    { text: 'What is a REIT (Real Estate Investment Trust)?', type: 'mcq', options: ['A personal investment in a rental property', 'A company that owns, operates, or finances income-producing real estate and trades on a stock exchange', 'A government scheme for affordable housing', 'A mutual fund that invests in home mortgage loans only'], correctIndex: 1, explanation: 'REITs allow individual investors to earn dividends from real estate investments without buying or managing properties directly. Most trade on major exchanges just like stocks.' },
    { text: 'What is the minimum distribution REITs are legally required to pay shareholders (in the US)?', type: 'mcq', options: ['25% of taxable income', '50% of taxable income', '90% of taxable income', '100% of taxable income'], correctIndex: 2, explanation: 'US REITs must distribute at least 90% of their taxable income to shareholders as dividends. This is why REITs typically offer high dividend yields, making them popular income investments.' },
    { text: 'What is a "Retail REIT"?', type: 'mcq', options: ['A REIT that sells retail investment products', 'A REIT that owns and manages shopping malls, strip centres, and retail properties', 'A small REIT with fewer than 10 properties', 'A REIT that focuses on residential apartment buildings'], correctIndex: 1, explanation: 'Retail REITs own commercial spaces leased to retailers—malls, outlets, and neighbourhood shopping centres. Their performance closely tracks consumer spending trends and e-commerce competition.' },
    { text: 'What metric do REIT investors use instead of P/E ratio to assess valuation?', type: 'mcq', options: ['Dividend Yield only', 'Price-to-FFO (Funds From Operations)', 'Price-to-Book (P/B) Ratio', 'Enterprise Value to EBITDA (EV/EBITDA)'], correctIndex: 1, explanation: 'FFO = Net Income + Depreciation − Property Sale Gains. Because real estate depreciation distorts GAAP earnings, FFO gives a truer picture of a REIT\'s operational cash-generating ability.' },
    { text: 'What is a key risk of investing in REITs?', type: 'mcq', options: ['REITs are required to have zero debt', 'REITs are highly sensitive to interest rate changes, as higher rates increase borrowing costs and make their dividends less attractive vs. bonds', 'REITs are illiquid and cannot be sold for 5 years', 'REITs are exempt from property market downturns'], correctIndex: 1, explanation: 'REITs use significant debt financing and are valued largely on their yield. Rising interest rates increase their cost of capital, reduce property valuations, and make REIT dividends relatively less attractive vs. safer bonds.' },
    { text: 'What distinguishes an "Equity REIT" from a "Mortgage REIT"?', type: 'mcq', options: ['Equity REITs are listed on exchanges; Mortgage REITs are private', 'Equity REITs own physical properties; Mortgage REITs invest in mortgages and mortgage-backed securities', 'Equity REITs own residential properties; Mortgage REITs own commercial properties', 'They are different names for the same type of REIT'], correctIndex: 1, explanation: 'Equity REITs earn income from rent on properties they own and operate. Mortgage REITs earn interest income from loans secured by real estate. Mortgage REITs carry more credit and interest rate risk.' },
    { text: 'How does a REIT typically grow its dividend over time?', type: 'mcq', options: ['By reducing distribution payout ratios', 'By raising rents on existing properties, acquiring new properties, and developing new projects that increase FFO', 'By selling properties at a profit and distributing the gains', 'By issuing more shares to generate additional capital'], correctIndex: 1, explanation: 'REIT dividend growth comes from: (1) rent escalation clauses in leases, (2) strategic acquisitions at attractive cap rates, and (3) property development. FFO per share growth drives dividend growth.' },
    { text: 'What is the "Cap Rate" (Capitalisation Rate) used for in real estate investing?', type: 'mcq', options: ['The maximum interest rate a REIT can charge on mortgages', 'Net Operating Income divided by property value—used to estimate a property\'s return potential', 'The maximum leverage a REIT is allowed to use', 'The rate at which property values appreciate annually'], correctIndex: 1, explanation: 'Cap Rate = NOI ÷ Property Value. A 7% cap rate property means it generates 7% of its value in annual net operating income. Lower cap rates (like 4%) indicate premium markets or higher-risk assets.' }
  ],
  'Advanced Options Strategies': [
    { text: 'What is a "Covered Call" strategy?', type: 'mcq', options: ['Buying a call option on a stock you already own', 'Selling a call option on a stock you already own to generate premium income, with the obligation to sell shares if exercised', 'Covering your losses by buying another option', 'A call option purchased with borrowed money'], correctIndex: 1, explanation: 'A covered call involves selling a call option against your existing stock position. You collect the premium upfront, but cap your upside. It\'s an income strategy suited for neutral-to-slightly-bullish outlooks.' },
    { text: 'What is a "Protective Put" strategy?', type: 'mcq', options: ['Selling puts on a stock to generate income', 'Buying a put option on a stock you own to protect against downside loss—like portfolio insurance', 'Protecting a short position with a call option', 'A strategy of holding only defensive sector stocks'], correctIndex: 1, explanation: 'A protective put (or "married put") is bought on a stock you own. If the stock crashes, the put option gains value—offsetting losses. The cost is the put premium, similar to paying an insurance premium.' },
    { text: 'What is a "Bull Call Spread"?', type: 'mcq', options: ['Buying one call option with a low strike and selling one with a higher strike on the same expiry', 'Buying two call options at different strikes for maximum upside', 'Selling call options during a bull market', 'A spread strategy using only put options in a bull market'], correctIndex: 0, explanation: 'A Bull Call Spread reduces the net cost of buying a call by simultaneously selling a higher-strike call. It profits if the stock rises to the short call\'s strike, capping both your risk and your maximum reward.' },
    { text: 'What is "Theta" (Time Decay) in options?', type: 'mcq', options: ['The sensitivity of an option\'s price to a 1% change in implied volatility', 'The rate at which an option loses value as it approaches expiration—all else equal', 'The change in an option\'s price relative to the underlying stock\'s movement', 'The interest rate sensitivity of an option\'s price'], correctIndex: 1, explanation: 'Theta measures the daily erosion of an option\'s time value. Option sellers benefit from Theta (time decay works in their favour); buyers must overcome Theta by having the stock move in their direction fast enough.' },
    { text: 'What is "Implied Volatility" (IV) in options pricing?', type: 'mcq', options: ['The historical volatility of the stock over the past year', 'The market\'s consensus expectation of how much the underlying stock will move in the future, derived from current option prices', 'The volatility of the options market itself', 'The standard deviation of the option\'s premium over 30 days'], correctIndex: 1, explanation: 'IV is forward-looking—it is extracted from current option prices using models like Black-Scholes. High IV means options are expensive (the market expects large moves); low IV means options are cheap.' },
    { text: 'What is an "Iron Condor" options strategy?', type: 'mcq', options: ['Buying calls and puts on the same stock simultaneously', 'Selling an out-of-the-money call spread and an out-of-the-money put spread simultaneously to profit from low volatility', 'A strategy that profits only when a stock moves dramatically in one direction', 'An aggressive bullish strategy using deep in-the-money calls'], correctIndex: 1, explanation: 'An Iron Condor collects premium from four options—selling an OTM call, buying a further OTM call, selling an OTM put, and buying a further OTM put. It profits if the stock stays within a defined price range until expiry.' },
    { text: 'What does "Delta" measure in options?', type: 'mcq', options: ['The time remaining until expiration', 'How much an option\'s price changes for every ₹1 move in the underlying stock', 'The break-even price of the option strategy', 'The annual interest rate embedded in the option price'], correctIndex: 1, explanation: 'Delta ranges from 0 to 1 for calls (0 to -1 for puts). A call with Delta of 0.50 gains approximately ₹0.50 for every ₹1 rise in the stock. Delta also approximates the probability the option expires in-the-money.' },
    { text: 'What is the key difference between American-style and European-style options?', type: 'mcq', options: ['American options are only available to US citizens; European options to European residents', 'American-style options can be exercised any time before expiry; European-style options can only be exercised at expiry', 'American options have weekly expiries; European options have monthly expiries', 'American options use dollars; European options use euros'], correctIndex: 1, explanation: 'The exercise flexibility is the critical difference. Most US equity options are American-style (early exercise possible). Index options like SPX are typically European-style (exercise only at expiry).' }
  ]
};

const generateProceduralCourse = (topic, index) => {
  const isValueInvesting = topic.title.toLowerCase().includes('value investing');
  const numLessons = isValueInvesting ? 3 : 6;
  const lessons = [];

  // Get topic-specific quiz bank (falls back to generic if not found)
  const topicQuizBank = TOPIC_QUIZ_BANK[topic.title] || [];

  for (let i = 1; i <= numLessons; i++) {
    // Each module rotates through the quiz bank—odd modules use first half, even modules use second half
    const bankSize = topicQuizBank.length;
    let moduleQuestions;
    if (bankSize >= 10) {
      // Use alternating sets of 5 from the bank
      const offset = ((i - 1) % Math.floor(bankSize / 5)) * 5;
      moduleQuestions = topicQuizBank.slice(offset, offset + 5);
    } else if (bankSize >= 5) {
      moduleQuestions = topicQuizBank.slice(0, 5);
    } else {
      // True fallback: generic risk/discipline questions (correctly indexed)
      moduleQuestions = [
        { text: 'What is the most important factor in executing any investment strategy?', type: 'mcq', options: ['Market timing', 'Consistent discipline and risk management', 'Following social media trends', 'Borrowing money to invest'], correctIndex: 1, explanation: 'Discipline—following your plan regardless of emotional impulses—is the single most important determinant of long-term investment success.' },
        { text: 'Why should investors always weigh risk against potential reward?', type: 'mcq', options: ['Regulations require it', 'Because higher returns require accepting higher risk—understanding this prevents taking on inappropriate risk', 'To minimise brokerage commissions', 'To avoid paying taxes on profits'], correctIndex: 1, explanation: 'Risk and return are fundamentally linked. You cannot achieve above-average returns without above-average risk—understanding the trade-off is essential for building an appropriate portfolio.' },
        { text: 'What is the purpose of using a stop-loss order?', type: 'mcq', options: ['To guarantee a profit', 'To automatically close a losing position at a pre-defined price, limiting potential losses', 'To increase your position size when the trade is profitable', 'To lock in profits at your target price'], correctIndex: 1, explanation: 'A stop-loss is a risk management tool. By pre-defining the maximum acceptable loss before entering a trade, you remove the emotional temptation to hold a losing position hoping for a reversal.' },
        { text: 'What does "position sizing" help a trader control?', type: 'mcq', options: ['The selection of stocks to buy', 'The amount of capital risked on each individual trade to prevent any single loss from being catastrophic', 'The timing of market entry and exit', 'The fees charged by the broker'], correctIndex: 1, explanation: 'Position sizing determines what fraction of your portfolio to allocate to each trade. Proper sizing (e.g., never risking more than 1-2% per trade) allows you to survive losing streaks and continue trading.' },
        { text: 'Why is the macroeconomic environment important for all investors?', type: 'mcq', options: ['It is irrelevant—only individual company fundamentals matter', 'Macro factors (interest rates, inflation, GDP) affect the valuations and profitability of all investments', 'Only bond investors need to monitor macroeconomics', 'Macroeconomic data is published too infrequently to be useful'], correctIndex: 1, explanation: 'No investment exists in isolation. Interest rate changes, inflation, and economic cycles affect asset valuations, corporate earnings, and investor sentiment—making macro awareness essential for all investors.' }
      ];
    }

    lessons.push({
      title: `${topic.title} - Module ${i}`,
      difficulty: topic.level,
      estimatedMinutes: 15,
      content: `
# Introduction
Welcome to Module ${i} of ${topic.title}. In this module, we will explore the core mechanics and theories that drive this aspect of finance. Understanding this will give you a significant edge in the market.

# Main Content
When dealing with ${topic.title.toLowerCase()}, investors must analyze multiple variables. The financial markets are complex ecosystems where supply, demand, psychology, and macroeconomic factors intersect. 

## The Core Concept
The primary mechanism here involves evaluating risk-adjusted returns. Market participants constantly weigh the potential upside against the downside risks. Efficient market theory suggests that all known information is already priced in, but practical application of ${topic.title.toLowerCase()} proves that anomalies and opportunities exist.

## Strategic Implementation
To implement these concepts:
1. **Analyze the Data**: Look at historical performance and current metrics.
2. **Determine Risk Tolerance**: Ensure the strategy aligns with your capital constraints.
3. **Execute with Discipline**: The best strategy fails without psychological discipline.

# Key Takeaways
✓ Always weigh risk against potential reward.
✓ Discipline is more important than intelligence in investing.
✓ ${topic.title} requires continuous learning and adaptation.

# Common Mistakes
- Ignoring the broader macroeconomic environment.
- Letting emotions dictate execution.
- Failing to use proper risk management (like stop losses or position sizing).

# Practical Example
Consider an investor evaluating a new opportunity in ${topic.title.toLowerCase()}. They allocate 5% of their portfolio to test the thesis. Over 6 months, the thesis plays out correctly, yielding a 15% return on that position, while strict stop-losses protected them from a market downturn.

# Mini Exercise
Review your current portfolio. How does the concept of ${topic.title.toLowerCase()} apply to your largest holding? Write down three ways you can optimize it.

# Summary
Module ${i} establishes the foundation. By maintaining discipline and applying these concepts, you can navigate the complexities of the market with greater confidence.
      `,
      quiz: {
        title: `Quiz: ${topic.title} – Module ${i}`,
        passingScore: 60,
        xpReward: 40,
        questions: moduleQuestions
      }
    });
  }

  return {
    title: topic.title,
    level: topic.level,
    description: `A comprehensive course covering the intricacies of ${topic.title.toLowerCase()} to enhance your trading edge.`,
    category: topic.cat,
    tags: [topic.cat.toLowerCase(), 'investing', 'markets'],
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    estimatedHours: isValueInvesting ? 0.75 : 2,
    xpReward: 150,
    order: index + 4, // 1,2,3 are flagship
    lessons
  };
};

const proceduralCourses = TOPICS.map((topic, idx) => generateProceduralCourse(topic, idx));

// Combine all 20 courses
export const ALL_COURSES = [...flagshipCourses, ...proceduralCourses];

// ============================================================================
// 3. GLOSSARY GENERATOR
// ============================================================================

const generateGlossary = () => {
  try {
    const dataPath = path.resolve(__dirname, '../../../data/glossary/glossary.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      return parsed.data || [];
    }
  } catch (err) {
    console.error('[seedLearning] Error reading glossary.json:', err.message);
  }
  return [];
};

// ============================================================================
// 4. MAIN SEED FUNCTION
// ============================================================================

export const autoSeedLearningCenter = async () => {
  try {
    console.log('[Learning] Checking if seeding is needed...');
    const count = await Course.countDocuments();
    if (count > 0) {
      console.log('[Learning] Database already has courses. Skipping seed.');
      return;
    }

    console.log('Learning collection empty.\\n\\nSeeding default courses...');
    
    // Clear collections completely
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Quiz.deleteMany({});
    await GlossaryTerm.deleteMany({});

    console.log(`Seeding ${ALL_COURSES.length} Courses, Lessons, and Quizzes...`);
    
    for (const courseData of ALL_COURSES) {
      const { lessons, ...courseMeta } = courseData;
      
      // 1. Save Course
      const course = new Course({
        ...courseMeta,
        slug: courseMeta.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      });
      await course.save();

      const lessonDocs = [];
      
      // 2. Process Lessons & Quizzes
      for (let i = 0; i < lessons.length; i++) {
        const lData = lessons[i];
        const { quiz, ...lessonInfo } = lData;

        // Save Lesson
        const lesson = new Lesson({
          ...lessonInfo,
          courseId: course._id,
          order: i + 1,
          slug: lessonInfo.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        });
        await lesson.save();
        lessonDocs.push(lesson._id);

        // Save associated Quiz for this lesson
        if (quiz) {
          const newQuiz = new Quiz({
            ...quiz,
            courseId: course._id,
            lessonId: lesson._id
          });
          await newQuiz.save();
        }
      }

      // Update Course with Lesson references
      course.lessons = lessonDocs;
      await course.save();
    }

    console.log('Seeding Glossary...');
    const glossary = generateGlossary();
    await GlossaryTerm.insertMany(glossary);

    console.log('\\n20 courses inserted successfully.');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

// If run directly via CLI
if (process.argv[1] === new URL(import.meta.url).pathname) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_dashboard')
    .then(async () => {
      await Course.deleteMany({}); // Force run logic
      await autoSeedLearningCenter();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
