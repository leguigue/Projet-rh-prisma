const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authguard = async (req, res, next) => {
  if (!req.session.userId || !req.session.userRole) {

      return res.redirect('/login');
  }

  try {
      let user;
      if (req.session.userRole === 'entreprise') {
          user = await prisma.entreprise.findUnique({ where: { id: req.session.userId } });
      } else if (req.session.userRole === 'employe') {
          user = await prisma.employe.findUnique({ where: { id: req.session.userId } });
      }

      if (!user) {

          return res.redirect('/login');
      }
      req.user = {
          ...user,
          role: req.session.userRole
      };
      next();      
  } catch (error) {
      console.error("Erreur lors de la vérification de l'utilisateur:", error.message);
      return res.redirect('/login');
  }
};

module.exports = authguard;