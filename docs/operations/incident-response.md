# Incident Response

**Owner:** Operations and security
**Review trigger:** Incident, escalation, or recovery-process change
**Last reviewed:** 2026-07-27

## Severity

| Severity | Definition                                                           | Response                                |
| -------- | -------------------------------------------------------------------- | --------------------------------------- |
| SEV-1    | Active unauthorized access, major data loss, or platform-wide outage | Immediate incident lead and containment |
| SEV-2    | Major workflow unavailable or significant tenant impact              | Urgent coordinated response             |
| SEV-3    | Limited degradation with workaround                                  | Normal expedited fix                    |
| SEV-4    | Minor issue, no meaningful user impact                               | Backlog                                 |

## Response sequence

1. **Declare:** name incident lead, severity, start time, affected systems.
2. **Contain:** stop releases; disable affected account/feature/provider when
   safe; rotate exposed secrets.
3. **Preserve evidence:** deployment IDs, commit, request IDs, audit events,
   time range, sanitized logs.
4. **Assess:** users/tenants/data affected, ongoing risk, data-loss window.
5. **Recover:** rollback app or apply reviewed forward fix.
6. **Verify:** routes, role isolation, data integrity, errors, provider health.
7. **Communicate:** factual status, impact, workaround, next update time.
8. **Review:** root cause, contributing controls, actions, owners, due dates.

## Security incident rules

- Do not delete users or logs before evidence and active sessions are handled.
- Rotate exposed secrets in the provider and Vercel; do not only change a local
  file.
- Treat cross-tenant access as a security incident even if no misuse is known.
- Do not include credentials or personal contact data in incident documents.

## Recovery decision

| Condition                             | Preferred response                                        |
| ------------------------------------- | --------------------------------------------------------- |
| App regression, schema compatible     | Vercel rollback                                           |
| Bad data write, app otherwise healthy | Disable write path and forward-fix                        |
| Migration incompatible with old app   | Stabilize compatible app, forward migration               |
| Secret exposure                       | Rotate/revoke, redeploy, inspect access logs              |
| Account compromise                    | Suspend, revoke sessions, reset credential, inspect audit |

## Documentation

Copy [Incident report](../templates/incident-report.md) into:

```text
docs/project-management/incidents/YYYY-MM-DD-short-title.md
```

Update the runbook, security documentation, tests, and changelog with durable
lessons. Do not close the incident with only a code change.
