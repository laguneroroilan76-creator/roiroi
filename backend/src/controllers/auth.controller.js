const authService = require('../services/auth.service');
const { validatePassword } = require('../utils/validation');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, name, role, canApprove } = req.body;
    
    const error = validatePassword(password);
    if (error) return res.status(400).json({ error });

    const user = await authService.register({ email, password, name, role, canApprove });
    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, register, getMe };
