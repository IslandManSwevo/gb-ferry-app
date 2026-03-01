# Grand Bahama Ferry - Platform User Guide

This guide provides a step-by-step operational flow for the Grand Bahama Ferry Crew Compliance & Regulatory Reporting platform.

## 1. Secure Authentication (Login)
*   **Access:** Navigate to the platform's sign-in page (integrated with Keycloak/NextAuth).
*   **Credentials:** Enter your corporate email and password.
*   **Security:** The system enforces Role-Based Access Control (RBAC). The interface automatically adapts based on your assigned role (e.g., `SUPERADMIN`, `CAPTAIN`, or `COMPLIANCE_OFFICER`).

## 2. The Command Center (Dashboard)
Upon login, users land on the **Compliance Command Center**, providing an immediate overview of fleet status.
*   **Real-Time Monitoring:** View "Next Departure Readiness," which automatically validates assigned crew against **Safe Manning (BMA R106)** requirements.
*   **Urgent Alerts:** Critical notifications for expiring STCW certificates or manning shortages are prioritized at the top.
*   **Weather Awareness:** A live weather widget provides harbor conditions (wind speed, wave height) critical for Bahamian ferry operations.

## 3. Document Management & AI Upload
Maintaining regulatory compliance is centered around the Vessel Document Registry.
*   **Navigate:** Select "Vessel Documents" from the sidebar.
*   **Initiate Upload:** Click the "Upload Document" button.
*   **Metadata Entry:** Fill in the document name, select the target vessel, and provide the expiry date.
*   **The Upload:** Drag and drop a PDF certificate (e.g., Safe Manning Certificate, Radio License).
*   **AI Extraction:** The platform employs an **AI Document Parsing engine** to automatically verify content, extract key dates, and link them to the vessel's compliance record.

## 4. Regulatory Reporting (CBP/BMA)
The platform facilitates mandatory maritime reporting:
*   **CBP Form I-418:** Generate and transmit electronic Crew Lists to US Customs and Border Protection (ACE eNOAD) directly from the "Regulatory Forms" menu.
*   **BMA Endorsements:** Track and verify Bahamas Maritime Authority endorsements to ensure all crew are legally cleared for their roles.

## 5. Platform Settings & Configuration
The **System Management Hub** is used to tailor the platform to organizational needs:
*   **Organization:** Configure the Maritime Authority name, headquarters (e.g., Nassau), and primary timezone.
*   **Users & Roster:** Onboard new staff members by dispatching email invites and assigning initial roles.
*   **Roles & Permissions:** Fine-tune feature-level access for each role (e.g., restricting CBP submission authority).
*   **Operational Security:** Set automated guardrails, such as "Automated CBP Submission" (96h before departure) or the "Emergency Fleet Suspension" for global lockdown.

## 6. Emergency Operations
In the event of an incident, the **"Emergency" button** in the header provides immediate access to:
*   **Updated SOPs:** Standard Operating Procedures for maritime incidents.
*   **Crew Muster Stations:** Real-time assignment data for emergency response.
*   **STCW Emergency Duties:** Quick-reference for crew emergency responsibilities.
