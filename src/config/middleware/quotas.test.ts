import { getMockReq, getMockRes } from '@jest-mock/express';
import { NextFunction, Request, Response } from 'express';

import { ApiUser } from '../../globals';

type QuotaTestRequest = Request & {
  quotaReserved?: boolean;
  user?: ApiUser;
};

const toQuotaRequest = (
  request: ReturnType<typeof getMockReq>,
): QuotaTestRequest => request as unknown as QuotaTestRequest;

const toResponse = (response: unknown): Response => response as Response;
const toNext = (next: unknown): NextFunction => next as NextFunction;

const mockReserveExecuteTakeFirst = jest.fn();
const mockRefundExecuteTakeFirstOrThrow = jest.fn();
const mockReturning = jest.fn(() => ({
  executeTakeFirst: mockReserveExecuteTakeFirst,
  executeTakeFirstOrThrow: mockRefundExecuteTakeFirstOrThrow,
}));
const mockSecondWhere = jest.fn(() => ({ returning: mockReturning }));
const mockFirstWhere = jest.fn(() => ({
  where: mockSecondWhere,
  returning: mockReturning,
}));
const mockSet = jest.fn(() => ({ where: mockFirstWhere }));
const mockUpdateTable = jest.fn(() => ({ set: mockSet }));

jest.mock('../database', () => ({
  authDb: {
    updateTable: mockUpdateTable,
  },
}));

import { ignoredPaths, checkCallQuotas, updateQuotas } from './quotas';

beforeEach(() => {
  jest.clearAllMocks();
  mockReserveExecuteTakeFirst.mockResolvedValue({ remainingCalls: 999 });
  mockRefundExecuteTakeFirstOrThrow.mockResolvedValue({ remainingCalls: 1000 });
});

describe('check quotas tests', () => {
  test('calls next if no user', async () => {
    const req = getMockReq({ user: null });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(next).toHaveBeenCalled();
    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  test('calls next if user is admin', async () => {
    const req = getMockReq({
      user: { isAdmin: true, remainingCalls: 0 },
    });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(next).toHaveBeenCalled();
    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  test.each(ignoredPaths)('calls next if path is %s', async (path) => {
    const req = getMockReq({ user: { remainingCalls: 0 }, path });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(next).toHaveBeenCalled();
    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  test('reserves a call if user has calls remaining', async () => {
    const req = getMockReq({
      user: { id: 1, isAdmin: false, remainingCalls: 1 },
      path: '/plays',
    });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(mockUpdateTable).toHaveBeenCalledWith('user');
    expect(mockFirstWhere).toHaveBeenCalledWith('id', '=', 1);
    expect(mockSecondWhere).toHaveBeenCalledWith('remainingCalls', '>', 0);
    const quotaReq = toQuotaRequest(req);

    expect(quotaReq.quotaReserved).toEqual(true);
    expect(quotaReq.user?.remainingCalls).toEqual(999);
    expect(next).toHaveBeenCalled();
  });

  test('returns 429 if user has no calls remaining', async () => {
    const req = getMockReq({
      user: { id: 1, isAdmin: false, remainingCalls: 0 },
      path: '/plays',
    });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(mockUpdateTable).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Monthly call quota exceeded.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 429 if atomic quota reservation finds no calls remaining', async () => {
    mockReserveExecuteTakeFirst.mockResolvedValueOnce(undefined);
    const req = getMockReq({
      user: { id: 1, isAdmin: false, remainingCalls: 1 },
      path: '/plays',
    });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Monthly call quota exceeded.',
    });
    const quotaReq = toQuotaRequest(req);

    expect(quotaReq.user?.remainingCalls).toEqual(0);
    expect(quotaReq.quotaReserved).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 503 if quota reservation fails', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockReserveExecuteTakeFirst.mockRejectedValueOnce(new Error('locked'));
    const req = getMockReq({
      user: { id: 1, isAdmin: false, remainingCalls: 1 },
      path: '/plays',
    });
    const { res, next } = getMockRes();

    await checkCallQuotas(toQuotaRequest(req), toResponse(res), toNext(next));

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Unable to verify call quota. Please retry later.',
    });
    expect(next).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('update quotas tests', () => {
  test('does not refund if there is no user', async () => {
    const req = getMockReq({ user: null });
    const { res, next } = getMockRes({ statusCode: 500 });

    await updateQuotas(toQuotaRequest(req), toResponse(res), toNext(next));
    await res.send({});

    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  test('does not refund if quota was not reserved', async () => {
    const req = getMockReq({ user: { id: 1 } });
    const { res, next } = getMockRes({ statusCode: 500 });

    await updateQuotas(toQuotaRequest(req), toResponse(res), toNext(next));
    await res.send({});

    expect(mockUpdateTable).not.toHaveBeenCalled();
  });

  test('does not refund reserved quota for a successful response', async () => {
    const req = getMockReq({
      user: { id: 1, remainingCalls: 999 },
      quotaReserved: true,
    });
    const { res, next } = getMockRes({ statusCode: 204 });

    await updateQuotas(toQuotaRequest(req), toResponse(res), toNext(next));
    await res.send({});

    expect(mockUpdateTable).not.toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-CallLimit-Remaining', 999);
  });

  test('refunds reserved quota for an unsuccessful response', async () => {
    const req = getMockReq({
      user: { id: 1, remainingCalls: 999 },
      quotaReserved: true,
    });
    const { res, next } = getMockRes({ statusCode: 500 });

    await updateQuotas(toQuotaRequest(req), toResponse(res), toNext(next));
    await res.send({});

    expect(mockUpdateTable).toHaveBeenCalledWith('user');
    expect(mockFirstWhere).toHaveBeenCalledWith('id', '=', 1);
    const quotaReq = toQuotaRequest(req);

    expect(quotaReq.user?.remainingCalls).toEqual(1000);
    expect(res.setHeader).toHaveBeenCalledWith('X-CallLimit-Remaining', 1000);
  });
});
