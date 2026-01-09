
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet } from './gallery';
import { imageGenerations } from '../../src/db/schema';
import type { Mock } from 'vitest';

// Mock types
type MockDb = {
  select: Mock;
  from: Mock;
  where: Mock;
  orderBy: Mock;
  limit: Mock;
};

describe('GET /api/gallery', () => {
  let mockDb: MockDb;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;
  let mockRequest: { url: string };

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockRequest = {
      url: 'https://example.com/api/gallery',
    };

    mockContext = {
      request: mockRequest,
      data: {
        db: mockDb,
        user: { id: 'user-123' },
      },
      env: {},
      waitUntil: vi.fn(),
      next: vi.fn(),
      params: {},
    };
  });

  it('should return 401 if user is not logged in', async () => {
    mockContext.data.user = null;
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Authentication required', code: 'UNAUTHORIZED' });
  });

  it('should return empty list if no generations found', async () => {
    mockDb.limit.mockResolvedValue([]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      images: [],
      nextCursor: null,
      hasMore: false,
    });
  });

  it('should return images with pagination data', async () => {
    const mockGenerations = [
      {
        id: '1',
        predictionId: 'pred-1',
        outputImageUrl: 'https://example.com/img1.png',
        replicateOutputUrl: null,
        createdAt: new Date('2023-01-02T00:00:00Z'),
      },
      {
        id: '2',
        predictionId: 'pred-2',
        outputImageUrl: null,
        replicateOutputUrl: 'https://replicate.com/img2.png',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      },
    ];

    mockDb.limit.mockResolvedValue(mockGenerations);

    const res = await onRequestGet(mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    
    expect(body.images).toHaveLength(2);
    expect(body.images[0]).toEqual({
      id: '1',
      predictionId: 'pred-1',
      imageUrl: 'https://example.com/img1.png',
      createdAt: '2023-01-02T00:00:00.000Z',
    });
    expect(body.hasMore).toBe(false);
  });

  it('should handle pagination limit and cursor', async () => {
    // Request with limit=1
    mockRequest.url = 'https://example.com/api/gallery?limit=1';
    
    // DB returns 2 items (limit + 1) to indicate hasMore
    const mockGenerations = [
      {
        id: '1',
        predictionId: 'pred-1',
        outputImageUrl: 'url1',
        createdAt: new Date('2023-01-02T00:00:00Z'),
      },
      {
        id: '2',
        predictionId: 'pred-2',
        outputImageUrl: 'url2',
        createdAt: new Date('2023-01-01T00:00:00Z'),
      },
    ];
    mockDb.limit.mockResolvedValue(mockGenerations);

    const res = await onRequestGet(mockContext);
    
    const body = await res.json();
    expect(body.images).toHaveLength(1); // Should only return 1
    expect(body.hasMore).toBe(true);
    expect(body.nextCursor).toBe('2023-01-02T00:00:00.000Z'); // Last item of the slice
  });

  it('should filter out images without URLs', async () => {
    const mockGenerations = [
      {
        id: '1',
        outputImageUrl: null,
        replicateOutputUrl: null,
        createdAt: new Date(),
      },
    ];
    mockDb.limit.mockResolvedValue(mockGenerations);

    const res = await onRequestGet(mockContext);
    
    const body = await res.json();
    expect(body.images).toHaveLength(0);
  });
  
  it('should return 200 with empty list on DB error', async () => {
    mockDb.select.mockImplementation(() => { throw new Error('DB Error'); });
    
    // Spy on console.error to suppress output during test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ images: [], nextCursor: null, hasMore: false });
    
    consoleSpy.mockRestore();
  });
});
