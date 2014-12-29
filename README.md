moodle-trace-analytics
======================

Ce projet est un site web basé sur le framework Express. Il s'appuye sur les traces collectées par le projet moodle-trace-reader.

Il permet de naviguer visuellement dans les traces disponibles dans MongoDB et de récupérer directement les données utilisées pour chacun des graphiques en ajoutant /api à la racine de l'URL consultée.

Les graphiques présentés dans l'application utilisent deux frameworks différents de visualisation : vis.js pour les affichages en timeline, et d3.js pour les autres graphiques.

Pour installer et lancer le serveur, vous devez cloner ce projet, puis préparer son lancement en utilisant la commande suivante à la racine du projet :

```
nohup npm start
```

Le serveur démarrera automatiquement après la coupure de la connexion SSH.