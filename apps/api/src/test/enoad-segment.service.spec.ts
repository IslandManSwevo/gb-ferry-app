import { Test, TestingModule } from '@nestjs/testing';
import { ENoadSegmentService } from '../modules/cbp/enoad-segment.service';
import { PrismaService } from '../modules/prisma/prisma.service';

describe('ENoadSegmentService', () => {
  let service: ENoadSegmentService;

  const mockPrisma = {
    eNoadSegment: {
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ENoadSegmentService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ENoadSegmentService>(ENoadSegmentService);
  });

  it('should create initial segment without a NOTICE ID', async () => {
    mockPrisma.eNoadSegment.create.mockResolvedValue({ id: 'seg_1' });

    await service.createInitialSegment({
      vesselId: 'v_1',
      portOfCall: 'FLL',
      eta: new Date(),
      etd: new Date(),
    });

    expect(mockPrisma.eNoadSegment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        uscgNoticeId: null,
        segmentType: 'ARRIVAL',
      }),
    });
  });

  it('should throw when building update without a NOTICE ID', async () => {
    mockPrisma.eNoadSegment.findUniqueOrThrow.mockResolvedValue({
      id: 'seg_1',
      uscgNoticeId: null,
    });

    await expect(service.buildUpdateRequest('seg_1', {})).rejects.toThrow(
      'Cannot submit update until initial eNOAD is accepted'
    );
  });

  it('should store NOTICE ID after recordUscgNoticeId', async () => {
    mockPrisma.eNoadSegment.update.mockResolvedValue({ id: 'seg_1', uscgNoticeId: 'NOTICE123' });

    await service.recordUscgNoticeId('seg_1', 'NOTICE123');

    expect(mockPrisma.eNoadSegment.update).toHaveBeenCalledWith({
      where: { id: 'seg_1' },
      data: { uscgNoticeId: 'NOTICE123', status: 'SUBMITTED' },
    });
  });
});
