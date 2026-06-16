# apps/controller — Controller (Placeholder)

Planned: orchestration hub for multi-robot coordination.

## Responsibility
- Manage a fleet of Robot Agents
- Schedule and dispatch workflow runs
- Collect and aggregate execution results
- Expose REST/WebSocket API for Designer and external systems

## Planned entry point
```
apps/controller/
├── index.js       ← server entry (future)
├── api/           ← REST API routes (future)
├── scheduler/     ← job queue / cron management (future)
└── dashboard/     ← web dashboard (future)
```

## Dependencies (planned)
- `shared/workflow` — workflow validation before dispatch
- `apps/robot`      — Robot Agent SDK
