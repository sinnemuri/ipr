const assert = require('node:assert/strict');
const { test } = require('node:test');

process.env.DATABASE_URL ||= 'postgres://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret';
process.env.NODE_ENV = 'production';
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat-id';

const loggerPath = require.resolve('../utils/logger');
const loggedErrors = [];
require.cache[loggerPath] = {
  id: loggerPath,
  filename: loggerPath,
  loaded: true,
  exports: {
    logger: {
      error(...args) {
        loggedErrors.push(args);
      },
    },
  },
};

const { errorHandler } = require('./errorHandler');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('notifies Telegram once for a server error without including error details or query values', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    const req = {
      method: 'GET',
      path: '/api/test',
      originalUrl: '/api/test?token=must-not-be-sent',
    };
    const firstResponse = createResponse();
    errorHandler(new Error('sensitive error details'), req, firstResponse, () => {});

    await new Promise(setImmediate);

    assert.equal(firstResponse.statusCode, 500);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /\/sendMessage$/);
    assert.equal(loggedErrors[0][1].message, undefined);
    assert.equal(loggedErrors[0][1].stack, undefined);

    const message = JSON.parse(requests[0].options.body).text;
    assert.match(message, /HTTP: 500/);
    assert.match(message, /GET \/api\/test/);
    assert.doesNotMatch(message, /sensitive error details|must-not-be-sent/);

    errorHandler(new Error('another error'), req, createResponse(), () => {});
    await new Promise(setImmediate);
    assert.equal(requests.length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('does not send critical Telegram alerts for client errors', async () => {
  const originalFetch = global.fetch;
  let requestCount = 0;
  global.fetch = async () => {
    requestCount += 1;
    return { ok: true, status: 200 };
  };

  try {
    const req = { method: 'GET', path: '/api/test', originalUrl: '/api/test' };
    const response = createResponse();
    errorHandler(Object.assign(new Error('Invalid request'), { status: 400 }), req, response, () => {});

    await new Promise(setImmediate);

    assert.equal(response.statusCode, 400);
    assert.equal(requestCount, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
