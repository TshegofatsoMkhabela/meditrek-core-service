const bcrypt = require("bcrypt");

// Hash a plain-text password
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    // Generate a salt with 12 rounds
    bcrypt.genSalt(12, (error, salt) => {
      if (error) {
        reject(error);
      }

      // Hash the password using the salt
      bcrypt.hash(password, salt, (error, hash) => {
        if (error) {
          reject(error);
        }
        resolve(hash);
      });
    });
  });
};

// Compare a plain-text password with a hashed password
const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

module.exports = {
  hashPassword,
  comparePassword,
};
