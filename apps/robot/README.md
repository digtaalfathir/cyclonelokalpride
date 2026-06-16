# apps/robot — Robot Agent (Placeholder)

Planned: headless RPA execution agent.

## Responsibility
- Receive workflow from Controller or local schedule
- Execute workflow using `shared/engine/workflowEngine`
- Report progress and results back to Controller
- No UI; runs as a background service or CLI process

## Planned entry point
```
apps/robot/
├── index.js       ← main entry (future)
├── scheduler.js   ← cron / interval runner (future)
└── reporter.js    ← result reporting (future)
```

## Dependencies (planned)
- `shared/engine` — WorkflowEngine
- `shared/nodes`  — all node handlers
- `shared/utils`  — interpolate, expression helpers
