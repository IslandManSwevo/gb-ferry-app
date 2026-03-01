# Grand Bahama Ferry: Crew Compliance & Regulatory Platform

Product Requirements Document (PRD) |
Version 2.0 (Pivoted)

## 1. Purpose

This platform manages maritime crew STCW certifications, BMA safe manning compliance, and US CBP regulatory reporting (I-418/eNOAD). It ensures vessel readiness by validating crew qualifications before departure.

## 2. Problem Statement

Current maritime operations involve complex, manual tracking of seafarer certifications and high-stakes regulatory filings. Errors in these areas lead to vessel detentions, significant fines, and operational delays.

## 3. Goals

**Primary Goals:**

- Ensure 100% STCW and BMA Safe Manning compliance.
- Automate regulatory reporting (CBP I-418/eNOAD).
- Provide real-time visibility into fleet-wide crew readiness.
- Maintain an immutable audit trail for Port State Control (PSC) inspections.

**Non-Goals:**

- No passenger booking or manifest management (Removed in v2.0).
- No immigration or customs decision automation.
- No government system replacement.

## 4. Users

- **Operations Staff**: Manage crew rosters and document intake.
- **Compliance Officers**: Verify certifications and transmit regulatory data.
- **Vessel Masters**: Approve crew assignments and monitor on-board compliance.
- **Administrators**: System configuration and RBAC management.
- **Regulators**: Read-only oversight of audit logs.

## 5. Core Features (MVP)

- **STCW Certification Tracking**: Automated expiry monitoring and qualification mapping.
- **Safe Manning Engine**: Real-time validation against BMA R106 requirements.
- **Regulatory Reporting**: Integrated generation of CBP Form I-418 and eNOAD.
- **Document Management**: Secure storage and AI-ready extraction for crew credentials.
- **Audit & Alerts**: Immutable logging and automated status escalations for non-compliance.

## 6. Security & Compliance

- Role-based access control (RBAC) via Keycloak.
- MFA for administrative users.
- AES-256 encryption at rest; TLS 1.3 in transit.
- PII protection for sensitive crew data (Passport/Seafarer IDs).

## 7. Regulatory Safeguards

The platform provides decision support and reporting automation only. All regulatory authority remains with government agencies (BMA, CBP, etc.).

## 8. Success Metrics

- 0% Safe Manning violations for departed vessels.
- 100% submission rate for required CBP filings.
- 50% reduction in manual document verification time.

## 9. Roadmap

- **Phase 1**: Core Crew & Vessel Registry with STCW tracking.
- **Phase 2**: AI-driven document parsing and multi-region regulatory adapters.
- **Phase 3**: Live external verification with global seafarer registries (COMPLETE).
