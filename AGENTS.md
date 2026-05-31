<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project runs Next.js 16. APIs, conventions, and file structure may differ
from training data. Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Bindu pivot context

This is a **full product pivot** from the previous Bindu codebase (preserved
on the `pre-pivot-archive` branch). The new product:

- **End-to-end encrypted** anonymous inbox. The server never reads messages.
- Authentication is **passphrase-based** — no email, no phone, no OAuth.
  The passphrase both authenticates and derives the key-encryption-key.
- **Hashed sender IDs** (`#f3a9` style) — recipient can mute by hash without
  the server ever knowing who the sender was.
- **Three themes**: sunset (default brand), acid, dream. Each has dark mode.
- Three roles: recipient, **staff** (moderation), admin (platform).
- v2 (schema-ready, not built): group dots, Bindu+ paid plan.

Crypto: WebCrypto API only. ECDH P-256 + AES-256-GCM hybrid for messages.
PBKDF2-SHA256 (600k iter) for passphrase KDF. No external crypto libraries.

See `PLANNER.md` for the full architecture and phase plan.
