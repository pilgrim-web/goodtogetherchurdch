# Security Policy

## Repository Protections
- Require GitHub MFA for all contributors.
- Protect the default branch with required reviews and status checks.
- Use CODEOWNERS to enforce review coverage for changes to core templates and scripts.

## Content Sanitization
All HTML rendered from CMS content is sanitized on the client before insertion. Scripts, event handlers, and unsafe URLs are blocked. Only a small whitelist of safe tags is allowed.

## Form Privacy & Retention
Netlify Forms are used for contact and prayer requests. Store submissions only as long as needed for pastoral care. Review and purge data regularly based on pastoral policy and legal requirements.
