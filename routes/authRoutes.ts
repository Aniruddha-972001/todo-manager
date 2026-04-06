import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getCurrentUser, login, logout, refresh, signup } from "../controllers/authController.js";

const router = express.Router();

/**
 * @swagger
 * /api/signup:
 *   post:
 *     summary: Create a new user account
 *     description: Register a user with a username and password. The password is hashed before storage.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SignupResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/signup", signup);

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Log in and receive an access token
 *     description: Returns a JWT access token in the response body and sets a refreshToken cookie for the refresh endpoint.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", login);

/**
 * @swagger
 * /api/refresh:
 *   post:
 *     summary: Refresh the access token using the refresh token cookie
 *     description: This route expects the refreshToken cookie created during login. In Swagger UI, the browser may send that cookie automatically after a successful login from the same docs page.
 *     tags:
 *       - Auth
 *     security:
 *       - refreshTokenCookie: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Missing refresh token cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/refresh", refresh);

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Log out the current session
 *     description: Clears the refreshToken cookie and removes the stored refresh token from the database.
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get the currently authenticated user payload
 *     description: Use the Authorize button in Swagger UI and paste the JWT access token from /api/login.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MeResponse'
 *       401:
 *         description: Missing authorization header or token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authMiddleware, getCurrentUser);

export default router;
