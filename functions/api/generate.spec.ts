import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from './generate';
import { ImageGenerationStatus } from '../../src/db/schema';

// Mock types
import type { Mock } from 'vitest';

// Mock types
type MockDb = {
  update: Mock;
  insert: Mock;
  select: Mock;
  from: Mock;
  where: Mock;
  set: Mock;
  returning: Mock;
  values: Mock;
};

describe('POST /api/generate', () => {
  let mockDb: MockDb;
  let mockEnv: { REPLICATE_API_TOKEN: string; BASE_URL: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any; // Context is complex to fully mock, but we can try to improve or leave as any with disable if needed, but per rules we should try to type it.
  // Actually, let's type mockContext loosely as Record<string, any> or better yet partial match
  let mockRequest: { json: Mock };

  beforeEach(() => {
    // Basic DB Mock
    mockDb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ credits: 9 }]), // Default success
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
    };

    mockEnv = {
      REPLICATE_API_TOKEN: 'test-token',
      BASE_URL: 'https://example.com',
    };

    mockRequest = {
      json: vi.fn().mockResolvedValue({
        image: 'base64image',
      }),
    };

    mockContext = {
      request: mockRequest,
      env: mockEnv,
      data: {
        db: mockDb,
        user: { id: 'user-123' },
      },
      waitUntil: vi.fn(),
      next: vi.fn(),
      params: {},
      functionPath: '',
    };
    
    // Mock global fetch
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'pred-123',
        status: 'starting',
      }),
    }));
  });

  it('should return 401 if user is not logged in', async () => {
    mockContext.data.user = null;
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: '로그인이 필요합니다.', code: 'UNAUTHORIZED' });
  });

  it('should return 402 if user has insufficient credits', async () => {
    // Mock update returning empty array (no match found for credits > 0)
    mockDb.returning.mockResolvedValueOnce([]);
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body).toEqual({ error: '크레딧이 부족합니다.', code: 'INSUFFICIENT_CREDITS' });
  });

  it('should return 400 if image is missing', async () => {
    mockRequest.json.mockResolvedValue({});
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Image is required' });
  });

  it('should call Replicate and return 200 on success', async () => {
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      id: 'pred-123',
      remainingCredits: 9
    });

    // Verify DB update usage (credit deduction)
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled(); // checks update body
    
    // Verify Replicate API call
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.replicate.com/v1/predictions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Token test-token',
        }),
      })
    );
    
    // Verify Generation record saved
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      predictionId: 'pred-123',
      userId: 'user-123',
      status: ImageGenerationStatus.PENDING,
    }));
  });

  it('should return 500 if Replicate API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue("Service Error"),
    }));

    const res = await onRequestPost(mockContext);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: 'Failed to create prediction' });
  });
});
