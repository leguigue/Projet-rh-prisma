const express = require('express');
const employeRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const authguard = require('../services/authguard');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration pour les avatars
const avatarStorage = multer.diskStorage({ 
    destination: (req, file, cb) => {
       cb(null, 'uploads/avatars/');
   },
   filename: (req, file, cb) => {
       cb(null, Date.now() + path.extname(file.originalname));
   }
});
const uploadAvatar = multer({ storage: avatarStorage });

// Configuration pour les fichiers de tâches
const taskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads', 'completedtasks');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadTaskFile = multer({ storage: taskStorage });

employeRouter.post('/employe-login', async (req, res) => {
    try {
        const employe = await prisma.employe.findUnique({
            where: { email: req.body.email }
        });

        if (!employe) {
            throw new Error("Employé non trouvé");
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, employe.password);

        if (!isPasswordValid) {
            throw new Error("Mot de passe incorrect");
        }

        req.session.userId = employe.id;
        req.session.userRole = 'employe';

        req.session.save((err) => {
            if (err) {
                return res.status(500).send("Erreur lors de la connexion");
            }
            res.redirect('/home');
        });

    } catch (error) {
        console.error("Erreur de connexion employé:", error);
        res.render("pages/login.twig", { error: error.message });
    }
});

employeRouter.post('/update-avatar', authguard, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const updatedEmploye = await prisma.employe.update({
            where: { id: req.user.id },
            data: { avatar: req.file.path }
        });
        return res.redirect('/home');
    } catch (error) {
        return res.status(500).send("Erreur lors de la mise à jour de l'avatar");
    }
});

employeRouter.post('/upload-tache-fichier/:tacheId', authguard, uploadTaskFile.single('fichier'), async (req, res) => {
    try {
        await prisma.tache.update({
            where: { id: parseInt(req.params.tacheId) },
            data: { fichierPath: req.file.path }
        });
        return res.redirect('/home');
    } catch (error) {
        return res.status(500).send("Erreur lors du téléchargement du fichier");
    }
});

employeRouter.post('/valider-tache/:id', authguard, uploadTaskFile.single('fichier'), async (req, res) => {
    try {
        const { commentaire } = req.body;
        const tacheId = parseInt(req.params.id);

        const updateData = {
            completed: true,
            commentaire: commentaire || null
        };

        if (req.file) {
            updateData.fichierCompletionPath = req.file.path;
        }

        await prisma.tache.update({
            where: { id: tacheId },
            data: updateData
        });

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de la validation de la tâche:", error);
        res.status(500).send("Erreur lors de la validation de la tâche");
    }
});

employeRouter.get('/logout', authguard, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erreur lors de la destruction de la session:", err);
        }
        res.redirect('/login');
    });
});
employeRouter.post('/declarer-panne', authguard, async (req, res) => {
    try {
      const { description, latitude, longitude, adresse } = req.body;
      const employeId = req.user.id;
  
      const employe = await prisma.employe.findUnique({
        where: { id: employeId },
        include: { ordinateur: true }
      });
  
      if (!employe.ordinateur) {
        return res.status(400).send("Vous n'avez pas d'ordinateur assigné");
      }
  
      await prisma.ordinateur.update({
        where: { id: employe.ordinateur.id },
        data: { 
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          adresse,
          enPanne: true,
          datePane: new Date()
        }
      });
  
      const panne = await prisma.panne.create({
        data: {
          description,
          ordinateur: { connect: { id: employe.ordinateur.id } },
          employe: { connect: { id: employeId } },
          entreprise: { connect: { id: employe.entrepriseId } }
        }
      });
      
      await notifierEntreprise(panne.id);
      
      res.redirect('/home');
    } catch (error) {
      console.error("Erreur lors de la déclaration de panne:", error);
      res.status(500).send("Erreur lors de la déclaration de panne");
    }
  });
  
  async function notifierEntreprise(panneId) {
    const panne = await prisma.panne.findUnique({
      where: { id: panneId },
      include: { 
        ordinateur: true,
        employe: true,
        entreprise: true
      }
    });
  
    
  }

module.exports = employeRouter;