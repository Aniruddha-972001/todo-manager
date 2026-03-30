import jwt from "jsonwebtoken";
const JWT_SECRET = "mysecretkey";


/*
Read Authorization header from req.headers
↓
If header missing → return 401 (Unauthorized)
↓
Extract token from "Bearer <token>" format
↓
If token missing → return 401
↓
Verify token using jwt.verify
↓
If token invalid or expired → return 403 (Forbidden)
↓
Extract payload (userId, role)
↓
Attach user info to req.user
↓
Call next()
↓
Request proceeds to actual route handler
*/
function authMiddleware(req,res,next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({
            message: "Missing Authorization Header",
        });
    }
    const token = authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message: "Missing Token",
        });
    }

    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    }catch(error){
        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
}   

export default authMiddleware;