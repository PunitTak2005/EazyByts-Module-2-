import axios from 'axios';
import express from 'express';

describe('Axios Retry Mechanism', () => {
  let server;
  let port;
  let requestCount = 0;
  let failCount = 0;

  beforeAll((done) => {
    const app = express();
    app.get('/test-retry', (req, res) => {
      requestCount++;
      if (requestCount <= failCount) {
        return res.status(503).json({ error: 'Service Unavailable' });
      }
      return res.json({ success: true, data: 'success_data' });
    });

    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    requestCount = 0;
  });

  test('Should successfully retry failed 5xx requests and complete on success', async () => {
    failCount = 2; // First two requests will fail with 503, the third succeeds

    const client = axios.create({
      baseURL: `http://localhost:${port}`
    });

    client.defaults.retry = 3;
    client.defaults.retryDelay = 20; // 20ms base delay for test speed

    client.interceptors.response.use(
      response => response.data,
      async (error) => {
        const { config } = error;
        if (!config || !config.retry) return Promise.reject(error);

        config.retryCount = config.retryCount || 0;
        if (config.retryCount >= config.retry) {
          return Promise.reject(error);
        }

        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500 && error.response.status <= 599;

        if (!isNetworkError && !isServerError) {
          return Promise.reject(error);
        }

        config.retryCount += 1;
        const delay = config.retryDelay * Math.pow(2, config.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return client(config);
      }
    );

    const res = await client.get('/test-retry');
    expect(res.success).toBe(true);
    expect(res.data).toBe('success_data');
    expect(requestCount).toBe(3); // 1 initial request + 2 retries
  });

  test('Should bubble up error if max retries exceeded', async () => {
    failCount = 5; // Will fail 5 times, but max attempts is 4 (1 initial + 3 retries)

    const client = axios.create({
      baseURL: `http://localhost:${port}`
    });

    client.defaults.retry = 3;
    client.defaults.retryDelay = 10;

    client.interceptors.response.use(
      response => response.data,
      async (error) => {
        const { config } = error;
        if (!config || !config.retry) return Promise.reject(error);

        config.retryCount = config.retryCount || 0;
        if (config.retryCount >= config.retry) {
          return Promise.reject(error);
        }

        config.retryCount += 1;
        await new Promise(resolve => setTimeout(resolve, 10));
        return client(config);
      }
    );

    await expect(client.get('/test-retry')).rejects.toThrow();
    expect(requestCount).toBe(4); // 1 initial + 3 retries
  });
});
