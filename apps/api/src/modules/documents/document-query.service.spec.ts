import { DocumentQueryService } from './document-query.service';

describe('DocumentQueryService', () => {
  let auditService: any;

  beforeEach(() => {
    auditService = { log: jest.fn() };
  });

  it('returns paginated vessel documents with filters', async () => {
    const prisma = {
      vesselDocument: {
        findMany: jest.fn().mockResolvedValue([{ id: 'doc-1', vesselId: 'v-1' }]),
        count: jest.fn().mockResolvedValue(1),
      },
      $transaction: jest.fn(async (calls: Promise<any>[]) => Promise.all(calls)),
    } as any;

    const service = new DocumentQueryService(prisma, auditService);

    const result = await service.search({ vesselId: 'v-1', q: 'safe' }, 'user-1');

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          where: expect.objectContaining({
            vesselId: 'v-1',
            OR: expect.any(Array),
          }),
        }),
        expect.any(Object),
      ])
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'READ', userId: 'user-1' })
    );
    expect(result).toEqual({
      data: [{ id: 'doc-1', vesselId: 'v-1' }],
      total: 1,
      page: 1,
      limit: 25,
      pages: 1,
    });
  });
});
