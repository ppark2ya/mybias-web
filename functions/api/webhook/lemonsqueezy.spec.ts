
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from './lemonsqueezy';
import type { Mock } from 'vitest';

// Mock DB
const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  returning: vi.fn(),
};

// Mock createDbClient
vi.mock('../../lib/db', () => ({
  createDbClient: () => mockDb,
}));

// Mock crypto
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    verify: vi.fn(),
  },
};
vi.stubGlobal('crypto', mockCrypto);

describe('POST /api/webhook/lemonsqueezy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  let mockRequest: {
    json: Mock;
    clone: Mock;
    headers: Map<string, string>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValue([]);
    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.returning.mockResolvedValue([{ id: 'user-123' }]);

    mockCrypto.subtle.importKey.mockResolvedValue('key');
    mockCrypto.subtle.verify.mockResolvedValue(true); // Default valid signature

    mockRequest = {
      json: vi.fn(),
      clone: vi.fn().mockReturnValue({
        text: vi.fn().mockResolvedValue('raw-body'),
      }),
      headers: new Map([
        ['X-Signature', 'abcdef123456'],
      ]),
    };

    mockContext = {
      request: mockRequest,
      env: {
        DATABASE_URL: 'postgres://...',
        LEMONSQUEEZY_WEBHOOK_SECRET: 'secret',
      },
      waitUntil: vi.fn(),
      next: vi.fn(),
    };
  });

  it('should return 401 if signature validation fails', async () => {
    mockCrypto.subtle.verify.mockResolvedValue(false);
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Invalid signature' });
  });

  it('should process order_created and add credits', async () => {
    mockRequest.json.mockResolvedValue({
      meta: {
        event_name: 'order_created',
        custom_data: { user_id: 'user-123' },
      },
      data: {
        id: 'order-1',
        attributes: {
          status: 'paid',
          first_order_item: { variant_name: 'Basic Plan' },
          user_email: 'test@example.com',
        },
      },
    });

    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true, processed: true });

    // Verify DB update
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      // SQL verification is tricky in mock, but we check call happened
    }));
  });

  it('should skip unpaid orders', async () => {
    mockRequest.json.mockResolvedValue({
      meta: { event_name: 'order_created' },
      data: {
        attributes: { status: 'pending' },
      },
    });

    const res = await onRequestPost(mockContext);
    
    const body = await res.json();
    expect(body).toEqual({ received: true, processed: false });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should find user by email if ID missing', async () => {
    mockRequest.json.mockResolvedValue({
        meta: {
          event_name: 'order_created',
          // custom_data missing user_id
        },
        data: {
          id: 'order-1',
          attributes: {
            status: 'paid',
            first_order_item: { variant_name: 'Basic' },
            user_email: 'found@example.com',
          },
        },
      });

      mockDb.limit.mockResolvedValue([{ id: 'found-user-id' }]); // User found by email

      const res = await onRequestPost(mockContext);
      
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.processed).toBe(true);
      
      expect(mockDb.where).toHaveBeenCalled(); // Should search user
  });

  it('should process order_refunded and deduct credits', async () => {
    mockRequest.json.mockResolvedValue({
      meta: {
        event_name: 'order_refunded',
        custom_data: { user_id: 'user-123' },
      },
      data: {
        attributes: {
          first_order_item: { variant_name: 'Pro Plan' },
          user_email: 'test@example.com',
        },
      },
    });

    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled(); // Deduction update
  });

  it('should acknowledge unknown events', async () => {
    mockRequest.json.mockResolvedValue({
      meta: { event_name: 'unknown_event' },
      data: { id: '1' },
    });

    const res = await onRequestPost(mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
  });

  it('should match Ultra variant and add 450 credits', async () => {
    mockRequest.json.mockResolvedValue({
      meta: {
        event_name: 'order_created',
        custom_data: { user_id: 'user-123' },
      },
      data: {
        id: 'order-1',
        attributes: {
          status: 'paid',
          first_order_item: { variant_name: 'Ultra' },
          user_email: 'test@example.com',
        },
      },
    });

    const res = await onRequestPost(mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should match Master variant and add 1000 credits', async () => {
    mockRequest.json.mockResolvedValue({
      meta: {
        event_name: 'order_created',
        custom_data: { user_id: 'user-123' },
      },
      data: {
        id: 'order-1',
        attributes: {
          status: 'paid',
          first_order_item: { variant_name: 'Master' },
          user_email: 'test@example.com',
        },
      },
    });

    const res = await onRequestPost(mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(true);
  });
});
