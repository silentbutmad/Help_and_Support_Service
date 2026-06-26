import {prisma} from "../models/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from'../middleware/errorMiddleware.js';
import logger from "../utils/logger.js";

const getAllFaqs = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const where = category ? { category } : {};

  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    count: faqs.length,
    data: faqs
  });
});

const createFaq = asyncHandler(async (req, res) => {
  const { question, answer, category } = req.body;

  const faq = await prisma.fAQ.create({
    data: {
      question,
      answer,
      category
    }
  });

  logger.info(`FAQ created: ${faq.id}`);

  res.status(201).json({
    success: true,
    message: 'FAQ created successfully',
    data: faq
  });
});

const updateFaq = asyncHandler(async (req, res) => {
  const faqId = req.params.id;
  const { question, answer, category } = req.body;

  const faq = await prisma.fAQ.update({
    where: { id: faqId },
    data: {
      question,
      answer,
      category
    }
  });

  logger.info(`FAQ updated: ${faqId}`);

  res.status(200).json({
    success: true,
    message: 'FAQ updated successfully',
    data: faq
  });
});

const deleteFaq = asyncHandler(async (req, res) => {
  const faqId = req.params.id;

  await prisma.fAQ.delete({
    where: { id: faqId }
  });

  logger.info(`FAQ deleted: ${faqId}`);

  res.status(200).json({
    success: true,
    message: 'FAQ deleted successfully'
  });
});

export {
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq
};