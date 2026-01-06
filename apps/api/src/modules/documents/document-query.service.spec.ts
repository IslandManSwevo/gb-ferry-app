import { DocumentQueryService } from './document-query.service';

describe('DocumentQueryService', () => {
  const auditService = { log: jest.fn() } as any;

  it('returns paginated vessel documents with filters', async () => {
    const prisma = {
      $transaction: jest.fn().mockResolvedValue([[{ id: 'doc-1', vesselId: 'v-1' }], 1]),
    } as any;

    const service = new DocumentQueryService(prisma, auditService);

    const result = await service.search({ vesselId: 'v-1', q: 'safe' }, 'user-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DOCUMENT_LIST_READ', userId: 'user-1' })
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
