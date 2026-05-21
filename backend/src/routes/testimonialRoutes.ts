import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
	requestTestimonial,
	getSubmitForm,
	submitTestimonial,
	getMyTestimonials,
	approveTestimonial,
	deleteTestimonial,
} from "../controllers/testimonialController.js";

const router = Router();

// Authenticated (owner)
router.post("/request", authenticate, requestTestimonial);
router.get("/", authenticate, getMyTestimonials);
router.patch("/:id/approve", authenticate, approveTestimonial);
router.delete("/:id", authenticate, deleteTestimonial);

// Public (token-gated submission)
router.get("/submit/:token", getSubmitForm);
router.post("/submit/:token", submitTestimonial);

export default router;
