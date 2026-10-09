import re
from typing import Tuple, Optional
from urllib.parse import urlparse

DOMAIN_REGEX = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$"
)

def normalize_domain(raw_domain: Optional[str]) -> Tuple[bool, str, Optional[str]]:
    """
    Normalizes and validates a candidate destination domain or URL string.
    Returns: (is_valid, normalized_domain, error_message)
    """
    if not raw_domain or not isinstance(raw_domain, str):
        return False, "", "Empty or missing destination domain"

    cleaned = raw_domain.strip().lower()

    # Strip scheme if present (e.g. https://, http://)
    if "://" in cleaned:
        try:
            parsed = urlparse(cleaned)
            cleaned = parsed.netloc or parsed.path
        except Exception:
            return False, "", "Malformed URL scheme in domain string"

    # Strip port if present (e.g. domain.com:443)
    if ":" in cleaned:
        cleaned = cleaned.split(":")[0]

    # Strip path or trailing slash if present
    if "/" in cleaned:
        cleaned = cleaned.split("/")[0]

    # Strip trailing dot (FQDN root dot)
    cleaned = cleaned.rstrip(".")

    # Basic length check
    if len(cleaned) < 3 or len(cleaned) > 253:
        return False, cleaned, "Domain length out of bounds (3-253 chars)"

    # Check for invalid spaces or forbidden characters
    if " " in cleaned or "\t" in cleaned or "\n" in cleaned:
        return False, cleaned, "Domain contains forbidden whitespace"

    # Regex validation
    if not DOMAIN_REGEX.match(cleaned):
        return False, cleaned, f"Invalid domain syntax: {cleaned}"

    return True, cleaned, None
