import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import usersRouter from "./users.js";
import projectsRouter from "./projects.js";
import expensesRouter from "./expenses.js";
import tenantsRouter from "./tenants.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(expensesRouter);
router.use(tenantsRouter);

export default router;
