const validatePassword = (password) => {
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!hasCapital) return "Password must contain at least one capital letter.";
  if (!hasSpecial) return "Password must contain at least one special character.";
  return null;
};

module.exports = { validatePassword };
