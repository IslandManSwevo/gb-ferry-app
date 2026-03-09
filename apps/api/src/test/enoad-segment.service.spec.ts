import { PrismaService } from '@gbferry/database';
import { Test, TestingModule } from '@nestjs/testing';
import { EnoAdSegmentService } from '../modules/cbp/enoad-segment.service';

describe('EnoAdSegmentService', () => {
  let service: EnoAdSegmentService;

  const mockPrisma = {
    eNoadSegment: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnoAdSegmentService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<EnoAdSegmentService>(EnoAdSegmentService);
  });

  it('should link NOTICE ID after linkNoticeId', async () => {
    mockPrisma.eNoadSegment.update.mockResolvedValue({ id: 'seg_1', uscgNoticeId: 'NOTICE123' });

    await service.linkNoticeId('seg_1', 'NOTICE123');

    expect(mockPrisma.eNoadSegment.update).toHaveBeenCalledWith({
      where: { id: 'seg_1' },
      data: { uscgNoticeId: 'NOTICE123', status: 'ACCEPTED' },
    });
  });

  it('should get voyage timeline', async () => {
    const mockTimeline = [{ id: 'seg_1', eta: new Date() }];
    mockPrisma.eNoadSegment.findMany.mockResolvedValue(mockTimeline);

    const result = await service.getVoyageTimeline('v_1');

    expect(mockPrisma.eNoadSegment.findMany).toHaveBeenCalledWith({
      where: { vesselId: 'v_1' },
      orderBy: { eta: 'asc' },
      include: { i418Submission: true },
    });
    expect(result).toEqual(mockTimeline);
  });
});
