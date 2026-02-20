import express from 'express';
import { Role } from '../../../generated/prisma/browser';
import { checkAuth } from '../../middleware/checkAuth';
import { StatsController } from './stats.controller';

const router = express.Router();

router.get(
    '/',
    checkAuth(Role.SUPER_ADMIN, Role.ADMIN, Role.DOCTOR, Role.PATIENT),
    StatsController.getDashboardStatsData
)


export const StatsRoutes = router;