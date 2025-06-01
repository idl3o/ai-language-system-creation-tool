"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ruleController_1 = require("./ruleController");
const systemController_1 = require("./systemController");
const ruleRepository_1 = require("../storage/ruleRepository");
const router = (0, express_1.Router)();
const ruleRepository = new ruleRepository_1.RuleRepository();
const ruleController = new ruleController_1.RuleController(ruleRepository);
const systemController = new systemController_1.SystemController();
// Use the router property from controllers
router.use('/rules', ruleController.router);
router.use('/system', systemController.router);
exports.default = router;
