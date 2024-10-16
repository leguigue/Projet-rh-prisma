const express = require('express');
const entrepriseRouter = require('./router/entrepriseRouter');
const employeRouter = require("./router/employeRouter");
const session = require('express-session');
const path = require('path');
const authguard = require('./services/authguard'); 
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.set('view engine', 'twig');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'proutprout',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
    }
}));


// Generic route for /home
app.get('/home', authguard, async (req, res) => {
    try {
        if (req.user.role === 'entreprise') {            
            const entreprise = await prisma.entreprise.findUnique({
                where: { id: req.user.id },
                include: {
                    employes: {
                        include: {
                            ordinateur: true,
                            taches: true,
                            blames: true
                        }
                    },
                    ordinateurs: true
                }
            });
    
            
            const tachesEnCours = entreprise.employes.reduce((total, employe) => {
                return total + employe.taches.filter(tache => !tache.completed).length;
            }, 0);
            const fonctions = [...new Set(entreprise.employes.map(employe => employe.fonction))];
            res.render("pages/home.twig", { 
                user: { ...entreprise, role: 'entreprise' },
                tachesEnCours,
                fonctions
            });
        } else if (req.user.role === 'employe') {
            const employe = await prisma.employe.findUnique({
                where: { id: req.user.id },
                include: {
                    ordinateur: true,
                    taches: true,
                    blames: true
                }
            });
            res.render("pages/home.twig", { user: { ...employe, role: 'employe' } });
        } else {
            res.status(403).send("Accès non autorisé");
        }
    } catch (error) {
        console.error("Erreur dans /home:", error);
        res.status(500).send("Une erreur est survenue");
    }
});



app.use('/', entrepriseRouter);
app.use('/', employeRouter);

app.listen(3000, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Server running on port 3000');
    }
});