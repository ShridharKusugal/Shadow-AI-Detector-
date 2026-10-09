# Shadow AI Detector

### AI-Powered Cybersecurity Monitoring, Shadow AI Discovery and Risk Assessment Platform

Built for the **24-Hour National-Level AI Hackathon**.

Shadow AI Detector is an enterprise-grade cybersecurity platform that uncovers unsanctioned artificial intelligence services across corporate networks, evaluates organizational policy compliance, scores data-exfiltration risks, and assists security analysts in incident triage with transparent explainability and machine learning models.

---

## 1. High-Level Architecture

```
[ Network Egress Telemetry (CSV / Proxy Logs) ]
                       │
                       ▼
         [ Input Validation & Normalization ]
                       │
                       ▼
       [ AI Provider Catalog & Domain Matcher ]
                       │
                       ▼
       [ Corporate Governance Policy Evaluator ]
                       │
                       ▼
       [ Behavioral Feature Extraction Engine ]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
[ 0-100 Transparent ]     [ scikit-learn ML ]
[ Risk Scorer Model ]     [ Random Forest   ]
          └────────────┬────────────┘
                       ▼
      [ Explainability & Recommendations ]
                       │
                       ▼
      [ MySQL 8.0 Relational Persistence ]
        (Events, Assessments, Alerts, Logs)
                       │
                       ▼
     [ Interactive React + Vite Dashboard ]
```

---

## 2. Technology Stack

### Frontend
- **React 19 & TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **Framer Motion** (Page transitions & card interactions)
- **Recharts** (Threat trends, provider shares, risk distributions)
- **Lucide React** (Cybersecurity iconography)
- **React Router v7**

### Backend
- **Python 3.14**
- **FastAPI & Uvicorn**
- **Pydantic v2 & Pydantic-Settings**
- **SQLAlchemy 2.0 (ORM) & Alembic (Migrations)**
- **PyMySQL** with connection pooling & transaction management
- **pandas, NumPy & scikit-learn**
- **joblib** (Model serialization)
- **PyJWT & bcrypt** (Authentication & RBAC)

### Database
- **MySQL 8.0.39** running on `localhost:3306`
- Database: `shadow_ai_detector`
- UTF8MB4 charset, foreign keys, cascade deletes, indexed lookups

---

## 3. Database Architecture & Models

| Model | Table | Purpose |
|---|---|---|
| `User` | `users` | Role-Based Access Control (`admin`, `analyst`, `viewer`). Password hashed via bcrypt. |
| `IngestionBatch` | `ingestion_batches` | File hash deduplication, row-level valid/invalid counts, JSON validation report. |
| `AIProvider` | `ai_providers` | Catalog of AI vendors (OpenAI, Anthropic, Google, DeepSeek, Cursor, etc.). |
| `ProviderDomain` | `provider_domains` | Exact and subdomain matching patterns with verification sources. |
| `PolicyRule` | `policy_rules` | Approval status (`approved`, `unapproved`, `requires_review`), risk weights, versioning. |
| `NetworkEvent` | `network_events` | Granular network telemetry (timestamp, device, domain, byte counts, sessions). |
| `RiskAssessment` | `risk_assessments` | Itemized 0-100 risk score, detection reasons, missing evidence limits, ML signal. |
| `Alert` | `alerts` | Actionable security incidents requiring analyst triage (`open`, `in_review`, `confirmed_violation`, etc.). |
| `Investigation` | `investigations` | Persistent analyst notes, status transition history, timestamped audit log. |
| `AuditLog` | `audit_logs` | Immutable compliance trail of all policy edits and administrative actions. |
| `ModelEvaluation` | `model_evaluations` | Historical experiment records: precision, recall, F1-score, confusion matrix. |

---

## 4. Curated Datasets & Synthetic Benchmarks

Datasets are deterministically generated via `python data/sample/generate_datasets.py` (`seed=42`):

1. **`data/sample/shadow_ai_events_synthetic.csv`** (3,400 records)
   - Realistic network traffic distribution: 40% unapproved AI, 25% approved AI, 15% requires-review AI, 15% benign non-AI, 5% unknown destinations.
   - Outbound and inbound byte volumes, connection velocity, device IDs across 8 departments (`DEV-ENG`, `DEV-SEC`, `DEV-FIN`, etc.).
2. **`data/sample/shadow_ai_events_edge_cases.csv`** (11 records)
   - Malformed ISO timestamps, invalid domains with spaces/schemes, missing required fields, duplicates, negative byte counts, extreme egress anomalies.
3. **`data/sample/dataset_validation_report.json`**
   - Automated programmatic verification of schema conformity, row counts, and error tallies.

> **CRITICAL DISCLOSURE**: All dataset records and labels are **100% synthetic**. Expected labels are algorithmic ground-truth created to benchmark the detection engine and ML baseline. **Synthetic benchmark results are NOT evidence of real-world cybersecurity efficacy or employee misconduct.**

