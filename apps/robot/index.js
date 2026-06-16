'use strict';

// apps/robot/index.js
// Stage 10: Robot runs embedded inside the Designer Electron process.
// Stage 11: This becomes a standalone Node.js process / service
//           that receives jobs from Controller via IPC or HTTP.

const { RobotAgent } = require('./RobotAgent');

module.exports = { RobotAgent };
