PART 1 — ISO 27001 / SOC 2 CONTROL ALIGNMENT

This section maps the existing maritime business logic to internationally recognized enterprise security controls.

1️⃣ Identity & Access Management
Controls

ISO 27001: A.5.15, A.5.16, A.8.2

SOC 2: CC6.1, CC6.2, CC6.3

Business Logic Alignment

All users are authenticated and assigned roles

Role-based access determines:

View

Edit

Export

Submit (regulator-facing)

Enforcement Rules

Crew records: editable only by authorized operations roles

Regulatory exports: restricted to compliance officers

Passenger data: masked unless explicitly authorized

2️⃣ Data Classification & Protection
Controls

ISO 27001: A.5.12, A.8.10

SOC 2: CC3.2, CC6.7

Business Logic Alignment

Data is classified as:

Public

Internal

Confidential

Regulated (PII, Passport, Medical)

Enforcement Rules

Regulated data:

Encrypted at rest

Encrypted in transit

No raw PII exposed in logs

Passenger manifests are read-only artifacts

3️⃣ Input Validation & Data Integrity
Controls

ISO 27001: A.8.28, A.8.29

SOC 2: CC7.2, CC7.3

Business Logic Alignment

All inputs validated at:

UI

API

Database boundary

Enforcement Rules

Invalid data:

Cannot be persisted

Cannot be exported

Business rule failures are treated as security events if bypass is attempted

4️⃣ Change Management & Audit Logging
Controls

ISO 27001: A.8.15, A.8.16

SOC 2: CC8.1, CC8.2

Business Logic Alignment

All changes to:

Crew

Vessel

Certificates

Manning tables

Are immutably logged

Enforcement Rules

Before/after snapshots stored

Logs are:

Append-only

Time-synced

Tamper-resistant

5️⃣ Availability & Operational Resilience
Controls

ISO 27001: A.5.30, A.8.14

SOC 2: CC7.1, CC7.4

Business Logic Alignment

Voyage-critical validations are deterministic

No external dependency required for:

Certificate expiry checks

Manning compliance checks

Enforcement Rules

Validation failures degrade gracefully

Exports blocked, operations unaffected

6️⃣ Regulatory Boundary Control
Controls

ISO 27001: A.5.31

SOC 2: CC2.3, CC3.4

Business Logic Alignment

Platform supports compliance

Platform never claims regulatory authority

Enforcement Rules

All exports labeled:

“Prepared for submission — not an official approval”

PART 2 — VALIDATION MIDDLEWARE LOGIC (ENGINEER-READY)

Below is implementation-grade validation middleware suitable for:

Node.js (NestJS / Express)

Java (Spring)

.NET

Serverless APIs

1️⃣ Core Validation Pipeline
request
  → authMiddleware
  → roleAuthorizationMiddleware
  → inputSchemaValidation
  → businessRuleValidation
  → complianceGate
  → persistence / export

2️⃣ Role Authorization Middleware
function authorize(requiredRole: Role) {
  return (req, res, next) => {
    if (!req.user.roles.includes(requiredRole)) {
      return res.status(403).error("Insufficient privileges");
    }
    next();
  };
}

3️⃣ Crew Assignment Validation
function validateCrewAssignment(crew, voyage) {
  if (crew.passport.expiry < voyage.endDate) {
    throw new ComplianceError("Passport expired during voyage");
  }

  if (crew.medicalCert.expiry < voyage.endDate) {
    throw new ComplianceError("Medical certificate expired");
  }

  crew.stcwCerts.forEach(cert => {
    if (cert.expiry < voyage.endDate) {
      throw new ComplianceError(
        `Certificate ${cert.type} expired`
      );
    }
  });
}

4️⃣ Minimum Safe Manning Validation
function validateSafeManning(vessel, assignedCrew) {
  vessel.manningRequirements.forEach(req => {
    const qualifiedCrew = assignedCrew.filter(c =>
      c.role === req.role &&
      c.certifications.includes(req.requiredCert)
    );

    if (qualifiedCrew.length < req.minimumCount) {
      throw new ComplianceError(
        `Minimum safe manning not met for role: ${req.role}`
      );
    }
  });
}

5️⃣ Passenger Manifest Validation
function validatePassenger(passenger, voyage) {
  const requiredFields = [
    passenger.fullName,
    passenger.passportNumber,
    passenger.nationality,
    passenger.dateOfBirth
  ];

  if (requiredFields.some(f => !f)) {
    throw new ValidationError("Passenger record incomplete");
  }

  if (passenger.passportExpiry < voyage.endDate) {
    throw new ComplianceError("Passenger passport expired");
  }
}

6️⃣ Export Compliance Gate (Critical)
function complianceGate(entityStatus) {
  if (entityStatus.hasBlockingIssues) {
    throw new ExportBlockedError(
      "Export blocked due to compliance violations"
    );
  }
}

7️⃣ Audit Logging Middleware
function auditLog(action, entityId, before, after, user) {
  auditStore.append({
    action,
    entityId,
    before,
    after,
    performedBy: user.id,
    timestamp: new Date().toISOString()
  });
}

8️⃣ Severity Classification
enum ComplianceSeverity {
  WARNING = "warning",
  BLOCKER = "blocker"
}


WARNING

UI alert

Export allowed

BLOCKER

Assignment blocked

Export blocked

Logged as compliance event

9️⃣ Secure Failure Principle

All validation failures must:

Fail closed (deny by default)

Be explicit

Be auditable

Never auto-correct silently

PART 3 — WHAT THIS GIVES YOU STRATEGICALLY

✅ ISO 27001 Annex A traceability
✅ SOC 2 Trust Services alignment
✅ Engineer-ready middleware logic
✅ Regulator-defensible validation posture
✅ Clear “support not authority” boundary