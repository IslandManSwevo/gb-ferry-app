# API Contracts - Backend (api)

## Overview
The backend is a NestJS application providing a RESTful API for maritime crew compliance, vessel management, and regulatory reporting.

## Base URL
`http://localhost:3001/api` (Development)

## Authentication
- **Provider**: Keycloak (OIDC)
- **Mechanism**: Bearer Token (JWT)
- **Roles**: `realm:admin`, `realm:compliance_officer`, `realm:captain`, `realm:operations`, `realm:regulator`.

## Modules & Endpoints

### 🚢 Vessels (`/vessels`)
| Method | Path | Summary | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/vessels` | Register a new vessel | admin, compliance_officer |
| GET | `/vessels` | List all vessels | captain, admin, operations, compliance_officer, regulator |
| GET | `/vessels/:id` | Get vessel details | captain, admin, operations, compliance_officer, regulator |
| PUT | `/vessels/:id` | Update vessel information | admin, compliance_officer, captain |
| GET | `/vessels/:id/documents` | Get vessel documents | admin, compliance_officer, captain |
| POST | `/vessels/:id/documents` | Upload vessel document | admin, compliance_officer, captain |

### 👥 Crew (`/crew`)
| Method | Path | Summary | Interceptors |
| :--- | :--- | :--- | :--- |
| POST | `/crew` | Add a new crew member | - |
| GET | `/crew` | List crew members with filters | BridgeSyncInterceptor |
| GET | `/crew/roster/:vesselId` | Get crew roster | BridgeSyncInterceptor |
| GET | `/crew/:id` | Get crew member details | - |
| PUT | `/crew/:id` | Update crew member info | - |

### 👮 CBP Reporting (`/cbp`)
| Method | Path | Summary | Roles |
| :--- | :--- | :--- | :--- |
| POST | `/cbp/vessel/:vesselId/submit-crew-list` | Submit I-418 or eNOAD | compliance_officer, admin |

### 📋 Compliance (`/compliance`)
| Method | Path | Summary | Roles |
| :--- | :--- | :--- | :--- |
| GET | `/compliance/inspections` | List vessel inspections | compliance_officer, admin, regulator |
| GET | `/compliance/dashboard` | Get dashboard overview | compliance_officer, admin |
| GET | `/compliance/reports` | List compliance reports | compliance_officer, admin, regulator |
| GET | `/compliance/export/crew-compliance/:vesselId` | Export compliance pack | compliance_officer, admin |
| POST | `/compliance/inspections` | Record an inspection | compliance_officer, admin |

### 📝 Audit (`/audit`)
| Method | Path | Summary | Notes |
| :--- | :--- | :--- | :--- |
| POST | `/audit` | Create audit log entry | Requires authenticated user |
| GET | `/audit` | Get audit log entries | Filterable by entity, action, user |
| GET | `/audit/exports` | Get data export history | For regulator review |

## Schemas
Refer to `data-models-database.md` for shared entity definitions.
