
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet } from './[id]';
import type { Mock } from 'vitest';

// Mock types
type MockDb = {
  select: Mock;
  from: Mock;
  where: Mock;
  limit: Mock;
};

describe('GET /api/download/[id]', () => {
  let mockDb: MockDb;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any; // Using any for complex context mock
  let mockR2: { get: Mock };

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockR2 = {
      get: vi.fn(),
    };

    mockContext = {
      request: new Request('https://example.com'),
      env: {
        R2_BUCKET: mockR2,
      },
      data: {
        db: mockDb,
        user: { id: 'user-123' },
      },
      params: { id: 'pred-123' },
      waitUntil: vi.fn(),
      next: vi.fn(),
    };
  });

  it('should return 400 if ID is missing', async () => {
    mockContext.params.id = '';
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'Prediction ID is required' });
  });

  it('should return 401 if user is not logged in', async () => {
    mockContext.data.user = null;
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(401);
  });

  it('should return 404 if image generation record not found', async () => {
    mockDb.limit.mockResolvedValue([]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Image not found' });
  });

  it('should return 403 if user does not own the image', async () => {
    mockDb.limit.mockResolvedValue([{ userId: 'other-user', outputImageUrl: 'url' }]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'Access denied' });
  });

  it('should return 404 if outputImageUrl is missing', async () => {
    mockDb.limit.mockResolvedValue([{ userId: 'user-123', outputImageUrl: null }]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Image not available' });
  });

  it('should return 404 if R2 object not found', async () => {
    mockDb.limit.mockResolvedValue([{ 
      userId: 'user-123', 
      outputImageUrl: 'https://cdn.example.com/generations/test.png' 
    }]);
    
    mockR2.get.mockResolvedValue(null);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'Image file not found' });
  });

  it('should return file download response on success', async () => {
    mockDb.limit.mockResolvedValue([{ 
      userId: 'user-123', 
      outputImageUrl: 'https://cdn.example.com/generations/test.png' 
    }]);
    
    const mockBody = new ReadableStream();
    mockR2.get.mockResolvedValue({
      body: mockBody,
      httpMetadata: { contentType: 'image/png' },
    });
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="mybias-pred-123.png"');
  });

  it('should handle complex R2 keys from URL', async () => {
     mockDb.limit.mockResolvedValue([{ 
      userId: 'user-123', 
      outputImageUrl: 'https://cdn.example.com/some/deep/path/image.jpg' 
    }]);
    
    mockR2.get.mockResolvedValue({
      body: new ReadableStream(),
      httpMetadata: { contentType: 'image/jpeg' },
    });
    
    await onRequestGet(mockContext);
    
    // Check if correct key was requested
    expect(mockR2.get).toHaveBeenCalledWith('some/deep/path/image.jpg');
  });

  it('should return 500 on unexpected error', async () => {
    mockDb.select.mockImplementation(() => { throw new Error('DB Fail'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('DB Fail');
    
    consoleSpy.mockRestore();
  });
});