---

## 5. Machine Learning Evaluation

The platform includes a reproducible scikit-learn classifier pipeline (`backend/app/ml/train.py`):

- **Target**: `requires_security_review` (1) vs `standard_benign_activity` (0)
- **Features**: `outbound_mb`, `inbound_mb`, `connection_count`, `byte_ratio`, `domain_entropy`, `is_ai_service`, `policy_risk_weight`
- **Split**: 75% Train (n=2550), 25% Test (n=850), stratified, `random_state=42`

### Genuine Test Split Benchmark Results

| Metric | Primary Model (Random Forest) | Comparison (Logistic Regression) |
|---|---|---|
| **Accuracy** | **98.71%** | 98.71% |
| **Precision** | **98.27%** | 97.90% |
| **Recall** | **99.61%** | 100.00% |
| **F1-Score** | **98.93%** | 98.94% |
| **False Positive Rate** | **2.66%** | 3.25% |

#### Test Split Confusion Matrix
```
                    Predicted Negative    Predicted Positive
Actual Negative            329 (TN)               9 (FP)
Actual Positive              2 (FN)             510 (TP)
```

The fitted model artifact is saved via joblib at `models/shadow_ai_detector_rf.joblib` and is served via the live prediction endpoint `POST /api/v1/ml/predict`.

---

## 6. End-to-End Workflow Verification

A comprehensive 13-step lifecycle test (`backend/tests/test_e2e_full_workflow.py`) was executed on the live MySQL database:

1. **Initialize Application**: SQLAlchemy tables and initial provider seed loaded.
2. **Connect to MySQL**: Verified MySQL 8.0.39 connection on `shadow_ai_detector`.
3. **Locate Dataset**: 3,400 synthetic events loaded.
4. **Ingest Stream**: Processed batch `BATCH-E65E8ACD1337`.
5. **Validate Records**: 3,400 rows validated and committed to MySQL.
6. **Provider Match**: 2,552 events matched to recognized AI catalog providers.
7. **Policy Evaluation**: 1,378 unapproved Shadow AI violations flagged.
8. **Risk Scoring**: 0-100 risk scores calculated with itemized points breakdown.
9. **Persistence**: 3,400 events, 3,400 assessments, and 1,949 alerts saved in MySQL.
10. **Dashboard Aggregation**: Live metrics match database records exactly.
11. **Investigation Note**: Alert assigned to analyst and triage note recorded.
12. **Simulate Application Restart**: Database session closed and engine pool disposed.
13. **Assert Persistence**: Reconnected and confirmed all 3,400 events, alerts, and investigation history survived the restart without data loss.

---

## 7. Setup & Execution Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.14.4)
- Node.js 18+ (tested on Node v24.15.0)
- MySQL Server 8.x running on `localhost:3306`

### 1. Database Configuration
Copy `.env.example` to `backend/.env` and enter your MySQL credentials:
```bash
# In backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shadow_ai_detector
```

### 2. Run Database Migrations & Initial Seed
```bash
# From project root
alembic upgrade head
python -c "import sys; sys.path.insert(0, 'backend'); from app.database.session import SessionLocal; from app.database.init_db import init_db; db=SessionLocal(); init_db(db); db.close()"
```

### 3. Generate Datasets & Train ML Baseline
```bash
python data/sample/generate_datasets.py
python backend/app/ml/train.py
```

### 4. Run Automated Test Suite
```bash
pytest backend/tests
python backend/tests/test_e2e_full_workflow.py
```

### 5. Start the Application

**Terminal 1 (Backend - FastAPI)**:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
- API Documentation available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Terminal 2 (Frontend - React + Vite)**:
```bash
cd frontend
npm run dev
```
- Interactive Web Application available at: [http://localhost:5173](http://localhost:5173)

### Demo Login Accounts
| Role | Username | Password |
|---|---|---|
| **Administrator** | `admin` | `AdminSecure2026!` |
| **Security Analyst** | `analyst` | `AnalystSecure2026!` |
| **Auditor / Viewer** | `viewer` | `ViewerSecure2026!` |

---

## 8. Security Engineering & OWASP Compliance

1. **Credential Hygiene**: No database passwords or secrets committed to source control. `.env` is git-ignored and sanitized `.env.example` is provided.
2. **CSV Formula Injection Defense**: All exported cells starting with `=`, `+`, `-`, or `@` are sanitized with quote prefixes.
3. **Role Enforcement**: Every administrative endpoint (`/policy`, `/catalog`, `/ingestion/upload`) is guarded by server-side FastAPI role dependencies.
4. **Defensive Disclosures**: The platform explicitly informs analysts that standard TLS metadata does **not** reveal decrypted prompt payloads without TLS forward proxies.
