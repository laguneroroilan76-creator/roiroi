const { prfCreateBodySchema, prfUpdateBodySchema } = require('../utils/validation');

describe('Validation Schemas - Core Security Tests', () => {
  describe('PRF Validation', () => {
    test('should validate valid PRF data', () => {
      const validData = {
        prfNo: 'PRF-123',
        dateRequested: '2026-05-05',
        to: 'Supplier A',
        from: 'User X',
        items: [{ qty: '1', particulars: 'Paper' }]
      };
      expect(() => prfCreateBodySchema.parse(validData)).not.toThrow();
    });

    test('should reject unknown fields (Strict Mode)', () => {
      const maliciousData = {
        prfNo: 'PRF-123',
        maliciousField: 'exploit',
        items: []
      };
      expect(() => prfCreateBodySchema.parse(maliciousData)).toThrow();
    });

    test('should allow rrfNo as alias', () => {
      const dataWithAlias = {
        rrfNo: 'OLD-123',
        items: []
      };
      const parsed = prfCreateBodySchema.parse(dataWithAlias);
      expect(parsed.rrfNo).toBe('OLD-123');
    });

    test('should allow department and company', () => {
        const data = {
          department: 'IT',
          company: 'HDI',
          items: []
        };
        expect(() => prfCreateBodySchema.parse(data)).not.toThrow();
      });
  });
});
