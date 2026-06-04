# Five Night at Gro

Un jeu web d'horreur de survie statique de type "Five Nights at Freddy's", conçu pour être facilement personnalisé avec vos propres chats.

## Fonctionnalités
- Jeu entièrement en HTML5/CSS3/JavaScript (sans backend)
- Configuration facile via `config.json`
- Système de caméras, d'énergie, portes et horloge
- Jumpscares
- Hébergeable gratuitement sur GitHub Pages

## Comment personnaliser (Ajouter vos chats et vos décors)

Toute la personnalisation se fait en remplaçant les images dans le dossier `assets/` et en modifiant le fichier `config.json`.

1. **Décors (Pièces)** : Placez vos photos réalistes (ex: `cuisine_vide.jpg`) dans `assets/images/rooms/`.
2. **Chats** : Placez les images de vos chats dans `assets/images/cats/`. Vous aurez besoin d'images pour chaque emplacement caméra où ils peuvent apparaître.
3. **Jumpscares** : Placez l'image d'attaque de votre chat (ex: `milo_jump.png`) dans `assets/images/cats/`.
4. **Configuration** : Éditez `config.json` pour faire correspondre le nom des fichiers et gérer le comportement.

> **Exemple de `config.json`** :
> ```json
> {
>   "chat1": {
>     "name": "Milo",
>     "startCamera": "cam2",
>     "aggressionLevel": [2, 3, 5, 7, 10], 
>     "images": {
>       "cam1": "assets/images/cats/milo_couloir.jpg",
>       "jumpscare": "assets/images/cats/milo_jump.png"
>     }
>   }
> }
> ```

## Déploiement et Démarrage Local

### Démarrage avec NPM (Recommandé pour le développement)

Ce projet utilise **Vite** comme serveur de développement local. Pour l'utiliser, assurez-vous d'avoir [Node.js](https://nodejs.org/) installé, puis exécutez les commandes suivantes dans ce dossier :

```bash
npm install
npm start
```
Cela lancera le jeu sur un serveur local (généralement `http://localhost:5173`) et rechargera automatiquement la page si vous modifiez des fichiers.

### Déploiement sur GitHub Pages

Ce projet est prêt à être déployé sur GitHub. Ouvrez un terminal dans ce dossier et exécutez les commandes suivantes :

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM/VOTRE_DEPOT.git
git push -u origin main
```

**Pour activer GitHub Pages :**
1. Allez sur la page de votre dépôt sur GitHub.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans le menu de gauche, cliquez sur **Pages**.
4. Sous *Source*, sélectionnez **Deploy from a branch**.
5. Sous *Branch*, choisissez `main` et le dossier `/ (root)`.
6. Cliquez sur **Save**. Votre jeu sera en ligne d'ici quelques minutes.

## Licence
Ce projet est libre de droits pour un usage personnel.
