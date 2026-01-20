import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost } from './eraser';
// Mock ReplicateModels since it's used in the code
vi.mock('../../src/constants/replicate', () => ({
  ReplicateModels: {
    STABLE_DIFFUSION_INPAINTING: 'stable-diffusion-version',
  },
}));

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

describe('POST /api/eraser', () => {
  let mockDb: MockDb;
  let mockEnv: { REPLICATE_API_TOKEN: string; BASE_URL: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
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
        mask: 'base64mask',
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
        id: 'pred-eraser-123',
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

  it('should return 400 if details are missing', async () => {
    mockRequest.json.mockResolvedValue({ image: 'only-image' }); // mask missing
    
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Image and mask are required' });
  });

  it('should call Replicate and return 200 on success', async () => {
    const res = await onRequestPost(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      id: 'pred-eraser-123',
      remainingCredits: 9
    });

    // Verify DB update usage (credit deduction)
    expect(mockDb.update).toHaveBeenCalled();
    
    // Verify Replicate API call
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.replicate.com/v1/predictions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('stable-diffusion-version'),
      })
    );
    
    // Verify Generation record saved
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
