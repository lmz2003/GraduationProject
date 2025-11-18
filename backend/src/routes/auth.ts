import express from 'express';
import verificationCodeService from '../services/verificationCodeService';
import jwtService from '../services/jwtService';

const router = express.Router();

// Generate verification code
router.post('/send-code', (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number (simplified regex)
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the code in memory with expiration time
    verificationCodeService.storeVerificationCode(phoneNumber, verificationCode);

    // TODO: Send SMS with verification code (mock for now)
    console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);

    res.status(200).json({ message: 'Verification code sent successfully' });
  } catch (error) {
    console.error('Error in send-code:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
});

// Verify login credentials
router.post('/login', (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    // Validate phone number (simplified regex)
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Validate verification code
    const isCodeValid = verificationCodeService.checkVerificationCode(phoneNumber, code);

    if (!isCodeValid) {
      return res.status(401).json({ message: 'Invalid or expired verification code' });
    }

    // Remove the used verification code
    verificationCodeService.removeVerificationCode(phoneNumber);

    // Generate JWT token
    const token = jwtService.generateToken({ phoneNumber });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

export default router;