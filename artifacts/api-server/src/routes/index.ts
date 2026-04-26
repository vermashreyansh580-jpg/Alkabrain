import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import firebaseAuthRouter from "./firebaseAuth";
import modelsRouter from "./models";
import chatRouter from "./chat";
import mediaRouter from "./media";
import billingRouter from "./billing";
import webhooksRouter from "./webhooks";
import deployRouter from "./deploy";
import conversationsRouter from "./conversations";
import helpRouter from "./help";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(firebaseAuthRouter);
router.use(modelsRouter);
router.use(chatRouter);
router.use(mediaRouter);
router.use(billingRouter);
router.use(webhooksRouter);
router.use(deployRouter);
router.use(conversationsRouter);
router.use(helpRouter);

export default router;
