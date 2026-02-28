# Prisma Database Wiring - Crew Compliance Patterns

**STATUS: PIVOTED & IMPLEMENTED (Feb 2026)**

This document serves as a reference for the Prisma code patterns used after the pivot from passenger manifests to dedicated crew compliance.

---

## 1. Crew Management Wiring

**File**: `apps/api/src/modules/crew/crew.service.ts`
**Pattern**: Assigning and Validating Safe Manning

```typescript
async assignCrewToVessel(crewId: string, vesselId: string, userId: string) {
  const crewMember = await this.prisma.crewMember.findUnique({
    where: { id: crewId },
    include: { certifications: { where: { status: 'VALID' } } },
  });

  const vessel = await this.prisma.vessel.findUnique({
    where: { id: vesselId },
    include: { crew: { include: { certifications: true } } }
  });

  // COMPLIANCE GATE: Validate BMA R106
  const validation = validateSafeManning([...vessel.crew, crewMember], vessel.grossTonnage);
  if (!validation.valid) throw new ComplianceError("Safe manning violation");

  const updated = await this.prisma.crewMember.update({
    where: { id: crewId },
    data: { vesselId },
  });

  await this.auditService.log({
    action: 'CREW_ASSIGN',
    entityId: crewId,
    userId,
    details: { vesselId, manningStatus: 'VALID' },
  });

  return updated;
}
```

---

## 2. Regulatory Submission Wiring

**File**: `apps/api/src/modules/cbp/cbp.service.ts`
**Pattern**: Recording a CBP Submission

```typescript
async submitCrewList(vesselId: string, userId: string) {
  const crew = await this.prisma.crewMember.findMany({
    where: { vesselId, status: 'ACTIVE' },
    include: { certifications: true }
  });

  // Perform data transformation to I-418 / eNOAD format...

  const submission = await this.prisma.cbpSubmission.create({
    data: {
      vesselId,
      type: 'I_418',
      status: 'SUBMITTED',
      submittedById: userId,
      payload: JSON.stringify(crew),
    },
  });

  await this.auditService.log({
    action: 'CBP_SUBMISSION',
    entityId: submission.id,
    userId,
    details: { vesselId, type: 'I_418' },
  });

  return submission;
}
```

---

## 3. Certification Expiry Patterns

**File**: `apps/api/src/modules/crew/certifications.service.ts`

```typescript
async getExpiring(withinDays: number = 30) {
  const deadline = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);

  return this.prisma.certification.findMany({
    where: {
      status: 'VALID',
      expiryDate: { lte: deadline },
    },
    include: { crew: true },
  });
}
```

---

## 🛠 Legacy Cleanup (DELETED)

The following Prisma delegates and patterns have been **DELETED** as part of the pivot:

- `prisma.passenger.*`
- `prisma.manifest.*`
- `prisma.sailing.*`

Ensure no references to these models remain in your service logic. All PII masking should now focus on the `CrewMember` and `Certification` models.
