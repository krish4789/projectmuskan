const router = require('express').Router();
const { register, login, googleAuth } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/auth/google', googleAuth);

module.exports = router;
