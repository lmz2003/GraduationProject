"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class JwtService {
    constructor() {
        this.secretKey = process.env.JWT_SECRET || 'mysecretjwtkey12345678901234567890';
    }
    static getInstance() {
        if (!JwtService.instance) {
            JwtService.instance = new JwtService();
        }
        return JwtService.instance;
    }
    /**
     * Generate a JWT token with the given payload
     * @param payload - The payload to include in the token
     * @param expiresIn - The expiration time for the token (default: '1h')
     * @returns The generated JWT token
     */
    generateToken(payload, expiresIn = '1h') {
        return jsonwebtoken_1.default.sign(payload, this.secretKey, { expiresIn });
    }
    /**
     * Verify a JWT token and return the decoded payload
     * @param token - The JWT token to verify
     * @returns The decoded payload if the token is valid, otherwise null
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.secretKey);
        }
        catch (error) {
            console.error('JWT verification failed:', error);
            return null;
        }
    }
}
exports.default = JwtService.getInstance();
