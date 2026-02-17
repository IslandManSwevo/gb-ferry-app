# GB Ferry Platform Overview

## Design & Brand Identity

This platform utilizes a **Maritime Tech** aesthetic, leveraging deep blues and glassmorphism to convey security and modern efficiency.

### Color Palette

- **Deep Ocean**: `#001529` (Backgrounds, Sidebar)
- **Mid Blue**: `#003a70` (Cards, Headers)
- **Highlight Blue**: `#1890ff` (Primary Buttons, Active States, Links)
- **Glass Effect**: `rgba(255, 255, 255, 0.15)` with `backdrop-filter: blur(10px)`

## System Modules

The platform is composed of several interconnected modules centered around core Operations and Compliance.

```mermaid
graph TD
    %% Styling
    classDef hub fill:#003a70,stroke:#1890ff,stroke-width:4px,color:white;
    classDef module fill:#001529,stroke:#0a4d8c,stroke-width:2px,color:white;
    classDef ext fill:#1890ff,stroke:#fff,stroke-width:1px,color:white;

    %% Nodes
    Core(GB Ferry Platform)

    subgraph Operations
        Pass[Passengers]
        Crew[Crew]
        Vessel[Vessels]
    end

    subgraph Compliance
        USCG[USCG Readiness]
        CBP[CBP Readiness]
        Audit[Audit Logs]
    end

    subgraph Security
        Auth[Authentication]
        Docs[Documents]
    end

    %% Connections
    Core --- Pass
    Core --- Crew
    Core --- Vessel
    Core --- Compliance
    Core --- Security

    USCG -.-> Core
    CBP -.-> Core

    %% Apply Styles
    class Core hub;
    class Pass,Crew,Vessel,USCG,CBP,Audit,Auth,Docs module;
```

## Module Descriptions

| Module         | Description                              | Brand Color Usage                     |
| :------------- | :--------------------------------------- | :------------------------------------ |
| **Passengers** | Manifest management, check-in flows.     | White cards on Deep Ocean background. |
| **Crew**       | Crew lists, certifications, scheduling.  | Mid Blue headers.                     |
| **Compliance** | USCG/CBP readiness, NOAD/APIS pipelines. | Highlight Blue for status indicators. |
| **Vessels**    | Ship management, maintenance logs.       | Glassmorphism panels.                 |
