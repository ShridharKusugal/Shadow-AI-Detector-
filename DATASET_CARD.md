# DATASET CARD: Shadow AI Synthetic Telemetry

## 1. Dataset Overview
- **Name**: Shadow AI Benchmark Dataset
- **Location**: `data/sample/shadow_ai_events_synthetic.csv` and `data/sample/shadow_ai_events_edge_cases.csv`
- **Format**: CSV (Network Egress Metadata)
- **Size**: 3,400 rows (primary benchmark) + 200 rows (edge cases)

## 2. Dataset Provenance and Availability
- **Origin**: 100% synthetically generated using a deterministic Python script (`data/sample/generate_datasets.py`) with a fixed seed (`seed=42`).
- **Official Hackathon Dataset**: **MISSING**. The required common evaluation dataset from the hackathon organizers was not provided in the environment. This synthetic dataset acts as a stand-in for development and pipeline validation.
- **Permitted Usage**: Pipeline development, functional testing, UI demonstration, and schema validation. **Not permitted for formal efficacy claims or real-world security evaluation.**

## 3. Data Schema & Labels
The dataset contains network proxy metadata with explicit ground-truth labels for evaluation:
- `timestamp`: UTC isoformat (e.g. `2024-10-09T08:00:00Z`)
- `device_id`: Obfuscated unique machine identifier
- `destination_domain`: The destination hostname (e.g. `api.openai.com`)
- `bytes_out` / `bytes_in`: Volumetric traffic in bytes
- `connection_count`: Number of multiplexed or distinct TCP/TLS connections

**Ground Truth (Evaluation labels)**:
- `expected_provider_match`: The AI service (or "None") it maps to.
- `expected_approval_status`: Expected organizational policy (approved, unapproved, requires_review).
- `expected_review_label`: Binary label (`requires_security_review` vs `standard_activity`) for ML training.

## 4. Known Limitations
- Does not contain full TLS certificate negotiation details (SNI is assumed extracted as `destination_domain`).
- Lacks HTTP request paths or application-layer payloads.
- Traffic volume (bytes) distributions are procedurally generated and may not perfectly map to the empirical burst shapes of real LLM streaming responses.
