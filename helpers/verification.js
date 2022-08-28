const jwt = require("jsonwebtoken");

require("dotenv/config");

module.exports = function (req, res, next) {
  //reciving auth-token from header
  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    //verifing token
    const verified = jwt.verify(token, process.env.SECRET);
    req.user = verified;
    //if success continue
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};
