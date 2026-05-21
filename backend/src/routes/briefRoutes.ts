import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getMyBriefs, markBriefRead, archiveBrief, deleteBrief } from "../controllers/briefController.js";

const router = Router();

router.get("/", authenticate, getMyBriefs);
router.patch("/:id/read", authenticate, markBriefRead);
router.patch("/:id/archive", authenticate, archiveBrief);
router.delete("/:id", authenticate, deleteBrief);

export default router;
