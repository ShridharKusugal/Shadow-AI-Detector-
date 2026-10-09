# Shadow AI Detector - Evaluation Report & Final Deliverables

## 1. Test Report & Model Metrics
This project utilizes a robust Random Forest classifier for identifying and classifying Shadow AI traffic vs. benign standard enterprise egress.

**Dataset Evaluation**:
Due to the absence of the official Hackathon dataset (as noted in `HACKATHON_GAP_ANALYSIS.md`), the evaluation was performed on the `data/sample/shadow_ai_events_synthetic.csv` dataset. The dataset consists of 3,400 events, split 75/25 for training/testing (Seed=42).

**Key Metrics (Test Split, n=850):**
- **Accuracy**: 98.71%
- **Precision**: 98.27% (High confidence on flagged alerts)
- **Recall**: 99.61% (Extremely low false negative rate for unapproved AI)
- **False Positive Rate**: 2.66%
- **F1-Score**: 98.93%

**Confusion Matrix**:
- True Negatives (TN): 329
- False Positives (FP): 9
- False Negatives (FN): 2
- True Positives (TP): 510

**Structured Output**:
The raw metrics and model configuration are strictly structured and persisted as JSON in `models/model_metadata.json`.

## 2. Reproducible Setup & Run Instructions
To reproduce the traffic-analysis pipeline and evaluation:

1. **Start the Database & APIs**:
   ```bash
   cd backend
   python -m venv venv
   # activate venv
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
2. **Train the Model & Generate Report**:
   ```bash
   cd backend
   python -m app.ml.train
   ```
   *This script generates `models/model_metadata.json` containing the evaluation.*
3. **Ingest the Dataset**:
   In the frontend, navigate to the Dashboard and click **"Ingest Benchmark"**, or run the ingestion API manually. This inserts the synthetic data through the detection engine, matching providers against the Catalog, generating alerts, and persisting `NetworkEvents` to MySQL.
4. **View the Provider Inventory**:
   Navigate to the **AI Provider & Endpoint Inventory** tab to see aggregated metrics (Observed Events, Estimated Outbound Usage, timestamps).

## 3. Limitations & Incomplete Items
- **HTTPS Decryption Limitation**: The tool relies strictly on destination domains, port metadata, and byte volume. It does not perform TLS interception. Financial usage or precise token counts are inherently unavailable from network traffic alone and are strictly excluded from the dashboard rather than being hallucinated.
- **Official Dataset Availability**: Fully evaluated on synthetic data due to the lack of an official hackathon dataset. Metrics do not represent validated accuracy in an unconstrained enterprise network.
- **Provider Catalog Comprehensiveness**: Tracking relies on a curated list of endpoints. Unknown/custom Shadow AI wrappers utilizing non-standard domains may be flagged as generic outliers but won't be definitively mapped to an AI provider until the Catalog is updated by an analyst.
