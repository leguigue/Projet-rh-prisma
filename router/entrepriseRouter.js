const express = require('express');
const entrepriseRouter = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const authguard = require('../services/authguard');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "ab413222a07978",
        pass: "edaa9d85007373"
    }
});

async function sendEmail(to, subject, text) {
    try {
        const info = await transporter.sendMail({
            from:"superentreprise@gmail.com",
            to: to,
            subject: subject,
            text: text,
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    }
}

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const taskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/giventasks/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadAvatar = multer({ storage: avatarStorage });
const uploadTaskFile = multer({ storage: taskStorage });

entrepriseRouter.get('/login', (req, res) => {
    res.render("pages/login.twig");
});

entrepriseRouter.post('/login', async (req, res) => {
    try {
        if (!req.body.siret) {
            throw new Error("Le numéro SIRET est requis");
        }

        const entreprise = await prisma.entreprise.findUnique({
            where: { siret: req.body.siret }
        });

        if (!entreprise) {
            throw new Error("Entreprise non trouvée");
        }

        const isPasswordValid = await bcrypt.compare(req.body.password, entreprise.password);

        if (!isPasswordValid) {
            throw new Error("Mot de passe incorrect");
        }

        req.session.userId = entreprise.id;
        req.session.userRole = 'entreprise';

        req.session.save((err) => {
            if (err) {
                return res.status(500).send("Erreur lors de la connexion");
            }
            res.redirect('/home');
        });

    } catch (error) {
        console.error("Erreur de connexion:", error);
        res.render("pages/login.twig", { error: error.message });
    }
});

entrepriseRouter.get('/register', (req, res) => {
    res.render("pages/register.twig");
});

entrepriseRouter.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const entreprise = await prisma.entreprise.create({
            data: {
                name: req.body.name,
                mail: req.body.mail,
                password: hashedPassword,
                director: req.body.director,
                siret: req.body.siret
            }
        });
        res.redirect('/login');
    } catch (error) {
        res.render("pages/register.twig", { error: error.message });
    }
});

entrepriseRouter.get('/', authguard, async (req, res) => {
    try {
        const entreprise = await prisma.entreprise.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                mail: true,
                director: true,
                siret: true,
                employes: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        fonction: true,
                        age: true,
                        sexe: true,
                        avatar: true,
                        ordinateur: {
                            select: {
                                id: true,
                                nom: true,
                                macAddress: true
                            }
                        },
                        taches: {
                            where: {
                                completed: false
                            },
                            select: {
                                id: true,
                                description: true,
                                deadline: true
                            }
                        },
                        blames: {
                            select: {
                                id: true,
                                description: true,
                                date: true
                            }
                        }
                    }
                },
                ordinateurs: {
                    select: {
                        id: true,
                        nom: true,
                        macAddress: true,
                        enPanne: true,
                        datePane: true,
                        employe: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!entreprise) {
            return res.status(404).send("Entreprise non trouvée");
        }

        const tachesEnCours = entreprise.employes.reduce((total, employe) => {
            return total + employe.taches.length;
        }, 0);

        const fonctions = [...new Set(entreprise.employes.map(employe => employe.fonction))];

        // Vérification de cohérence
        const employesAvecOrdinateur = entreprise.employes.filter(e => e.ordinateur).length;
        const ordinateursAssignes = entreprise.ordinateurs.filter(o => o.employe).length;

        if (employesAvecOrdinateur !== ordinateursAssignes) {
            console.warn("Incohérence détectée : le nombre d'employés avec ordinateur ne correspond pas au nombre d'ordinateurs assignés");
        }

        res.render("pages/home.twig", {
            user: {
                ...entreprise,
                role: 'entreprise' // Utilisez cette version mise à jour
            },
            tachesEnCours,
            fonctions
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des données de l'entreprise:", error);
        res.status(500).send("Une erreur est survenue lors du chargement de la page d'accueil");
    }
});

entrepriseRouter.post('/ajouter-employe', authguard, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const nouvelEmploye = await prisma.employe.create({
            data: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                fonction: req.body.fonction,
                password: hashedPassword,
                age: parseInt(req.body.age),
                sexe: req.body.sexe === 'autre' ? req.body.autreSexe : req.body.sexe,
                entrepriseId: req.user.id,
                avatar: req.file ? req.file.path : undefined
            }
        });

        await sendEmail(
            nouvelEmploye.email,
            "Bienvenue dans l'entreprise",
            `Bonjour ${nouvelEmploye.firstName},\n\nVotre compte a été créé avec succès. Bienvenue dans l'entreprise !`
        );
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de l'ajout de l'employé");
    }
});

