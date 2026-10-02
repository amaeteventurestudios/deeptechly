# External Integration Blockers

This file records integrations that require user-authorized external accounts or credentials. They do not block independent V2 implementation work.

## Appwrite activation

Status: isolated; not active.

An Appwrite endpoint, project ID, allowed-origin configuration, email templates, and an approved server-session cookie design are not available in the repository. The Appwrite identity adapter therefore fails closed, while Supabase remains the working compatibility provider. See `06_AUTH_MIGRATION.md` for the cutover requirements.
