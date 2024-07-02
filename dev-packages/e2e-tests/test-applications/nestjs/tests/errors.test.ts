import { expect, test } from '@playwright/test';
import { waitForError, waitForTransaction } from '@sentry-internal/test-utils';

test('Sends exception to Sentry', async ({ baseURL }) => {
  const errorEventPromise = waitForError('nestjs', event => {
    return !event.type && event.exception?.values?.[0]?.value === 'This is an exception with id 123';
  });

  const response = await fetch(`${baseURL}/test-exception/123`);
  expect(response.status).toBe(500);

  const errorEvent = await errorEventPromise;

  expect(errorEvent.exception?.values).toHaveLength(1);
  expect(errorEvent.exception?.values?.[0]?.value).toBe('This is an exception with id 123');

  expect(errorEvent.request).toEqual({
    method: 'GET',
    cookies: {},
    headers: expect.any(Object),
    url: 'http://localhost:3030/test-exception/123',
  });

  expect(errorEvent.transaction).toEqual('GET /test-exception/:id');

  expect(errorEvent.contexts?.trace).toEqual({
    trace_id: expect.any(String),
    span_id: expect.any(String),
  });
});

test('Does not send expected exception to Sentry', async ({ baseURL }) => {
  let errorEventOccurred = false;

  waitForError('nestjs', event => {
    if (!event.type && event.exception?.values?.[0]?.value === 'This is an expected exception with id 123') {
      errorEventOccurred = true;
    }

    return event?.transaction === 'GET /test-expected-exception/:id';
  });

  const transactionEventPromise = waitForTransaction('nestjs', transactionEvent => {
    return transactionEvent?.transaction === 'GET /test-expected-exception/:id';
  });

  const response = await fetch(`${baseURL}/test-expected-exception/123`);
  expect(response.status).toBe(403);

  await transactionEventPromise;

  await new Promise(resolve => setTimeout(resolve, 10000));

  expect(errorEventOccurred).toBe(false);
});
