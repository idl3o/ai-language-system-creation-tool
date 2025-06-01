import { Router } from 'express';
import { RuleController } from './ruleController';
import { SystemController } from './systemController';
import { RuleRepository } from '../storage/ruleRepository';

const router = Router();
const ruleRepository = new RuleRepository();
const ruleController = new RuleController(ruleRepository);
const systemController = new SystemController();

// Use the router property from controllers
router.use('/rules', ruleController.router);
router.use('/system', systemController.router);

export default router;