import { Router } from "express";
import { optionalAuthenticate } from "../middleware/auth.js";
import { getQuestions, generateBio } from "../controllers/bioTemplateController.js";

const router = Router();

router.get("/questions", getQuestions);
router.post("/generate", optionalAuthenticate, generateBio);

export default router;
