'use strict';

// Dispatcher — routes jobs to available robots.
//
// Stage 11: single embedded robot, pull model (robot polls JobQueue).
//   dispatch() validates readiness and logs routing intent.
//   No code change needed in RobotAgent — it still polls on its own.
//
// Stage 12+: push model. dispatch() would select a specific robot,
//   set job.assignedRobotId, and notify the robot directly via IPC/HTTP.

function ts() {
  return new Date().toISOString().substring(11, 19);
}

class Dispatcher {
  constructor({ robotRegistry }) {
    this._registry = robotRegistry;
  }

  // Returns the first ONLINE (not BUSY/OFFLINE) robot, or null.
  selectRobot() {
    const robots = this._registry.listRobots();
    return robots.find(r => r.status === 'ONLINE') || null;
  }

  canDispatch() {
    return this.selectRobot() !== null;
  }

  // Validate readiness and log the dispatch decision.
  // Stage 11: job is already in JobQueue; robot will claim it via polling.
  // Returns dispatch metadata (used for logging, not for routing).
  dispatch(job, onLog) {
    const log = onLog || (() => {});
    const robot = this.selectRobot();

    if (!robot) {
      log({
        level:     'WARN',
        message:   `[Dispatcher] No ONLINE robot for job ${job.id} — job queued, will run when robot is available`,
        timestamp: ts(),
      });
      return { dispatched: false, reason: 'no_robot_available', jobId: job.id };
    }

    log({
      level:     'INFO',
      message:   `[Dispatcher] Job ${job.id} (${job.workflowId}) → ${robot.robotId} [${robot.status}]`,
      timestamp: ts(),
    });

    return { dispatched: true, robotId: robot.robotId, jobId: job.id };
  }
}

module.exports = { Dispatcher };
