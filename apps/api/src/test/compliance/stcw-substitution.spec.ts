import { Test, TestingModule } from '@nestjs/testing';
import { STCWSubstitutionService } from '../../modules/compliance/stcw-substitution.service';

describe('STCWSubstitutionService', () => {
  let service: STCWSubstitutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [STCWSubstitutionService],
    }).compile();

    service = module.get<STCWSubstitutionService>(STCWSubstitutionService);
  });

  describe('canSubstitute', () => {
    it('should allow exact matches', () => {
      const result = service.canSubstitute('MASTER', 'MASTER');
      expect(result.canSubstitute).toBe(true);
    });

    it('should allow valid substitutions in hierarchy', () => {
      // In our hierarchy, MASTER can substitute for CHIEF_OFFICER
      const result = service.canSubstitute('CHIEF_OFFICER', 'MASTER');
      expect(result.canSubstitute).toBe(true);
    });

    it('should deny unauthorized substitutes', () => {
      const result = service.canSubstitute('CHIEF_OFFICER', 'RATING');
      expect(result.canSubstitute).toBe(false);
      expect(result.reason).toContain('is not an authorized substitute');
    });

    it('should deny cross-departmental substitutions', () => {
      const result = service.canSubstitute('CHIEF_OFFICER', 'CHIEF_ENGINEER');
      expect(result.canSubstitute).toBe(false);
    });

    it('should handle unknown required roles gracefully', () => {
      const result = service.canSubstitute('INVALID_ROLE', 'MASTER');
      expect(result.canSubstitute).toBe(false);
      expect(result.reason).toContain('not found in STCW hierarchy');
    });
  });

  describe('getApplicableSTCWRegulation', () => {
    it('should return default regulation for large vessels', () => {
      const reg = service.getApplicableSTCWRegulation('MASTER', 1000);
      expect(reg).toBe('STCW II/2');
    });

    it('should return small vessel regulation when below threshold', () => {
      // MASTER has gtThreshold: 500, stcwRegulationSmallVessel: 'STCW II/3'
      const reg = service.getApplicableSTCWRegulation('MASTER', 400);
      expect(reg).toBe('STCW II/3');
    });

    it('should throw error for unknown roles', () => {
      expect(() => service.getApplicableSTCWRegulation('UNKNOWN', 500)).toThrow(
        'is not a recognized STCW role'
      );
    });
  });
});
