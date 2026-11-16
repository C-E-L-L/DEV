"""Validate Certbot's existing lineage before exporting into a private SSL directory."""
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import serialization

domain = 'cell.cbnu.ac.kr'
lineage = Path('/etc/letsencrypt/live') / domain
chain = (lineage / 'fullchain.pem').read_bytes()
key = (lineage / 'privkey.pem').read_bytes()
cert = x509.load_pem_x509_certificate(chain)
private = serialization.load_pem_private_key(key, password=None)
public_format = (serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
assert cert.public_key().public_bytes(*public_format) == private.public_key().public_bytes(*public_format), 'Key mismatch'
assert domain in cert.extensions.get_extension_for_class(x509.SubjectAlternativeName).value.get_values_for_type(x509.DNSName), 'Wrong domain'
now = datetime.now(timezone.utc)
assert cert.not_valid_before_utc <= now < cert.not_valid_after_utc - timedelta(days=2), 'Certificate validity insufficient'
Path('/out/cert.pem.next').write_bytes(chain)
Path('/out/key.pem.next').write_bytes(key)
print(json.dumps({'domain': domain, 'expires_utc': cert.not_valid_after_utc.isoformat(), 'serial': str(cert.serial_number)}))
