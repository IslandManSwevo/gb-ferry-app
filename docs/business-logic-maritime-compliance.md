# Maritime Business Logic: ISO 27001 / SOC 2 Alignment

This section maps the pivoted Crew Compliance business logic to internationally recognized enterprise security controls.

## 1️⃣ Identity & Access Management

**Controls**: ISO 27001: A.5.15, SOC 2: CC6.1

All users are authenticated via Keycloak and assigned maritime-specific roles.

- **Crew Records**: Editable only by authorized Operations roles.
- **Regulatory Transmissions**: Restricted to Compliance Officers.
- **Sensitive PII**: Masked (e.g., Passport/Seafarer ID) unless user has explicit `PII_VIEW` entitlement.

## 2️⃣ Data Classification & Protection

**Controls**: ISO 27001: A.8.10, SOC 2: CC6.7

Data is classified as Regulated (PII, Medical, STCW Certs).

- **Encrypted at Rest**: AES-256-GCM for sensitive fields.
- **Encrypted in Transit**: TLS 1.3 for all API and Web traffic.
- **No PII in Logs**: Audit logs record actions but not raw sensitive identity numbers.

## 3️⃣ Input Validation & Data Integrity

**Controls**: ISO 27001: A.8.28, SOC 2: CC7.2

All inputs are validated at the UI, API, and Database boundaries.

- **Invalid Data**: Cannot be persisted or exported.
- **Certification Gate**: Software prevents assigning crew with invalid/missing mandatory certs.

## 4️⃣ Change Management & Audit Logging

**Controls**: ISO 27001: A.8.15, SOC 2: CC8.1

All changes to Crew, Vessel, Certifications, and Manning tables are immutably logged.

- **Snapshots**: Before/after values are stored for compliance review.
- **Tamper-Resistance**: Logs are append-only and cryptographically timestamped.

## 5️⃣ Operational Resilience

**Controls**: ISO 27001: A.8.14, SOC 2: CC7.4

Compliance validations are deterministic and can run without external network dependency for departure clearing.

- **Safe Manning Checks**: Run locally against cached BMA R106 rules.
- **Fail-Safe**: If a compliance check fails, regulatory exports are blocked.

---

## PART 2 — VALIDATION MIDDLEWARE LOGIC (ENGINEER-READY)

### 1️⃣ Crew Assignment Validation

```javascript
function validateCrewAssignment(crew, vessel) {
  // Check mandatory safety certs
  const mandatory = ['STCW_BASIC_SAFETY', 'ENG1_MEDICAL'];
  mandatory.forEach((type) => {
    const cert = crew.certifications.find((c) => c.type === type && c.status === 'VALID');
    if (!cert || cert.expiryDate < new Date()) {
      throw new ComplianceError(`Mandatory cert ${type} missing or expired`);
    }
  });

  // Check passport for voyage duration
  if (crew.passportExpiry < vessel.nextDepartureDate) {
    throw new ComplianceError('Passport expires before voyage completion');
  }
}
```

### 2️⃣ Minimum Safe Manning Validation (BMA R106)

```javascript
function validateSafeManning(vessel, assignedCrew) {
  vessel.manningRequirements.forEach((req) => {
    const qualifiedCrew = assignedCrew.filter(
      (c) =>
        c.role === req.role &&
        c.certifications.some((cert) => cert.type === req.requiredCert && cert.status === 'VALID')
    );

    if (qualifiedCrew.length < req.minimumCount) {
      throw new ComplianceError(`Safe manning gap: ${req.role} (Required: ${req.minimumCount})`);
    }
  });
}
```

### 3️⃣ Regulatory Submission Gate

```javascript
function submissionGate(submissionData) {
  if (submissionData.complianceScore < 1.0) {
    throw new ExportBlockedError(
      'Submission blocked: Data does not meet regulatory completeness standards'
    );
  }
}
```

---

## PART 3 — STRATEGIC VALUE

✅ **ISO 27001 Traceability**: Direct mapping to Annex A controls.
✅ **PSC Readiness**: Platform ensures vessel is "Inspection Ready" at all times.
✅ **Zero-Trust for Credentials**: Mandatory verification before assignment.
