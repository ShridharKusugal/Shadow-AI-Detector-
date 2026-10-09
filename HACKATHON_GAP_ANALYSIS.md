# HACKATHON GAP ANALYSIS

## Overview
This document serves as the Phase 1 audit of the existing Shadow AI Detector repository against the official Hackathon requirements. 

## Dataset Audit
- **Official Dataset Status**: **MISSING**. The repository currently contains only `shadow_ai_events_synthetic.csv` and `shadow_ai_events_edge_cases.csv` in `data/sample/`. According to `data/sample/README.md`, these are 100% synthetically generated and do not represent real traffic or the official hackathon common evaluation dataset. 
- **Action Required**: Request the official supplied test dataset from the hackathon organizers. Until then, development will proceed using the synthetic dataset, but it cannot be used for the final official evaluation.

## Deliverable Status & Gap Mapping

### 1. Traffic-Analysis Module (Phase 2)
- **Status**: Mostly Implemented.
- **Evidence**: `backend/app/detection/` contains pipelines for normalizing domains, matching providers, evaluating policies, and scoring risk.
- **Gap**: We must ensure that the module conservatively handles deceptive domains and doesn't claim to decrypt HTTPS traffic, and strictly uses only available network metadata. Must verify the handling of "unknown" traffic classification as distinct from known AI or known benign traffic.

### 2. Provider Inventory Dashboard (Phase 3)
- **Status**: Partial / Deficient.
- **Evidence**: `frontend/src/pages/CatalogPage.tsx` displays the existing database of AI providers (the catalog), but fails to act as an actual "Inventory" of observed traffic.
- **Gap**: The current UI does NOT display:
  - Number of observed events per provider/endpoint.
  - Estimated usage.
  - First-seen and most-recently-seen timestamps.
- **Action Required**: Build a new aggregation endpoint in the backend and update the inventory dashboard to display these calculated fields.

### 3. Evaluation and Test Report (Phase 4)
- **Status**: Partial.
- **Evidence**: `backend/app/ml/train.py` creates a Random Forest model and outputs accuracy/precision/recall.
- **Gap**: Needs to generate a downloadable structured test report (CSV/JSON) containing metrics, confusion matrix, and class distributions evaluated strictly on the *official* dataset.

### 4. Dashboard Accuracy (Phase 5)
- **Status**: Built but contains violations.
- **Evidence**: `frontend/src/pages/DashboardPage.tsx`.
- **Gap (Critical)**: The dashboard currently hallucinates/fabricates data. 
  - **Fabricated Values**: The `Simulate Threat` button injects hardcoded alerts (e.g., "Claude 3.7 Sonnet High-Volume Code Push"). 
  - **Fake Math**: The timeline filter artificially mutates counts (e.g., `events * 0.42` for unapproved).
  - **Action Required**: Remove these hardcoded demonstration values and fake front-end math. All dashboard metrics must strictly query the backend.

### 5. Automated Tests (Phase 6)
- **Status**: Partial.
- **Evidence**: `backend/tests/test_e2e_full_workflow.py` tests the basic workflow.
- **Gap**: Missing specific acceptance tests for deceptive domains, missing timestamps, inventory aggregation math, and risk explanation boundaries.

## Dashboard Data Provenance (Real vs. Synthetic/Hardcoded)
- **Real Calculations**: Total Processed Events, Known AI Egress, Unapproved Shadow AI, Critical Alerts, Risk Severity Breakdown, AI Provider Share (derived from backend SQL queries on ingested data).
- **Hardcoded/Fake Values**: Live Threat Simulation (injects fake JSON objects into the alerts feed), Timeline Filter Math (modifies chart rendering using arbitrary multipliers like `0.42` and `0.28`).
- **Synthetic Benchmark Data**: All data currently processed originates from `shadow_ai_events_synthetic.csv`, which is an algorithmically generated benchmark, not actual telemetry.
