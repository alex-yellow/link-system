// middleware.js
const isAuth = (req, res, next) => {
    if (req.session.user) {
      res.locals.user = req.session.user;
      next();
    }
    else{
        return res.redirect('/signin');
    }
  };
  
  module.exports = { isAuth };