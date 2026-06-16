'use strict';

// apps/controller/index.js
// Stage 11: Controller runs embedded inside the Designer Electron process.
// Stage 12: ControllerService becomes a standalone HTTP/IPC service
//           that Robot and Designer connect to remotely.

const { ControllerService } = require('./ControllerService');

module.exports = { ControllerService };
