// middlewares/authMiddleware.js
module.exports = (req, res, next) => {
    const user = req.session.user;
  
    if (!user) {
      return res.redirect("/auth/sign-in"); 
    }

    next();  
  };
  