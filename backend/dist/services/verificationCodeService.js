"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
class VerificationCodeService {
    constructor() {
        this.verificationCodes = new Map();
        this.expirationTime = parseInt(process.env.VERIFICATION_CODE_EXPIRATION || '300'); // 5 minutes default
        // Clean up expired codes every minute
        setInterval(() => {
            const now = Date.now();
            this.verificationCodes.forEach((code, phoneNumber) => {
                if (code.expiresAt < now) {
                    this.verificationCodes.delete(phoneNumber);
                }
            });
        }, 60000);
    }
    static getInstance() {
        if (!VerificationCodeService.instance) {
            VerificationCodeService.instance = new VerificationCodeService();
        }
        return VerificationCodeService.instance;
    }
    /**
     * Store a verification code for a phone number
     * @param phoneNumber - The phone number to store the code for
     * @param code - The verification code to store
     */
    storeVerificationCode(phoneNumber, code) {
        const expiresAt = Date.now() + this.expirationTime * 1000;
        this.verificationCodes.set(phoneNumber, { code, expiresAt });
    }
    /**
     * Check if a verification code is valid for a phone number
     * @param phoneNumber - The phone number to check
     * @param code - The verification code to check
     * @returns True if the code is valid, false otherwise
     */
    checkVerificationCode(phoneNumber, code) {
        if (!this.verificationCodes.has(phoneNumber)) {
            return false;
        }
        const verificationCode = this.verificationCodes.get(phoneNumber);
        const now = Date.now();
        // Check if code is expired
        if (verificationCode.expiresAt < now) {
            this.verificationCodes.delete(phoneNumber);
            return false;
        }
        // Check if code matches
        return verificationCode.code === code;
    }
    /**
     * Remove a verification code for a phone number
     * @param phoneNumber - The phone number to remove the code for
     */
    removeVerificationCode(phoneNumber) {
        this.verificationCodes.delete(phoneNumber);
    }
}
exports.default = VerificationCodeService.getInstance();
