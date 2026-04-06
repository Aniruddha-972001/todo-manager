import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import fs from "fs";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import swaggerSpec from "./config/swagger.js";
import { FRONTEND_ORIGIN } from "./config/env.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware.js";

const app = express();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const clientDistPath = path.resolve(currentDir, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");
const hasBuiltClient = fs.existsSync(clientIndexPath);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Quick endpoint to verify that the API server is running.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
app.get("/health", (req, res) => {
  res.json({ message: "Server is running " });
});

/**
 * @swagger
 * /api-docs.json:
 *   get:
 *     summary: Get the raw OpenAPI specification
 *     description: Returns the generated OpenAPI JSON used by Swagger UI.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: OpenAPI spec returned successfully
 */
app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
    customSiteTitle: "Todo Manager API Docs",
  })
);
app.use("/api", authRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/todos", todoRoutes);

if (hasBuiltClient) {
  app.use(express.static(clientDistPath));

  app.get(/^\/(?!api(?:\/|$)|api-docs(?:\/|$)|api-docs\.json$|health$).*/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
