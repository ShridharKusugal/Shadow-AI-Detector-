# Shadow AI Detector - Synthetic & Edge Case Datasets

## Overview
This directory contains reproducible synthetic datasets generated for the **Shadow AI Detector** cybersecurity platform. 

> **CRITICAL LABELING & INTEGRITY RULE**
> All records, devices, timestamps, and network flows in these datasets are **100% synthetic**.
> Fictional device IDs (e.g. `DEV-ENG-101`) and synthetic timestamps are generated via Python using a fixed random seed (`seed=42`).
> No employee identities, proprietary prompts, company secrets, private network captures, or passwords are included.
> Expected labels are assigned algorithmically by the generator to evaluate catalog matching, policy evaluation, and machine learning models.
> **Synthetic benchmark results are NOT evidence of real-world cybersecurity efficacy.**

---

## Dataset Inventory

| File | Purpose | Total Rows | Valid Rows (Strict) |
|---|---|---|---|
| `shadow_ai_events_synthetic.csv` | Primary benchmark & demo dataset | 3400 | 3400 |
| `shadow_ai_events_edge_cases.csv` | Ingestion pipeline stress-testing & validation tests | 11 | 3 (8 invalid/anomalous) |
| `dataset_validation_report.json` | Programmatically generated validation metrics | - | - |

---

## Column Definitions

| Column | Type | Required? | Description |
|---|---|---|---|
| `event_id` | String | Yes | Unique event identifier (e.g., `EVT-SYN-00001`, `EVT-EDGE-001`). |
| `timestamp` | ISO-8601 String | Yes | UTC timestamp of the proxy / egress network connection. |
| `device_id` | String | Yes | Synthetic enterprise endpoint identifier (e.g. `DEV-MKT-104`). |
| `destination_domain` | String | Yes | Destination FQDN or hostname accessed via proxy egress (e.g. `chatgpt.com`, `cursor.sh`). |
| `connection_count` | Integer | Yes | Number of discrete TCP/TLS sessions established in the aggregation window. |
| `bytes_out` | Integer | Yes | Outbound egress payload volume in bytes. |
| `bytes_in` | Integer | Yes | Inbound response volume in bytes. |
| `protocol` | String | No | Application protocol (default: `HTTPS`). |
| `port` | Integer | No | Destination egress port (default: `443`). |
| `source_type` | String | No | Telemetry origin (`corporate_proxy`, `edr_telemetry`, `dns_firewall`, `cloud_gateway`). |
| `user_agent` | String | No | Optional HTTP client user-agent string. |
| `expected_provider_match` | String | Ground Truth | Algorithmic label: matched AI provider name or non-AI category. |
| `expected_approval_status` | String | Ground Truth | Algorithmic policy outcome (`approved`, `unapproved`, `requires_review`, `non_ai`, `unknown`). |
| `expected_review_label` | String | ML Target | Target for classification (`requires_security_review` vs benign/approved). |

---

## Status Distribution in Synthetic Dataset

```json
{
  "unapproved": 1378,
  "approved": 774,
  "requires_review": 540,
  "non_ai": 526,
  "unknown": 182
}
```

---

## Edge Case Scenarios in `shadow_ai_events_edge_cases.csv`

1. **`EVT-EDGE-001`**: Malformed ISO timestamp (`INVALID-2026-99-99T99:99:99`).
2. **`EVT-EDGE-002`**: Invalid domain format with spaces and URL scheme (`https://invalid domain with spaces.com`).
3. **`EVT-EDGE-003`**: Missing required `device_id` field.
4. **`EVT-EDGE-004`**: Missing required `destination_domain` field.
5. **`EVT-EDGE-005-DUP`**: Duplicate record with matching event ID testing deduplication logic.
6. **`EVT-EDGE-007`**: Negative byte counts and negative connection counts.
7. **`EVT-EDGE-008`**: Non-numeric connection count string (`many_connections`).
8. **`EVT-EDGE-009`**: Mixed uppercase letters and surrounding whitespace (`   CHATGPT.COM   `) testing normalization.
9. **`EVT-EDGE-010`**: Omission of optional metadata fields (`protocol`, `port`, `source_type`, `user_agent`).
10. **`EVT-EDGE-011`**: Extreme outbound data volume (450 MB outbound) representing potential large dataset exfiltration.

---

## How to Regenerate Datasets

Run the dataset generator from the project workspace:

```bash
python data/sample/generate_datasets.py
```

This will deterministically recreate both CSV files, the validation report, and this documentation file.

---

## How to Import via the Web Interface

1. Navigate to the **CSV Ingestion** page (`/upload`) in the Shadow AI Detector application.
2. Drag and drop `shadow_ai_events_synthetic.csv` or click **Browse Files**.
3. View the column validation preview and review pre-flight checks.
4. Click **Start Ingestion** to process the events through the live detection engine and persist them into MySQL.
5. Alternatively, on the **Dashboard** page (`/dashboard`), click **Load Synthetic Demo Data** to automatically ingest the benchmark sample in one click.
