from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.ai_provider import AIProvider
from app.models.provider_domain import ProviderDomain

KNOWN_NON_AI = {
    "github.com", "microsoft.com", "google.com", "aws.amazon.com", "cloudflare.com",
    "stackoverflow.com", "wikipedia.org", "slack.com", "zoom.us", "jira.atlassian.com",
    "apple.com", "linkedin.com", "salesforce.com"
}

class ProviderMatcher:
    def __init__(self, db: Optional[Session] = None):
        self.db = db
        self.cached_domains: List[Dict[str, Any]] = []
        if db:
            self.load_cache()

    def load_cache(self):
        """Pre-cache active provider domains for fast matching."""
        if not self.db:
            return
        domains = (
            self.db.query(ProviderDomain, AIProvider)
            .join(AIProvider, ProviderDomain.provider_id == AIProvider.id)
            .filter(ProviderDomain.is_active == True, AIProvider.is_active == True)
            .all()
        )
        self.cached_domains = [
            {
                "provider_id": prov.id,
                "provider_name": prov.name,
                "provider_slug": prov.slug,
                "category": prov.category,
                "pattern": dom.domain_pattern.lower(),
                "match_type": dom.match_type,
                "is_ai_service": dom.is_ai_service,
                "source": dom.source_reference
            }
            for dom, prov in domains
        ]

    def match(self, domain: str) -> Dict[str, Any]:
        """
        Evaluate domain against catalog:
        1. Exact match
        2. Subdomain match (e.g., candidate ends with .pattern)
        3. Known non-AI check
        4. Unknown
        """
        norm = domain.lower()

        # Check known non-AI first
        for non_ai in KNOWN_NON_AI:
            if norm == non_ai or norm.endswith("." + non_ai):
                return {
                    "match_status": "known_non_ai",
                    "provider_id": None,
                    "provider_name": "Known Non-AI Infrastructure",
                    "provider_slug": "non_ai",
                    "category": "Standard Enterprise / Cloud",
                    "matched_domain": non_ai,
                    "match_type": "subdomain" if norm != non_ai else "exact",
                    "evidence_source": "Curated Non-AI Whitelist",
                    "is_ai_service": False,
                    "confidence": 0.99
                }

        # Check cached AI provider domains
        for item in self.cached_domains:
            pattern = item["pattern"]
            m_type = item["match_type"]

            # Exact match
            if norm == pattern:
                return {
                    "match_status": "known_ai",
                    "provider_id": item["provider_id"],
                    "provider_name": item["provider_name"],
                    "provider_slug": item["provider_slug"],
                    "category": item["category"],
                    "matched_domain": pattern,
                    "match_type": "exact",
                    "evidence_source": item["source"],
                    "is_ai_service": item["is_ai_service"],
                    "confidence": 0.98
                }

            # Subdomain match
            if m_type in ["subdomain", "wildcard"]:
                if norm.endswith("." + pattern):
                    return {
                        "match_status": "known_ai",
                        "provider_id": item["provider_id"],
                        "provider_name": item["provider_name"],
                        "provider_slug": item["provider_slug"],
                        "category": item["category"],
                        "matched_domain": pattern,
                        "match_type": "subdomain",
                        "evidence_source": item["source"],
                        "is_ai_service": item["is_ai_service"],
                        "confidence": 0.95
                    }

        # Unknown domain / insufficient evidence
        return {
            "match_status": "unknown",
            "provider_id": None,
            "provider_name": "Unclassified Destination",
            "provider_slug": "unclassified",
            "category": "Unclassified",
            "matched_domain": None,
            "match_type": "none",
            "evidence_source": "None (Destination not found in catalog)",
            "is_ai_service": False,
            "confidence": 0.30
        }
