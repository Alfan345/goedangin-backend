function generateResiCode(type) {
  const prefix = type.slice(0, 3).toLowerCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${randomNum}`;
}

module.exports = generateResiCode;
