# Project Operating Model

**Owner:** Product and engineering leads
**Review trigger:** Planning, ownership, review, or release-process change
**Last reviewed:** 2026-07-27

## Purpose

This model keeps product intent, delivery work, technical decisions, release
state, and operational ownership connected as Plexus grows into a superapp.

## Planning layers

| Horizon    | Artifact                    | Purpose                                  |
| ---------- | --------------------------- | ---------------------------------------- |
| Vision     | Product vision              | Outcomes and boundaries                  |
| Portfolio  | Capability map              | Superapp modules and maturity            |
| Roadmap    | Now/Next/Later              | Sequencing and dependencies              |
| Initiative | Feature plan                | Outcome, scope, architecture, acceptance |
| Execution  | GitHub issue/PR             | Assigned work and reviewed change        |
| Release    | Release checklist/changelog | Production decision and evidence         |
| Operations | Status/runbook/incident     | Durable live state and learning          |

## Work types

- **Feature:** New or materially expanded user outcome.
- **Fix:** Correct incorrect or unsafe behavior.
- **Platform:** Shared architecture, developer experience, or infrastructure.
- **Data:** Schema, migration, quality, or reporting change.
- **Security:** Authorization, secrets, privacy, abuse, or compliance work.
- **Operations:** Deployment, monitoring, support, or recovery work.
- **Discovery:** Time-boxed research that ends with evidence and a decision.

## Work-item states

| State         | Entry condition                                | Exit condition                         |
| ------------- | ---------------------------------------------- | -------------------------------------- |
| Proposed      | Problem recorded                               | Owner accepts or rejects               |
| Discovery     | Unknowns identified                            | Evidence and recommendation documented |
| Ready         | Scope, owner, dependencies, acceptance defined | Capacity assigned                      |
| In progress   | Branch/work item active                        | Implementation and tests complete      |
| In review     | PR, CI, and preview available                  | Review decision recorded               |
| Release ready | Definition of Done met                         | Release approved                       |
| Released      | Production verified                            | Monitoring/support owner accepts       |
| Measured      | Success/guardrail data reviewed                | Iterate, close, or rollback            |

Blocked work states the blocker, owner, next action, and review date. “Almost
done” is not a state.

## Roles

| Role                   | Accountability                                    |
| ---------------------- | ------------------------------------------------- |
| Product owner          | Outcome, priority, scope, acceptance, launch mode |
| Engineering lead       | Architecture, sequencing, technical risk, quality |
| Feature owner          | End-to-end delivery and documentation             |
| Security/data reviewer | Authorization, privacy, RLS, migration safety     |
| QA/release owner       | Evidence, preview, release decision, smoke test   |
| Operations owner       | Monitoring, support, rollback, incident response  |

One person may hold multiple roles, but the accountabilities remain explicit.

## Initiative lifecycle

1. Create a feature plan from the template.
2. Link it to the capability map and roadmap item.
3. Record architectural decisions that are expensive to reverse.
4. Split execution into independently verifiable vertical slices.
5. Keep migrations, code, tests, docs, and changelog together.
6. Review CI and Preview.
7. Complete the release checklist.
8. Verify production and update project status.
9. Review success measures and follow-up work.

## Prioritization

Use:

- **P0:** Active security, data-loss, outage, or launch-blocking failure.
- **P1:** Required for the current committed outcome.
- **P2:** Important improvement after current commitments.
- **P3:** Useful option with no near-term commitment.

Priority is based on user/business impact, risk reduction, dependency
unblocking, effort, and evidence—not who asked most recently.

## Documentation control

Each claim has one canonical home defined in `docs/README.md`. Avoid parallel
roadmaps, undocumented decisions, and status written only in chat.

At minimum, every meaningful delivery updates:

- The owning feature or module document.
- Tests and verification evidence.
- `CHANGELOG.md`.
- Project status when live operational state changed.

## Ceremonies

For a small team:

- Weekly roadmap and blocker review.
- Per-change design/security review when risk warrants it.
- Pull-request review for every production change.
- Release review for migrations, permissions, and integrations.
- Monthly capability/status and documentation freshness review.
- Incident review after user-impacting failures.
