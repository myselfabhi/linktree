import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getEngagementOverview } from "../controllers/engagementController.js";

const router = Router();

router.get("/overview", authenticate, getEngagementOverview);

export default router;