entrepriseRouter.post('/ajouter-ordinateur', authguard, async (req, res) => {
    try {
        const { nom, macAddress } = req.body;

        if (!nom || !macAddress) {
            return res.status(400).json({ message: "Le nom et l'adresse MAC sont requis" });
        }

        const nouvelOrdinateur = await prisma.ordinateur.create({
            data: {
                nom,
                macAddress,
                entrepriseId: req.user.id
            }
        });
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'ajout de l'ordinateur", error: error.message });
    }
});

entrepriseRouter.post('/supprimer-ordinateur/:id', authguard, async (req, res) => {
    try {
        await prisma.ordinateur.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.redirect('/home');
    } catch (error) {
        res.status(500).send("Erreur lors de la suppression de l'ordinateur");
    }
});

// entrepriseRouter.post('/associer-employe-ordinateur', authguard, async (req, res) => {
//     if (req.user.role !== 'entreprise') {
//         return res.status(403).json({ success: false, error: "Accès non autorisé" });
//     }

//     try {
//         const { employeId, ordinateurId } = req.body;

//         if (!employeId || !ordinateurId) {
//             return res.status(400).json({ success: false, error: "ID de l'employé et de l'ordinateur requis" });
//         }

//         // Commencez une transaction
//         const result = await prisma.$transaction(async (prisma) => {
//             // Vérifiez si l'employé a déjà un ordinateur
//             const employeExistant = await prisma.employe.findUnique({
//                 where: { id: parseInt(employeId) },
//                 include: { ordinateur: true }
//             });

//             if (employeExistant.ordinateur) {
//                 // Si l'employé a déjà un ordinateur, déconnectez-le
//                 await prisma.ordinateur.update({
//                     where: { id: employeExistant.ordinateur.id },
//                     data: { employeId: null }
//                 });
//             }

//             // Vérifiez si l'ordinateur est déjà assigné à un employé
//             const ordinateurExistant = await prisma.ordinateur.findUnique({
//                 where: { id: parseInt(ordinateurId) },
//                 include: { employe: true }
//             });

//             if (ordinateurExistant.employe) {
//                 // Si l'ordinateur est déjà assigné, déconnectez-le de l'employé actuel
//                 await prisma.employe.update({
//                     where: { id: ordinateurExistant.employe.id },
//                     data: { ordinateurId: null }
//                 });
//             }

//             // Mettez à jour l'employé avec le nouvel ordinateur
//             const updatedEmploye = await prisma.employe.update({
//                 where: { id: parseInt(employeId) },
//                 data: { ordinateurId: parseInt(ordinateurId) },
//                 include: { ordinateur: true }
//             });

//             // Mettez à jour l'ordinateur avec le nouvel employé
//             await prisma.ordinateur.update({
//                 where: { id: parseInt(ordinateurId) },
//                 data: { employeId: parseInt(employeId) }
//             });

//             return updatedEmploye;
//         });

//         res.json({
//             success: true,
//             message: "Association réussie",
//             employe: {
//                 id: result.id,
//                 firstName: result.firstName,
//                 lastName: result.lastName,
//                 ordinateur: result.ordinateur
//             }
//         });
//     } catch (error) {
//         console.error('Erreur lors de l\'association employé-ordinateur:', error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });

