export default class BaseProvider {
  /**
   * Get live quote for a specific stock symbol.
   * @param {string} symbol 
   */
  async getQuote(symbol) {
    throw new Error('Method "getQuote(symbol)" must be implemented.');
  }

  /**
   * Get historical market prices for charting.
   * @param {string} symbol 
   * @param {string} range (e.g. 1D, 1W, 1M, 1Y, etc.)
   */
  async getHistoricalData(symbol, range) {
    throw new Error('Method "getHistoricalData(symbol, range)" must be implemented.');
  }

  /**
   * Get fundamental company profile info.
   * @param {string} symbol 
   */
  async getCompanyProfile(symbol) {
    throw new Error('Method "getCompanyProfile(symbol)" must be implemented.');
  }

  /**
   * Get top gaining stocks.
   */
  async getTopGainers() {
    throw new Error('Method "getTopGainers()" must be implemented.');
  }

  /**
   * Get top losing stocks.
   */
  async getTopLosers() {
    throw new Error('Method "getTopLosers()" must be implemented.');
  }

  /**
   * Get most active stocks by volume.
   */
  async getMostActive() {
    throw new Error('Method "getMostActive()" must be implemented.');
  }

  /**
   * Autocomplete search for symbols/names.
   * @param {string} query 
   */
  async searchStocks(query) {
    throw new Error('Method "searchStocks(query)" must be implemented.');
  }
}
