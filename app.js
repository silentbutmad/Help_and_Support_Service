import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import eureka from "./eurekaregister.js"
import rateLimit from "express-rate-limit"
import { generalLimiter } from "./middleware/rateLimiter.js";
import { notFound,errorHandler } from "./middleware/errorMiddleware.js";
import supportRoutes from "./routes/supportRoutes.js"
import faqRoutes from "./routes/faqRoutes.js"
import analyticsRoutes from './routes/analyticsRoutes.js'
import logger from "./utils/logger.js"

dotenv.config()
const app = express();





app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Help & Support Service is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/support', supportRoutes);
app.use('/support', faqRoutes);
app.use('/support', analyticsRoutes);

app.use(notFound);

app.use(errorHandler);

app.listen(5003, () => {
  console.log("help and support Service running on port 5000")

  eureka.start((error) => {
    if (error) {
      console.log("Eureka registration failed:", error);
    } else {
      console.log("Help and support service registered with Eureka");
    }
  });

})