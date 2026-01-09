
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

describe('GET /api/status/[id]', () => {
  let mockDb: MockDb;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContext: any;

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    mockContext = {
      request: new Request('https://example.com'),
      data: {
        db: mockDb,
      },
      params: { id: 'pred-123' },
      env: {},
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

  it('should return pending status if no record found (assuming DB write lag)', async () => {
    mockDb.limit.mockResolvedValue([]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pending');
    expect(body.id).toBe('pred-123');
    expect(body.output).toBeNull();
  });

  it('should return status from DB record', async () => {
    const mockRecord = {
      predictionId: 'pred-123',
      status: 'succeeded',
      outputImageUrl: 'https://cdn.example.com/img.png',
      errorMessage: null,
      createdAt: new Date('2023-01-01T00:00:00Z'),
      completedAt: new Date('2023-01-01T00:00:10Z'),
    };
    mockDb.limit.mockResolvedValue([mockRecord]);
    
    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: 'pred-123',
      status: 'succeeded',
      output: 'https://cdn.example.com/img.png',
      error: null,
      created_at: '2023-01-01T00:00:00.000Z',
      completed_at: '2023-01-01T00:00:10.000Z',
    });
  });

  it('should fallback to replicateOutputUrl if outputImageUrl is missing', async () => {
    const mockRecord = {
      predictionId: 'pred-123',
      status: 'succeeded',
      outputImageUrl: null,
      replicateOutputUrl: 'https://replicate.com/img.png',
      errorMessage: null,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    mockDb.limit.mockResolvedValue([mockRecord]);
    
    const res = await onRequestGet(mockContext);
    
    const body = await res.json();
    expect(body.output).toBe('https://replicate.com/img.png');
  });

  it('should return pending if DB query fails', async () => {
    mockDb.select.mockImplementation(() => { throw new Error('DB Error'); });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await onRequestGet(mockContext);
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('pending'); // Fallback is pending
    
    consoleSpy.mockRestore();
  });
});
