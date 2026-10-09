"""
Dataset Generator & Validator for Shadow AI Detector.
Generates:
1. data/sample/shadow_ai_events_synthetic.csv (>=3,200 records with fixed seed 42)
2. data/sample/shadow_ai_events_edge_cases.csv (edge cases and malformed records)
3. data/sample/dataset_validation_report.json (automated validation results)
4. data/sample/README.md (comprehensive dataset documentation)
"""

import os
import json
import uuid
import random
import datetime
import pandas as pd
import numpy as np

def generate_datasets():
    random.seed(42)
    np.random.seed(42)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    catalog_path = os.path.join(script_dir, "..", "provider_catalog", "ai_providers.json")

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog_data = json.load(f)

    providers = catalog_data["providers"]
    non_ai_domains = catalog_data.get("known_non_ai_domains", [])

    # Map domains to providers and default policy
    ai_domain_pool = []
    for prov in providers:
        p_name = prov["name"]
        p_policy = prov.get("default_policy", {})
        status = p_policy.get("approval_status", "requires_review")
        weight = p_policy.get("risk_weight", 50)
        for dom in prov.get("domains", []):
            pattern = dom["pattern"]
            ai_domain_pool.append({
                "domain": pattern,
                "provider": p_name,
                "status": status,
                "weight": weight,
                "category": prov.get("category", "AI Service")
            })

    # Device pool across departments
    devices = []
    departments = ["ENG", "SEC", "MKT", "FIN", "HR", "SALES", "OPS", "EXEC"]
    for dept in departments:
        for i in range(1, 16):
            devices.append(f"DEV-{dept}-{100 + i}")

    # Generate 3,400 synthetic events
    start_time = datetime.datetime(2026, 9, 1, 8, 0, 0, tzinfo=datetime.timezone.utc)
    records = []

    # Distribution:
    # 40% unapproved AI services (shadow AI)
    # 25% approved AI services
    # 15% requires_review AI services
    # 15% non-AI destinations
    # 5% unknown destinations
    
    unapproved_ai = [d for d in ai_domain_pool if d["status"] == "unapproved"]
    approved_ai = [d for d in ai_domain_pool if d["status"] == "approved"]
    review_ai = [d for d in ai_domain_pool if d["status"] == "requires_review"]

    unknown_domains = [
        "prompt-enhancer-online.biz", "fast-transcribe-ai.io", "instant-summary-bot.net",
        "cloud-neural-render.xyz", "smart-assistant-login.top", "dev-helper-bot.app"
    ]

    for idx in range(1, 3401):
        # Time progression with random jitter
        time_offset_secs = random.randint(0, 30 * 24 * 3600)
        timestamp = (start_time + datetime.timedelta(seconds=time_offset_secs)).isoformat()
        device_id = random.choice(devices)
        source_type = random.choice(["corporate_proxy", "edr_telemetry", "dns_firewall", "cloud_gateway"])
        protocol = "HTTPS"
        port = 443

        roll = random.random()
        if roll < 0.40 and unapproved_ai:
            item = random.choice(unapproved_ai)
            domain = item["domain"]
            provider = item["provider"]
            status = "unapproved"
            review_label = "requires_security_review"
            conn_count = random.randint(5, 120)
            bytes_out = random.randint(15_000, 8_500_000)
            bytes_in = random.randint(45_000, 25_000_000)
        elif roll < 0.65 and approved_ai:
            item = random.choice(approved_ai)
            domain = item["domain"]
            provider = item["provider"]
            status = "approved"
            review_label = "approved_standard_activity"
            conn_count = random.randint(1, 60)
            bytes_out = random.randint(2_000, 1_200_000)
            bytes_in = random.randint(10_000, 8_000_000)
        elif roll < 0.80 and review_ai:
            item = random.choice(review_ai)
            domain = item["domain"]
            provider = item["provider"]
            status = "requires_review"
            review_label = "requires_security_review"
            conn_count = random.randint(3, 85)
            bytes_out = random.randint(5_000, 4_500_000)
            bytes_in = random.randint(25_000, 15_000_000)
        elif roll < 0.95:
            domain = random.choice(non_ai_domains)
            provider = "None (Known Non-AI)"
            status = "non_ai"
            review_label = "benign_non_ai"
            conn_count = random.randint(1, 40)
            bytes_out = random.randint(1_000, 500_000)
            bytes_in = random.randint(5_000, 5_000_000)
        else:
            domain = random.choice(unknown_domains)
            provider = "Unknown"
            status = "unknown"
            review_label = "requires_security_review" if random.random() < 0.7 else "benign_unknown"
            conn_count = random.randint(1, 15)
            bytes_out = random.randint(500, 1_000_000)
            bytes_in = random.randint(2_000, 3_000_000)

        # Realistic high outbound anomaly occasionally
        if random.random() < 0.05 and status in ["unapproved", "requires_review"]:
            bytes_out = random.randint(12_000_000, 75_000_000)

        # Optional user agents
        uas = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
            "curl/8.4.0",
            "Python-urllib/3.12",
            "VSCode-IDE/1.94.0"
        ]
        user_agent = random.choice(uas) if random.random() > 0.1 else ""

        records.append({
            "event_id": f"EVT-SYN-{idx:05d}",
            "timestamp": timestamp,
            "device_id": device_id,
            "destination_domain": domain,
            "connection_count": conn_count,
            "bytes_out": bytes_out,
            "bytes_in": bytes_in,
            "protocol": protocol,
            "port": port,
            "source_type": source_type,
            "user_agent": user_agent,
            "expected_provider_match": provider,
            "expected_approval_status": status,
            "expected_review_label": review_label
        })

    synthetic_df = pd.DataFrame(records)
    synthetic_path = os.path.join(script_dir, "shadow_ai_events_synthetic.csv")
    synthetic_df.to_csv(synthetic_path, index=False)
    print(f"Generated synthetic dataset: {synthetic_path} with {len(synthetic_df)} records.")

    # Generate edge-cases dataset
    edge_records = [
        # 1. Malformed timestamp
        {
            "event_id": "EVT-EDGE-001",
            "timestamp": "INVALID-2026-99-99T99:99:99",
            "device_id": "DEV-ENG-101",
            "destination_domain": "chatgpt.com",
            "connection_count": 10,
            "bytes_out": 50000,
            "bytes_in": 150000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "OpenAI",
            "expected_approval_status": "requires_review",
            "expected_review_label": "requires_security_review"
        },
        # 2. Invalid domain (spaces, protocol prefix, or invalid characters)
        {
            "event_id": "EVT-EDGE-002",
            "timestamp": "2026-09-10T12:00:00Z",
            "device_id": "DEV-FIN-102",
            "destination_domain": "https://invalid domain with spaces.com",
            "connection_count": 5,
            "bytes_out": 20000,
            "bytes_in": 80000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "None",
            "expected_approval_status": "unknown",
            "expected_review_label": "invalid_domain"
        },
        # 3. Empty required field (missing device_id)
        {
            "event_id": "EVT-EDGE-003",
            "timestamp": "2026-09-10T12:05:00Z",
            "device_id": "",
            "destination_domain": "claude.ai",
            "connection_count": 12,
            "bytes_out": 30000,
            "bytes_in": 120000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "Anthropic",
            "expected_approval_status": "approved",
            "expected_review_label": "approved_standard_activity"
        },
        # 4. Empty destination_domain
        {
            "event_id": "EVT-EDGE-004",
            "timestamp": "2026-09-10T12:10:00Z",
            "device_id": "DEV-MKT-103",
            "destination_domain": "",
            "connection_count": 2,
            "bytes_out": 1000,
            "bytes_in": 5000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "None",
            "expected_approval_status": "unknown",
            "expected_review_label": "missing_domain"
        },
        # 5. Duplicate record (identical event_id as #6)
        {
            "event_id": "EVT-EDGE-005-DUP",
            "timestamp": "2026-09-10T12:15:00Z",
            "device_id": "DEV-SEC-104",
            "destination_domain": "perplexity.ai",
            "connection_count": 15,
            "bytes_out": 95000,
            "bytes_in": 350000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "Perplexity AI",
            "expected_approval_status": "unapproved",
            "expected_review_label": "requires_security_review"
        },
        {
            "event_id": "EVT-EDGE-005-DUP",
            "timestamp": "2026-09-10T12:15:00Z",
            "device_id": "DEV-SEC-104",
            "destination_domain": "perplexity.ai",
            "connection_count": 15,
            "bytes_out": 95000,
            "bytes_in": 350000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "Perplexity AI",
            "expected_approval_status": "unapproved",
            "expected_review_label": "requires_security_review"
        },
        # 6. Negative bytes / invalid numeric values
        {
            "event_id": "EVT-EDGE-007",
            "timestamp": "2026-09-10T12:20:00Z",
            "device_id": "DEV-OPS-105",
            "destination_domain": "chatgpt.com",
            "connection_count": -5,
            "bytes_out": -1000,
            "bytes_in": 50000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "OpenAI",
            "expected_approval_status": "requires_review",
            "expected_review_label": "invalid_metrics"
        },
        # 7. Non-numeric connection count string
        {
            "event_id": "EVT-EDGE-008",
            "timestamp": "2026-09-10T12:25:00Z",
            "device_id": "DEV-HR-106",
            "destination_domain": "deepseek.com",
            "connection_count": "many_connections",
            "bytes_out": 12000,
            "bytes_in": 45000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "DeepSeek",
            "expected_approval_status": "unapproved",
            "expected_review_label": "requires_security_review"
        },
        # 8. Mixed capitalization and surrounding whitespace (valid after normalization)
        {
            "event_id": "EVT-EDGE-009",
            "timestamp": "2026-09-10T12:30:00Z",
            "device_id": "  DEV-SALES-107  ",
            "destination_domain": "   CHATGPT.COM   ",
            "connection_count": 8,
            "bytes_out": 42000,
            "bytes_in": 190000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "Mozilla/5.0",
            "expected_provider_match": "OpenAI",
            "expected_approval_status": "requires_review",
            "expected_review_label": "requires_security_review"
        },
        # 9. Missing optional fields (empty protocol, port, user_agent)
        {
            "event_id": "EVT-EDGE-010",
            "timestamp": "2026-09-10T12:35:00Z",
            "device_id": "DEV-EXEC-108",
            "destination_domain": "runwayml.com",
            "connection_count": 4,
            "bytes_out": 18000,
            "bytes_in": 85000,
            "protocol": "",
            "port": "",
            "source_type": "",
            "user_agent": "",
            "expected_provider_match": "Runway Gen-2/Gen-3",
            "expected_approval_status": "unapproved",
            "expected_review_label": "requires_security_review"
        },
        # 10. Extremely large volume (unusual but valid)
        {
            "event_id": "EVT-EDGE-011",
            "timestamp": "2026-09-10T12:40:00Z",
            "device_id": "DEV-ENG-109",
            "destination_domain": "huggingface.co",
            "connection_count": 1400,
            "bytes_out": 450_000_000,
            "bytes_in": 1_850_000_000,
            "protocol": "HTTPS",
            "port": 443,
            "source_type": "proxy",
            "user_agent": "git-lfs/3.4.0",
            "expected_provider_match": "Hugging Face",
            "expected_approval_status": "requires_review",
            "expected_review_label": "requires_security_review"
        }
    ]

    edge_df = pd.DataFrame(edge_records)
    edge_path = os.path.join(script_dir, "shadow_ai_events_edge_cases.csv")
    edge_df.to_csv(edge_path, index=False)
    print(f"Generated edge-cases dataset: {edge_path} with {len(edge_df)} records.")

    # Programmatic validation of both datasets
    validation_report = validate_datasets_programmatically(synthetic_df, edge_df)
    report_path = os.path.join(script_dir, "dataset_validation_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(validation_report, f, indent=2)
    print(f"Generated dataset validation report: {report_path}")

    # Generate README
    readme_path = os.path.join(script_dir, "README.md")
    write_dataset_readme(readme_path, validation_report)
    print(f"Generated dataset README documentation: {readme_path}")

def validate_datasets_programmatically(synthetic_df, edge_df):
    report = {
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "random_seed": 42,
        "datasets": {
            "synthetic_dataset": analyze_df(synthetic_df, "shadow_ai_events_synthetic.csv"),
            "edge_cases_dataset": analyze_df(edge_df, "shadow_ai_events_edge_cases.csv")
        },
        "critical_disclaimer": "All dataset records are synthetic and reproducible. Labels are algorithmic ground-truth for testing detection logic and ML baselines; they are NOT real security telemetry or evidence of actual employee misconduct."
    }
    return report

def analyze_df(df, name):
    total = len(df)
    cols = list(df.columns)
    
    # Check duplicate event_ids
    dup_ids = df[df.duplicated(subset=["event_id"], keep=False)]["event_id"].unique().tolist()
    
    # Check nulls in required fields
    required = ["event_id", "timestamp", "device_id", "destination_domain"]
    null_counts = {col: int(df[col].isna().sum()) + int((df[col] == "").sum()) for col in required if col in df.columns}
    
    # Check numeric validity
    invalid_nums = 0
    for idx, row in df.iterrows():
        try:
            c = float(row.get("connection_count", 0))
            bo = float(row.get("bytes_out", 0))
            bi = float(row.get("bytes_in", 0))
            if c < 0 or bo < 0 or bi < 0:
                invalid_nums += 1
        except (ValueError, TypeError):
            invalid_nums += 1

    # Check timestamps
    invalid_ts = 0
    for ts in df.get("timestamp", []):
        try:
            datetime.datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except (ValueError, TypeError):
            invalid_ts += 1

    # Class distribution
    status_counts = df["expected_approval_status"].value_counts().to_dict() if "expected_approval_status" in df.columns else {}

    return {
        "filename": name,
        "total_records": total,
        "columns": cols,
        "duplicate_event_ids": dup_ids,
        "empty_required_fields_count": null_counts,
        "invalid_numeric_values_count": invalid_nums,
        "invalid_timestamp_count": invalid_ts,
        "status_distribution": {k: int(v) for k, v in status_counts.items()}
    }

def write_dataset_readme(path, report):
    content = f"""# Shadow AI Detector - Synthetic & Edge Case Datasets

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
| `shadow_ai_events_synthetic.csv` | Primary benchmark & demo dataset | {report['datasets']['synthetic_dataset']['total_records']} | {report['datasets']['synthetic_dataset']['total_records']} |
| `shadow_ai_events_edge_cases.csv` | Ingestion pipeline stress-testing & validation tests | {report['datasets']['edge_cases_dataset']['total_records']} | 3 (8 invalid/anomalous) |
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
{json.dumps(report['datasets']['synthetic_dataset']['status_distribution'], indent=2)}
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
"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    generate_datasets()
