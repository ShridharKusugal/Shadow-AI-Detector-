# SECURITY, THREAT MODEL & LIMITATIONS

## 1. Metadata Boundaries & Privacy
The Shadow AI Detector operates strictly on **Network Egress Metadata** (DNS resolutions, Firewall connections, Proxy logs).
- **No TLS Decryption (No MITM)**: The application does NOT decrypt HTTPS traffic. It does NOT extract prompts, user credentials, or AI-generated responses.
- **Privacy Safe**: By relying solely on metadata (SNI, IPs, bytes, timestamps), it preserves employee content privacy while enforcing corporate acceptable-use policies.

## 2. Detection Limitations
- **Proxied or Wrapped Traffic**: Shadow AI services hosted behind generic enterprise infrastructure (e.g., a custom AWS API Gateway, Vercel apps, internal VPNs) cannot be distinguished from standard web traffic unless their specific destination domains are added to the Catalog.
- **Token / Financial Cost Estimation**: Because payloads are encrypted, it is mathematically impossible to perfectly calculate API "tokens used" or "financial cost" from bytes. The dashboard deliberately reports "Estimated Usage (Outbound Bytes)" instead of hallucinating token counts.
- **Local Inference Detection**: Detection of local models (e.g., Ollama) relies strictly on network telemetry to designated ports (e.g., `localhost:11434`) or identifiable model registries (e.g., `huggingface.co`). If local models are entirely air-gapped without network telemetry, they will not be detected.

## 3. Application Threat Model
- **Unauthorized Catalog Modification**: If an attacker gains admin access, they could manipulate the `ai_providers` catalog to whitelist malicious destinations or blacklist benign services. Role-based access control (Admin vs. Analyst) mitigates this.
- **Log Forgery**: The pipeline assumes upstream log sources (firewalls/proxies) are immutable. Forged CSV ingestion could poison the ML model or create false alerts.
- **CSV Formula Injection**: Uploaded CSV files containing Excel formulas (e.g., starting with `=`) are sanitized during ingestion to prevent CSV injection attacks in downstream exports.

## 4. Current Readiness Limitations
- As documented in `HACKATHON_GAP_ANALYSIS.md`, the platform is functionally complete but currently relies on **synthetic benchmark data** due to the absence of the official hackathon dataset. Real-world validation remains outstanding.