entrepriseRouter.post('/assigner-tache', authguard, uploadTaskFile.single('fichier'), async (req, res) => {
    try {
        const { employeId, description, deadline } = req.body;

        if (!description && !req.file) {
            return res.status(400).send("La tâche ne peut pas être vide. Veuillez fournir une description ou un fichier.");
        }

        const nouvelleTache = await prisma.tache.create({
            data: {
                description: description || "Fichier joint",
                deadline: new Date(deadline),
                employeId: parseInt(employeId),
                entrepriseId: req.user.id,
                fichierPath: req.file ? req.file.path : null
            }
        });

        const employe = await prisma.employe.findUnique({
            where: { id: parseInt(employeId) }
        });
        await sendEmail(
            employe.email,
            "Nouvelle tâche assignée",
            `Bonjour ${employe.firstName},\n\nUne nouvelle tâche vous a été assignée : ${description || "Fichier joint"}\nDate limite : ${deadline}`
        );

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de l'assignation de la tâche:", error);
        res.status(500).send("Erreur lors de l'assignation de la tâche");
    }
});

entrepriseRouter.post('/terminer-tache/:id', authguard, async (req, res) => {
    try {
        await prisma.tache.update({
            where: { id: parseInt(req.params.id) },
            data: { completed: true }
        });
        res.redirect('/home');
    } catch (error) {
        res.status(500).send("Erreur lors de la mise à jour de la tâche");
    }
});

entrepriseRouter.get('/logout', authguard, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erreur lors de la destruction de la session:", err);
        }
        res.redirect('/login');
    });
});

entrepriseRouter.get('/employe-profile/:id', authguard, async (req, res) => {
    try {
        const employe = await prisma.employe.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                ordinateur: true,
                blames: true
            }
        });
        res.json(employe);
    } catch (error) {
        res.status(500).send("Erreur lors de la récupération du profil de l'employé");
    }
});

entrepriseRouter.post('/modifier-employe', authguard, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        const { employeId, firstName, lastName, email, fonction, age, sexe } = req.body;

        let updateData = {
            firstName,
            lastName,
            email,
            fonction,
            age: parseInt(age),
            sexe: sexe === 'autre' ? req.body.autreSexe : sexe
        };

        if (req.file) {
            updateData.avatar = req.file.path;
        }

        const updatedEmploye = await prisma.employe.update({
            where: { id: parseInt(employeId) },
            data: updateData
        });

        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur lors de la modification de l'employé");
    }
});

