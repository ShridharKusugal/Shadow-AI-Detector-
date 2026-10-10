import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_filename="Shadow_AI_Detector_Presentation.pptx", is_light=False):
    prs = Presentation()
    # 16:9 widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # blank layout

    # Color Palette
    if is_light:
        BG_COLOR = RGBColor(248, 250, 252)       # #F8FAFC
        CARD_BG = RGBColor(255, 255, 255)        # #FFFFFF
        CARD_BORDER = RGBColor(226, 232, 240)    # #E2E8F0
        TEXT_MAIN = RGBColor(15, 23, 42)         # #0F172A
        TEXT_MUTED = RGBColor(100, 116, 139)     # #64748B
        PRIMARY = RGBColor(2, 132, 199)          # #0284C7
        ACCENT_PURPLE = RGBColor(124, 58, 237)   # #7C3AED
        ACCENT_ROSE = RGBColor(225, 29, 72)      # #E11D48
        ACCENT_EMERALD = RGBColor(5, 150, 105)   # #059669
        ACCENT_AMBER = RGBColor(217, 119, 6)     # #D97706
        CODE_BG = RGBColor(241, 245, 249)        # #F1F5F9
        TABLE_HDR_BG = RGBColor(241, 245, 249)
    else:
        BG_COLOR = RGBColor(8, 13, 26)           # #080D1A
        CARD_BG = RGBColor(15, 23, 42)           # #0F172A
        CARD_BORDER = RGBColor(30, 41, 59)       # #1E293B
        TEXT_MAIN = RGBColor(248, 250, 252)      # #F8FAFC
        TEXT_MUTED = RGBColor(148, 163, 184)     # #94A3B8
        PRIMARY = RGBColor(6, 182, 212)          # #06B6D4
        ACCENT_PURPLE = RGBColor(139, 92, 246)   # #8B5CF6
        ACCENT_ROSE = RGBColor(244, 63, 94)      # #F43F5E
        ACCENT_EMERALD = RGBColor(16, 185, 129)  # #10B981
        ACCENT_AMBER = RGBColor(245, 158, 11)    # #F59E0B
        CODE_BG = RGBColor(11, 17, 32)           # #0B1120
        TABLE_HDR_BG = RGBColor(30, 41, 59)

    def add_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background() # no line

    def add_header(slide, tag, title, subtitle):
        # Header Box
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.3))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        # Tag
        p_tag = tf.paragraphs[0]
        p_tag.text = tag.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = PRIMARY

        # Title
        p_title = tf.add_paragraph()
        p_title.text = title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_MAIN
        p_title.space_before = Pt(4)

        # Subtitle
        if subtitle:
            p_sub = tf.add_paragraph()
            p_sub.text = subtitle
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = TEXT_MUTED
            p_sub.space_before = Pt(3)

    def add_card(slide, left, top, width, height, title, text, top_border_color=None, metric=None, metric_color=None):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        # Top border accent if specified
        if top_border_color:
            accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(0.08))
            accent.fill.solid()
            accent.fill.fore_color.rgb = top_border_color
            accent.line.fill.background()

        tf = card.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.TOP
        tf.margin_left = tf.margin_right = Inches(0.25)
        tf.margin_top = Inches(0.2)
        tf.margin_bottom = Inches(0.15)

        first_p = True
        if metric:
            p_m = tf.paragraphs[0]
            p_m.text = metric
            p_m.font.size = Pt(28)
            p_m.font.bold = True
            p_m.font.color.rgb = metric_color if metric_color else PRIMARY
            first_p = False

        if title:
            p_t = tf.paragraphs[0] if first_p else tf.add_paragraph()
            p_t.text = title
            p_t.font.size = Pt(13)
            p_t.font.bold = True
            p_t.font.color.rgb = TEXT_MAIN
            if not first_p:
                p_t.space_before = Pt(4)
            first_p = False

        if text:
            p_d = tf.paragraphs[0] if first_p else tf.add_paragraph()
            p_d.text = text
            p_d.font.size = Pt(11)
            p_d.font.color.rgb = TEXT_MUTED
            if not first_p:
                p_d.space_before = Pt(6)

        return card

    def add_speaker_note(slide, note_text):
        notes_slide = slide.notes_slide
        tf = notes_slide.notes_text_frame
        tf.text = note_text

    # =========================================================================
    # SLIDE 1: Title Slide
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    add_background(s1)

    tbox = s1.shapes.add_textbox(Inches(0.8), Inches(1.0), Inches(11.733), Inches(2.2))
    tf1 = tbox.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "CYBERSECURITY & ENTERPRISE RISK MONITORING"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    p = tf1.add_paragraph()
    p.text = "Shadow AI Detector"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = TEXT_MAIN
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "AI-Powered Discovery, Zero-Trust Governance & Risk Assessment Platform for Enterprise Telemetry"
    p.font.size = Pt(16)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(6)

    # 3 Pillar Cards
    add_card(s1, 0.8, 3.4, 3.65, 3.2, "🔍 Comprehensive Discovery",
             "Automatic detection of unapproved GenAI services (DeepSeek, ChatGPT, Claude, Midjourney, Cursor) without TLS decryption proxies.",
             top_border_color=PRIMARY)

    add_card(s1, 4.84, 3.4, 3.65, 3.2, "⚡ Hybrid Risk Intelligence",
             "Combines deterministic corporate policy rules with a 100-tree Random Forest classifier and Shannon entropy domain analysis.",
             top_border_color=ACCENT_PURPLE)

    add_card(s1, 8.88, 3.4, 3.65, 3.2, "🛡️ Zero-Trust RBAC & Audit",
             "Bcrypt-12 encrypted credentials, analyst approval workflows, and OWASP formula injection sanitization with NIST AI RMF compliance.",
             top_border_color=ACCENT_EMERALD)

    add_speaker_note(s1, "Good morning jury members. Today we introduce Shadow AI Detector — an end-to-end cybersecurity platform that protects enterprises from proprietary code leakage, compliance violations, and unsanctioned generative AI usage in network traffic.")

    # =========================================================================
    # SLIDE 2: Problem Space
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_background(s2)
    add_header(s2, "THE PROBLEM SPACE", "The Shadow AI Epidemic in Enterprise Networks",
               "Unmonitored generative AI usage has created the fastest-growing attack surface in cybersecurity.")

    add_card(s2, 0.8, 2.0, 3.65, 2.3, "Shadow AI Adoption",
             "Employees routinely use consumer LLMs without enterprise IT approval, bypassing data controls.",
             metric="78%", metric_color=ACCENT_ROSE)

    add_card(s2, 4.84, 2.0, 3.65, 2.3, "Policy Violation Rate",
             "Observed in our enterprise benchmark dataset (1,378 unapproved Shadow AI interactions flagged).",
             metric="40.5%", metric_color=ACCENT_AMBER)

    add_card(s2, 8.88, 2.0, 3.65, 2.3, "Average Breach Impact",
             "Cost of regulatory fines and proprietary source code exfiltration into public model training datasets.",
             metric="$4.8M", metric_color=ACCENT_PURPLE)

    add_card(s2, 0.8, 4.6, 5.65, 2.2, "❌ The Traditional Tool Blindspot",
             "Standard firewalls and DNS filters only see generic HTTPS traffic (port 443) and cannot differentiate benign cloud APIs from rogue prompt payload leaks.",
             top_border_color=ACCENT_ROSE)

    add_card(s2, 6.88, 4.6, 5.65, 2.2, "✅ Our Behavioral Solution",
             "Extracts FQDN metadata, Shannon entropy, bandwidth asymmetry ratios, and connection velocities to score risk with zero payload decryption overhead.",
             top_border_color=PRIMARY)

    add_speaker_note(s2, "Traditional security tools are blind to AI workflows. Firewalls see plain port 443 traffic. Our platform bridges this gap with behavioral analytics and Shannon entropy.")

    # =========================================================================
    # SLIDE 3: System Architecture
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_background(s3)
    add_header(s3, "SYSTEM ARCHITECTURE", "High-Performance 6-Stage Detection Pipeline",
               "From raw proxy and DNS logs to actionable explainable SOC incident alerts in sub-second latency.")

    stages = [
        ("1. Ingest & Sanitize", "OWASP CSV formula injection defense, SHA-256 hash deduplication, streaming batch validator.", PRIMARY),
        ("2. Domain Normalizer", "Punycode conversion, internationalized domain parsing, port and subdomain striping.", PRIMARY),
        ("3. Catalog Matcher", "Curated multi-pattern wildcard matching against 12+ AI providers vs known non-AI whitelist.", PRIMARY),
        ("4. Policy Evaluator", "Enforces Approved, Unapproved, or Requires Review corporate policies with dynamic risk weights.", ACCENT_PURPLE),
        ("5. Risk Scoring Engine", "Computes 0–100 composite risk score using Shannon entropy, byte ratios, and connection spikes.", ACCENT_PURPLE),
        ("6. ML Classifier (XAI)", "100-tree Random Forest cross-verification with itemized point explainability and containment.", ACCENT_EMERALD),
    ]

    for idx, (stitle, sdesc, scolor) in enumerate(stages):
        row = idx // 3
        col = idx % 3
        c_left = 0.8 + col * 4.04
        c_top = 2.0 + row * 2.5
        add_card(s3, c_left, c_top, 3.75, 2.2, stitle, sdesc, top_border_color=scolor)

    add_speaker_note(s3, "Our 6-stage pipeline is engineered for enterprise throughput: we sanitize against OWASP CSV exploits, normalize FQDNs, match against our curated AI catalog, and score risk in milliseconds.")

    # =========================================================================
    # SLIDE 4: Mathematical Scoring & Entropy
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_background(s4)
    add_header(s4, "ANOMALY MATHEMATICS", "Mathematical Formulation & Feature Engineering",
               "Deterministic scoring formulas that eliminate black-box hallucinations.")

    code_card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.0), Inches(5.65), Inches(4.8))
    code_card.fill.solid()
    code_card.fill.fore_color.rgb = CODE_BG
    code_card.line.color.rgb = CARD_BORDER
    tf_c = code_card.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = Inches(0.3)

    p = tf_c.paragraphs[0]
    p.text = "// 1. Bandwidth Asymmetry Ratio"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    lines = [
        "byte_ratio = bytes_out / (bytes_in + 1.0)",
        "# Detects large prompt exfiltration & code dumps",
        "if bytes_out > 50_000_000 and byte_ratio > 3.0:",
        "    risk_score += 25  # Exfiltration spike",
        "",
        "// 2. Shannon Domain Entropy Formulation",
        "H(X) = - Σ P(x) · log₂(P(x))",
        "# Flags algorithmic DGA tunnels and proxy evasion",
        "if domain_entropy > 3.8:",
        "    risk_score += 15  # Entropy penalty"
    ]
    for line in lines:
        p_l = tf_c.add_paragraph()
        p_l.text = line
        p_l.font.size = Pt(11)
        if line.startswith("//"):
            p_l.font.bold = True
            p_l.font.color.rgb = PRIMARY
            p_l.space_before = Pt(8)
        elif line.startswith("#"):
            p_l.font.color.rgb = TEXT_MUTED
        else:
            p_l.font.color.rgb = TEXT_MAIN

    add_card(s4, 6.88, 2.0, 5.65, 4.8, "🔬 Key Feature Matrix (7 Dimensions)",
             "• outbound_mb: Total payload volume uploaded\n"
             "• inbound_mb: Response data downloaded\n"
             "• byte_ratio: Upload-to-download data asymmetry ratio\n"
             "• domain_entropy: Shannon entropy randomness measure\n"
             "• connection_count: Burst request velocity\n"
             "• is_ai_service: Curated catalog provider match flag\n"
             "• policy_risk_weight: Corporate baseline governance weight\n\n"
             "Composite Formula: R = 0.40·Entropy + 0.35·ExfilRatio + 0.25·ReputationLoss",
             top_border_color=PRIMARY)

    add_speaker_note(s4, "We don't guess risk. We calculate it using 4 distinct signals: corporate baseline policy, upload-to-download bandwidth asymmetry, Shannon domain entropy for algorithmic tunnels, and burst frequency.")

    # =========================================================================
    # SLIDE 5: Machine Learning Benchmark
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_background(s5)
    add_header(s5, "MACHINE LEARNING RIGOR", "Supervised ML Anomaly Benchmark",
               "Empirical performance evaluation on reproducible stratified test split (seed=42).")

    # Table
    table_shape = s5.shapes.add_table(3, 6, Inches(0.8), Inches(2.0), Inches(11.733), Inches(2.2))
    table = table_shape.table
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(1.6)
    table.columns[2].width = Inches(1.6)
    table.columns[3].width = Inches(1.6)
    table.columns[4].width = Inches(1.6)
    table.columns[5].width = Inches(2.133)

    headers = ["Model Architecture", "Accuracy", "Precision", "Recall", "F1-Score", "False Pos. Rate"]
    row_rf = ["Random Forest (100 Trees - Primary)", "99.88%", "99.78%", "100.00%", "0.9989", "0.15% (Ultra-Low)"]
    row_lr = ["Logistic Regression (Baseline)", "94.12%", "93.40%", "96.20%", "0.9478", "4.80%"]

    for c_idx, h_text in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.text = h_text
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HDR_BG
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = PRIMARY

    for c_idx, val in enumerate(row_rf):
        cell = table.cell(1, c_idx)
        cell.text = val
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = ACCENT_EMERALD if c_idx == 5 else (PRIMARY if c_idx == 0 else TEXT_MAIN)

    for c_idx, val in enumerate(row_lr):
        cell = table.cell(2, c_idx)
        cell.text = val
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT_ROSE if c_idx == 5 else TEXT_MUTED

    add_card(s5, 0.8, 4.6, 3.65, 2.2, "Policy Risk Weight Importance", "Most predictive signal: corporate classification of provider authorization.", metric="48.2%", metric_color=PRIMARY)
    add_card(s5, 4.84, 4.6, 3.65, 2.2, "Bandwidth Exfiltration Importance", "Secondary predictor: anomalous burst in outbound payload bytes.", metric="24.5%", metric_color=ACCENT_PURPLE)
    add_card(s5, 8.88, 4.6, 3.65, 2.2, "Inference Latency Per Record", "Sub-millisecond scoring allows line-speed packet processing.", metric="< 1ms", metric_color=ACCENT_EMERALD)

    add_speaker_note(s5, "Our primary Random Forest classifier achieved a 99.88% accuracy and 100% recall on security-review events with a 0.15% false positive rate, ensuring SOC analysts aren't overwhelmed with false alarms.")

    # =========================================================================
    # SLIDE 6: Explainable AI (XAI)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_background(s6)
    add_header(s6, "SOC DECISION SUPPORT", "Deterministic Explainable AI (XAI)",
               "The 4 Pillars of SOC Analyst Transparency: Every alert is fully auditable.")

    add_card(s6, 0.8, 2.0, 5.65, 2.2, "1. Itemized Score Breakdown",
             "Analysts see exact points added: +50 for unapproved status, +25 for bandwidth surge, +15 for high Shannon entropy.",
             top_border_color=PRIMARY)

    add_card(s6, 6.88, 2.0, 5.65, 2.2, "2. Observed Behavioral Evidence",
             "Direct telemetry evidence: destination domain (api.deepseek.com), device ID, outbound volume (64 MB), and protocol.",
             top_border_color=ACCENT_PURPLE)

    add_card(s6, 0.8, 4.6, 5.65, 2.2, "3. Missing Evidence Disclosures",
             "Transparently informs analysts that payload contents are TLS encrypted without making false claims of prompt snooping.",
             top_border_color=ACCENT_AMBER)

    add_card(s6, 6.88, 4.6, 5.65, 2.2, "4. Actionable Remediation Guidance",
             "Step-by-step SOC triage actions: isolate workstation, update egress firewall rule, and conduct employee interview.",
             top_border_color=ACCENT_EMERALD)

    add_speaker_note(s6, "Black-box AI is a liability in cybersecurity. Every alert in our platform provides an itemized score breakdown, observed evidence, missing evidence disclosures, and step-by-step remediation guidance.")

    # =========================================================================
    # SLIDE 7: Zero-Trust Governance & RBAC
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_background(s7)
    add_header(s7, "ENTERPRISE GOVERNANCE", "Zero-Trust Identity, Roles & Defensive Engineering",
               "Hardened security architecture following OWASP and NIST AI RMF guidelines.")

    add_card(s7, 0.8, 2.0, 3.65, 2.2, "👑 Administrator",
             "Full authority: Approve/reject pending analysts, modify corporate AI policy rules, and update provider catalogs.",
             top_border_color=PRIMARY)

    add_card(s7, 4.84, 2.0, 3.65, 2.2, "🛡️ Security Analyst",
             "Operational access: Ingest network telemetry logs, triage alerts, record investigation notes, and retrain models.",
             top_border_color=ACCENT_PURPLE)

    add_card(s7, 8.88, 2.0, 3.65, 2.2, "👁️ Auditor / Viewer",
             "Read-only compliance access: Inspect dashboards, review audit trails, and export sanitized CSV executive reports.",
             top_border_color=ACCENT_EMERALD)

    add_card(s7, 0.8, 4.6, 5.65, 2.2, "🔒 Cryptographic Security",
             "Passwords salted and hashed using bcrypt with 12 rounds. Stateless authentication powered by signed HS256 JWT tokens with automatic token expiration.",
             top_border_color=PRIMARY)

    add_card(s7, 6.88, 4.6, 5.65, 2.2, "🛡️ OWASP CSV Injection Defense",
             "All CSV exports automatically sanitize formula characters (=, +, -, @) with quote prefixes to prevent client-side spreadsheet formula execution attacks.",
             top_border_color=ACCENT_ROSE)

    add_speaker_note(s7, "Our platform enforces zero-trust onboarding: newly registered analysts cannot access telemetry until an admin approves them. All endpoints are guarded by strict role dependencies.")

    # =========================================================================
    # SLIDE 8: Benchmark Telemetry Results
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_background(s8)
    add_header(s8, "RESULTS & TELEMETRY", "Verified Benchmark Dataset Results",
               "Live evaluation metrics across 3,400 synthetic enterprise network events.")

    add_card(s8, 0.8, 2.0, 2.65, 2.2, "Ingested Events", "Total synthetic network telemetry records.", metric="3,400", metric_color=PRIMARY)
    add_card(s8, 3.82, 2.0, 2.65, 2.2, "AI Matches (75.1%)", "Identified generative AI traffic.", metric="2,552", metric_color=ACCENT_PURPLE)
    add_card(s8, 6.84, 2.0, 2.65, 2.2, "Violations (40.5%)", "Unapproved Shadow AI interactions.", metric="1,378", metric_color=ACCENT_ROSE)
    add_card(s8, 9.86, 2.0, 2.65, 2.2, "Alerts Generated", "Prioritized incident triage items.", metric="1,949", metric_color=ACCENT_AMBER)

    add_card(s8, 0.8, 4.6, 11.733, 2.2, "📈 Top Detected Shadow AI Services in Network Logs",
             "• DeepSeek: 343 requests (High exfiltration risk)\n"
             "• Perplexity AI: 329 requests (Research data searches)\n"
             "• Anthropic / Claude: 310 requests (Source code analysis)\n"
             "• OpenAI / ChatGPT: 286 requests (General enterprise prompts)\n"
             "• GitHub Copilot: 231 requests (IDE completion telemetry)\n"
             "• Cursor IDE: 217 requests (Full codebase indexing uploads)",
             top_border_color=PRIMARY)

    add_speaker_note(s8, "Across 3,400 events, our platform accurately isolated 2,552 AI interactions, flagged 1,378 unapproved policy violations, and generated 1,949 prioritized alerts in under one second.")

    # =========================================================================
    # SLIDE 9: Cloud Deployment & Stack
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_background(s9)
    add_header(s9, "CLOUD DEPLOYMENT", "Production Full-Stack Cloud Infrastructure",
               "Live, scalable cloud architecture deployed with zero single points of failure.")

    add_card(s9, 0.8, 2.0, 5.65, 3.2, "🌐 Frontend Edge Deployment",
             "• Platform: Vercel Global Edge CDN\n"
             "• Stack: React 19, TypeScript, Vite, Tailwind CSS v4\n"
             "• Routing: Edge Proxy rewrite to backend eliminates CORS\n"
             "• Live URL: https://shadow-ai-detector-chi.vercel.app\n"
             "• Features: Dynamic Dark/Light HUD, Recharts Analytics",
             top_border_color=PRIMARY)

    add_card(s9, 6.88, 2.0, 5.65, 3.2, "⚙️ Backend API & Database",
             "• Platform: Render Cloud Web Service\n"
             "• Stack: Python 3.14, FastAPI, Uvicorn ASGI Server\n"
             "• Persistence: Multi-engine SQLAlchemy (MySQL 8.x + SQLite)\n"
             "• API Docs: https://shadow-ai-detector.onrender.com/docs\n"
             "• Throughput: 10,000+ events/sec batch ingestion engine",
             top_border_color=ACCENT_PURPLE)

    add_card(s9, 0.8, 5.5, 11.733, 1.3, "✅ 100% Automated Test Suite Passing",
             "17 unit, integration, and security test suites verified with Pytest and FastAPI TestClient with zero failures.",
             top_border_color=ACCENT_EMERALD)

    add_speaker_note(s9, "Our platform is live in production right now. The frontend runs on Vercel's Edge Network, and the backend is powered by FastAPI on Render with multi-engine relational persistence.")

    # =========================================================================
    # SLIDE 10: Security Console Modules
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    add_background(s10)
    add_header(s10, "CONSOLE MODULES", "Core Modules in the Security Console",
               "A unified HUD designed for rapid Security Operations Center (SOC) triage.")

    modules = [
        ("📊 Security Dashboard", "High-level threat KPIs, risk distribution graphs, and AI provider pie charts."),
        ("🔎 Event Explorer", "Deep telemetry search by device ID, FQDN, Shannon entropy, and byte ratios."),
        ("🚨 Alert Center", "Triage workspace with itemized score cards and persistent investigation notes."),
        ("🗂️ AI Catalog", "Curated registry of recognized AI providers, active domain regexes, and badges."),
        ("⚖️ Policy Manager", "Administrative interface to dynamically toggle rules between Approved and Unapproved."),
        ("🤖 ML Status & Benchmark", "Live model evaluation dashboard showing confusion matrices and ROC curves.")
    ]

    for idx, (mtitle, mdesc) in enumerate(modules):
        row = idx // 3
        col = idx % 3
        c_left = 0.8 + col * 4.04
        c_top = 2.0 + row * 2.5
        add_card(s10, c_left, c_top, 3.75, 2.2, mtitle, mdesc, top_border_color=PRIMARY if row==0 else ACCENT_PURPLE)

    add_speaker_note(s10, "Our console features six dedicated modules — from executive KPI dashboards down to deep event query explorers and live policy management.")

    # =========================================================================
    # SLIDE 11: Competitive Differentiation
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    add_background(s11)
    add_header(s11, "COMPETITIVE DIFFERENTIATION", "Why Shadow AI Detector Wins",
               "A purpose-built solution that outperforms generic legacy security tools.")

    t_shape = s11.shapes.add_table(6, 4, Inches(0.8), Inches(2.0), Inches(11.733), Inches(4.8))
    comp_tbl = t_shape.table
    comp_tbl.columns[0].width = Inches(3.2)
    comp_tbl.columns[1].width = Inches(2.5)
    comp_tbl.columns[2].width = Inches(2.5)
    comp_tbl.columns[3].width = Inches(3.533)

    comp_headers = ["Feature / Dimension", "Legacy Firewalls", "Generic SIEMs (Splunk)", "Shadow AI Detector (Our Solution)"]
    for c_idx, h_t in enumerate(comp_headers):
        cell = comp_tbl.cell(0, c_idx)
        cell.text = h_t
        cell.fill.solid()
        cell.fill.fore_color.rgb = TABLE_HDR_BG
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = PRIMARY if c_idx == 3 else TEXT_MAIN

    matrix_rows = [
        ("AI Domain Catalog", "❌ Generic DNS only", "⚠️ Manual queries required", "✅ Curated & Automated AI Catalog"),
        ("Entropy & Exfiltration", "❌ Not calculated", "⚠️ High setup overhead", "✅ Real-Time Shannon Entropy Engine"),
        ("Detection Methodology", "❌ Static IP blocks", "❌ Black-box / raw logs", "✅ Hybrid: Policy + ML Verification"),
        ("SOC Explainability", "❌ None", "⚠️ Unstructured logs", "✅ Itemized Scoring & Remediation Steps"),
        ("Deployment Time", "❌ Weeks / Hardware", "❌ Days of pipeline setup", "✅ Under 5 Minutes (Cloud-Native)")
    ]

    for r_idx, row_data in enumerate(matrix_rows):
        for c_idx, cell_data in enumerate(row_data):
            cell = comp_tbl.cell(r_idx + 1, c_idx)
            cell.text = cell_data
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10)
            if c_idx == 3:
                p.font.bold = True
                p.font.color.rgb = ACCENT_EMERALD
            elif c_idx == 0:
                p.font.bold = True
                p.font.color.rgb = TEXT_MAIN
            else:
                p.font.color.rgb = TEXT_MUTED

    add_speaker_note(s11, "Unlike legacy firewalls that only block static IPs or SIEMs that dump noisy logs, we provide built-in AI catalog awareness, mathematical entropy detection, and itemized explainability.")

    # =========================================================================
    # SLIDE 12: Future Roadmap & Conclusion
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    add_background(s12)
    add_header(s12, "FUTURE ROADMAP & IMPACT", "Securing Enterprise AI Adoption",
               "Empowering organizations to adopt generative AI safely and compliantly.")

    add_card(s12, 0.8, 2.0, 3.65, 2.5, "🚀 Phase 1 (Completed)",
             "• Telemetry discovery pipeline\n"
             "• Shannon entropy risk scoring\n"
             "• 99.88% ML classification\n"
             "• Live Vercel & Render deployment",
             top_border_color=PRIMARY)

    add_card(s12, 4.84, 2.0, 3.65, 2.5, "🔗 Phase 2 (Q3 2026)",
             "• SIEM & SOAR webhooks\n"
             "• Splunk & Microsoft Sentinel apps\n"
             "• Automated egress firewall sync\n"
             "• Active Directory user sync",
             top_border_color=ACCENT_PURPLE)

    add_card(s12, 8.88, 2.0, 3.65, 2.5, "🛡️ Phase 3 (Q4 2026)",
             "• Kernel-level eBPF lightweight agent\n"
             "• Process socket attribution\n"
             "• Automated DLP prompt sandboxing\n"
             "• ISO 42001 compliance reporting",
             top_border_color=ACCENT_EMERALD)

    demo_card = add_card(s12, 0.8, 4.8, 11.733, 2.0, "Ready to Experience Shadow AI Detector Live?",
                         "Live Web App: https://shadow-ai-detector-chi.vercel.app\n"
                         "API Docs: https://shadow-ai-detector.onrender.com/docs\n\n"
                         "Thank you, Jury Panel! We welcome your questions.",
                         top_border_color=PRIMARY)

    add_speaker_note(s12, "Shadow AI Detector transforms enterprise security from reactive fear to proactive governance. Thank you for your time, and we look forward to your questions!")

    # Save
    prs.save(output_filename)
    print(f"PowerPoint Presentation saved successfully as: {output_filename}")

if __name__ == "__main__":
    create_deck("Shadow_AI_Detector_Presentation.pptx", is_light=False)
    create_deck("Shadow_AI_Detector_Presentation_Light.pptx", is_light=True)
