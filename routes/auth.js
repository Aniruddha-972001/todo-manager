import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {users, refreshTokens} from "../data/store.js"
import authMiddleware from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken"

const router = express.Router();
const JWT_SECRET = "mysecretkey";

// using async await for non-blocking as if we use hashSync it can block the server.
/*
    Client sends username + password
            ↓
    Server validates input
            ↓
    Check if user already exists
            ↓
      Hash password
            ↓
      Store user
            ↓
    Send success response
*/
router.post("/signup",async (req,res)=>{
    const { username, password } = req.body;

    if(!username || !password){
        return res.status(400).json({message: "Username and Password are required"});
    }

    const userExists = users.some((user)=>user.username.toLowerCase() === username.toLowerCase());

    if(userExists){
        return res.status(409).json({message: "User already exists"});
    }

    try{
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = {
            id: crypto.randomUUID(),
            username,
            password: hashedPassword,
        };
        users.push(newUser);
        // console.log("New user added:", newUser);
        // console.log("All users:", users);
        return res.status(201).json({
            message:"User created successfully",
            user:{
                id: newUser.id,
                username: newUser.username,
            },
        });
    }
    catch(error){
        return res.status(500).json({message: "Failed to create User"});
    }
})

/*
Read username + password from req.body
↓
Validate missing fields
↓
Find user by username
↓
If user not found → fail
↓
Compare entered password with stored hashed password
↓
If password wrong → fail
↓
If correct → generate Access Token
↓
Generate Refresh Token
↓
Store Refresh Token in in-memory array
↓
Set Refresh Token in httpOnly cookie
↓
Send Access Token back in response
*/
router.post("/login",async (req,res) => {
    const { username , password} = req.body;
    if(!username || !password){
        return res.status(400).json({message: "Username and Password are required"});
    }

    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if(!user){
        return res.status(401).json({message:"Invalid credentials"});
    }

    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(401).json({message:"Invalid credentials"})
    }

    const accessToken = jwt.sign({
        userId: user.id,
        role:"user"
    },JWT_SECRET,{expiresIn: "15m"});

    const refreshToken = jwt.sign({
        userId: user.id
        },JWT_SECRET,{ expiresIn: "7d" });
    
    refreshTokens.push(refreshToken);
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "strict"
    });
    // console.log("Login user:", user);
    // console.log("Access token:", accessToken);
    // console.log("Refresh token:", refreshToken);
    // console.log("All refresh tokens:", refreshTokens);

    return res.status(200).json({
        message:"Login Successful",
        token: accessToken,
    });
    
});

/*
Client sends request to /refresh
↓
Server reads refreshToken from req.cookies
↓
If refresh token missing → fail
↓
Check if refresh token exists in in-memory refreshTokens array
↓
If token not found → fail
↓
Verify refresh token using jwt.verify
↓
If token invalid or expired → fail
↓
If valid → generate new Access Token
↓
Send new Access Token back in response
*/
router.post("/refresh", (req,res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token missing"
        });
    }
    const tokenExists = refreshTokens.includes(refreshToken);

    if (!tokenExists) {
        return res.status(403).json({
            message: "Invalid refresh token"
        });
    }
    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);

        const newAccessToken = jwt.sign(
            {
                userId: decoded.userId,
                role: "user"
            },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            message: "Access token refreshed successfully",
            token: newAccessToken
        });
    } catch (error) {
        return res.status(403).json({
            message: "Refresh token expired or invalid"
        });
    }

})

// confirms JWT works
router.get("/me", authMiddleware, (req, res) => {
    return res.status(200).json({
      message: "User info fetched successfully",
      user: req.user,
    });
  });


export default router;