entrepriseRouter.post('/ajouter-blame', authguard, async (req, res) => {
    const { employeId, description } = req.body;

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const newBlame = await prisma.blame.create({
                data: {
                    description,
                    employeId: parseInt(employeId),
                    entrepriseId: req.user.id
                }
            });

            const blames = await prisma.blame.count({
                where: { employeId: parseInt(employeId) }
            });

            const employe = await prisma.employe.findUnique({
                where: { id: parseInt(employeId) }
            });

            await sendEmail(
                employe.email,
                "Nouveau blâme reçu",
                `Bonjour ${employe.firstName},\n\nVous avez reçu un nouveau blâme : ${description}`
            );

            if (blames >= 3) {
                await prisma.employe.update({
                    where: { id: parseInt(employeId) },
                    data: { ordinateurId: null }
                });
                await prisma.employe.delete({
                    where: { id: parseInt(employeId) }
                });
                return { success: true, employeDeleted: true, message: "Employé supprimé après 3 blâmes" };
            }

            return { success: true, message: "Blâme ajouté avec succès" };
        });

        res.json(result);
    } catch (error) {
        console.error('Error in /ajouter-blame:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

entrepriseRouter.post('/supprimer-employe/:id', authguard, async (req, res) => {
    try {
        const employeId = parseInt(req.params.id);
        const employe = await prisma.employe.findUnique({
            where: { id: employeId }
        });
        // Déconnecter l'ordinateur de l'employé avant de le supprimer
        await prisma.employe.update({
            where: { id: employeId },
            data: { ordinateurId: null }
        });
        await prisma.employe.delete({
            where: { id: employeId }
        });
        await sendEmail(
            employe.email,
            "Suppression de votre compte",
            `Bonjour ${employe.firstName},\n\nNous vous informons que votre compte a été supprimé de notre système.`
        );

        res.redirect('/home');
    } catch (error) {
        console.error("Erreur lors de la suppression de l'employé:", error);
        res.status(500).send("Erreur lors de la suppression de l'employé");
    }
});
entrepriseRouter.get('/pannes', authguard, async (req, res) => {
    const pannes = await prisma.panne.findMany({
      where: { 
        entrepriseId: req.user.id,
        resolu: false
      },
      include: { 
        ordinateur: true,
        employe: true
      }
    });
  
    res.render('pages/home.twig', { pannes });
  });
  
  entrepriseRouter.post('/resoudre-panne/:id', authguard, async (req, res) => {
    const panneId = parseInt(req.params.id);
  
    await prisma.panne.update({
      where: { id: panneId },
      data: { resolu: true }
    });
  
    await prisma.ordinateur.update({
      where: { id: (await prisma.panne.findUnique({ where: { id: panneId } })).ordinateurId },
      data: { enPanne: false, datePane: null }
    });
  
    res.redirect('/pannes');
  });
//   entrepriseRouter.post('/desassigner-ordinateur', authguard, async (req, res) => {
//     if (req.user.role !== 'entreprise') {
//         return res.status(403).json({ success: false, error: "Accès non autorisé" });
//     }

//     try {
//         const { employeId } = req.body;
//         const employe = await prisma.employe.findUnique({
//             where: { id: parseInt(employeId) },
//             include: { ordinateur: true }
//         });
//         if (!employe) {
//             return res.status(404).json({ success: false, error: "Employé non trouvé" });
//         }
//         if (!employe.ordinateur) {
//             return res.status(400).json({ success: false, error: "Cet employé n'a pas d'ordinateur assigné" });
//         }
//         const updatedEmploye = await prisma.employe.update({
//             where: { id: parseInt(employeId) },
//             data: { ordinateurId: null },
//             include: { ordinateur: true }
//         });
//         await prisma.ordinateur.update({
//             where: { id: employe.ordinateur.id },
//             data: { employeId: null }
//         });
//         res.json({
//             success: true,
//             message: "Ordinateur désassigné avec succès",
//             employe: {
//                 id: updatedEmploye.id,
//                 firstName: updatedEmploye.firstName,
//                 lastName: updatedEmploye.lastName,
//                 ordinateur: null
//             }
//         });
//     } catch (error) {
//         console.error('Erreur lors de la désassignation de l\'ordinateur:', error);
//         res.status(500).json({ success: false, error: error.message });
//     }
// });
entrepriseRouter.post('/associer-employe-ordinateur', authguard, async (req, res) => {
    const { employeId, ordinateurId } = req.body;
    try {
        const updatedOrdinateur = await prisma.ordinateur.update({
            where: {
                id: parseInt(ordinateurId)
            },
            data: {
                employe: {
                    connect: { id: parseInt(employeId) }
                }
            },
            include: {
                employe: true
            }
        });

        const updatedEmploye = await prisma.employe.findUnique({
            where: { id: parseInt(employeId) },
            include: { ordinateur: true }
        });

        res.json({ 
            success: true, 
            ordinateur: updatedOrdinateur,
            employe: updatedEmploye
        });
    } catch (error) {
        console.error('Erreur lors de l\'association employé-ordinateur:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
  
entrepriseRouter.post('/desassigner-ordinateur', authguard, async (req, res) => {
    const { employeId, ordinateurId } = req.body;
    try {
        const ordinateur = await prisma.ordinateur.findUnique({
            where: {
                id: parseInt(ordinateurId)
            }
        });

        if (!ordinateur) {
            return res.status(404).json({ success: false, error: "Ordinateur non trouvé" });
        }

        const updatedOrdinateur = await prisma.ordinateur.update({
            where: {
                id: parseInt(ordinateurId)
            },
            data: {
                employe: {
                    disconnect: true
                }
            }
        });

        res.json({ success: true, ordinateurId: updatedOrdinateur.id });
    } catch (error) {
        console.error('Erreur lors de la désassignation :', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = entrepriseRouter;