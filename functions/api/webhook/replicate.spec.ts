
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from './replicate';
import type { Mock } from 'vitest';

// Mock DB
const mockDb = {
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
};

// Mock createDbClient
vi.mock('../../lib/db', () => ({
  createDbClient: () => mockDb,
}));

// Mock crypto
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
  },
};
vi.stubGlobal('crypto', mockCrypto);

describe('POST /api/webhook/replicate', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  let mockRequest: {
    json: Mock;
    clone: Mock;
    headers: Map<string, string>;
  };
  let mockR2: { put: Mock };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb.update.mockReturnThis();
    mockDb.set.mockReturnThis();
    mockDb.where.mockReturnThis();

    mockCrypto.subtle.importKey.mockResolvedValue('key');
    // Default valid signature logic implies manual check in code matches
    // But our code does timingsafe comp. We can mock the result of signature match if we could, 
    // but the code actually computes signature. So we need to mock sign to return something expected?
    // Actually, simplifying: the code computes expected signature.
    // If we return specific bytes from sign, we can craft the header to match.
    mockCrypto.subtle.sign.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    
    // btoa([1,2,3]) = "AQID"
    // So if header matches "v1,AQID", it passes.

    mockRequest = {
      json: vi.fn(),
      clone: vi.fn().mockReturnValue({
        text: vi.fn().mockResolvedValue('raw-body'),
      }),
      headers: new Map([
        ['webhook-id', 'msg-1'],
        ['webhook-timestamp', String(Math.floor(Date.now() / 1000))],
        ['webhook-signature', 'v1,AQID'], // Matches mocked Sign result
      ]),
    };

    mockR2 = {
      put: vi.fn(),
    };

    mockContext = {
      request: mockRequest,
      env: {
        DATABASE_URL: 'postgres://...',
        REPLICATE_WEBHOOK_SECRET: 'whsec_secret',
        R2_BUCKET: mockR2,
        R2_PUBLIC_URL: 'https://r2.example.com',
      },
      waitUntil: vi.fn(),
      next: vi.fn(),
    };
    
    // Mock global fetch for image download
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      arrayBuffer: () => new ArrayBuffer(10),
    }));
  });

  it('should return 401 if signatures do not match', async () => {
    // Mock sign to return something else
    mockCrypto.subtle.sign.mockResolvedValue(new Uint8Array([9, 9, 9]).buffer);
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(401);
  });

  it('should process SUCCEEDED status and upload to R2', async () => {
    mockRequest.json.mockResolvedValue({
      id: 'pred-1',
      status: 'succeeded',
      output: 'https://replicate.com/out.png',
      created_at: new Date().toISOString(),
    });

    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    expect(mockR2.put).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled();
    // Should update with R2 public URL
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      status: 'succeeded',
      outputImageUrl: expect.stringContaining('https://r2.example.com/'),
    }));
  });

  it('should handle SUCCEEDED with array output', async () => {
    mockRequest.json.mockResolvedValue({
      id: 'pred-1',
      status: 'succeeded',
      output: ['https://replicate.com/out.png'],
      created_at: new Date().toISOString(),
    });

    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    expect(mockR2.put).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      status: 'succeeded',
    }));
  });

  it('should handle FAILED status', async () => {
    mockRequest.json.mockResolvedValue({
        id: 'pred-1',
        status: 'failed',
        error: 'Out of memory',
        created_at: new Date().toISOString(),
      });
  
      const res = await onRequestPost(mockContext);
      
      expect(res.status).toBe(200);
      expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed',
        errorMessage: 'Out of memory',
      }));
  });
  
  it('should fallback to Replicate URL if R2 upload fails', async () => {
    mockRequest.json.mockResolvedValue({
      id: 'pred-1',
      status: 'succeeded',
      output: 'https://replicate.com/out.png',
      created_at: new Date().toISOString(),
    });

    // Mock R2 failure
    mockR2.put.mockRejectedValue(new Error('R2 Error'));

    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    
    // Should still update DB but with Replicate URL
    expect(mockDb.set).toHaveBeenCalledWith(expect.objectContaining({
      status: 'succeeded',
      replicateOutputUrl: 'https://replicate.com/out.png',
      // outputImageUrl should NOT be set or undefined if we check exact match, 
      // but 'expect.objectContaining' checks subset.
      // The implementation sets replicateOutputUrl, error message.
    }));
  });
});
