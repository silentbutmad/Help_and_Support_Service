import express from "express"
const router = express.Router()
import { verifyToken } from "../middleware/authMiddleware.js";
import { canManageFaqs } from "../middleware/authorizationMiddleware.js";
import { createFaq,updateFaq,deleteFaq,getAllFaqs } from "../controllers/faqController.js";

router.get('/faqs',getAllFaqs);
router.post('/faqs',verifyToken, canManageFaqs, createFaq);
router.put('/faqs/:id', verifyToken, canManageFaqs, updateFaq);
router.delete('/faqs/:id', verifyToken, canManageFaqs, deleteFaq);

export default router;