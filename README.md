# trappist-1
Présentation du système Trappist 1

---

## Classe `Exoplanets`

La classe `Exoplanets` permet de visualiser dynamiquement les orbites d'un système planétaire (comme TRAPPIST-1 ou le Système solaire) en SVG, avec gestion des traînées, de la zone d'habitabilité, du zoom, et des animations.

### Dépendances
- [d3.js](https://d3js.org/) (inclus via CDN dans l'exemple HTML)

### Utilisation de base
```html
<!-- Dans votre HTML -->
<div id="exoplanet-viz"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<script src="js/exoplanets.js"></script>
<script src="data/trappist-1.js"></script>
<script>
  // Les données doivent être au format attendu (voir ci-dessous)
  const exo = new Exoplanets('exoplanet-viz', exoplanetData, {
    width: 800,
    height: 600,
    animationSpeed: 1,
    showTrails: true,
    showOrbits: true,
    showHabitableZone: true
  });
</script>
```

### Format des données attendues
```js
const exoplanetData = {
  star: {
    name: "TRAPPIST-1",
    radius: 0.121, // en rayons solaires
    color: "#FF6B35",
    mass: 0.089, // en masses solaires
    temperature: 2511 // en Kelvin
  },
  planets: [
    {
      id: "trappist-1b",
      name: "TRAPPIST-1b",
      radius: 1.116, // en rayons terrestres
      semiMajorAxis: 0.01154, // en UA
      orbitalPeriod: 1.51087, // en jours
      mass: 1.374, // en masses terrestres
      color: "#E74C3C",
      temperature: 400, // en Kelvin
      eccentricity: 0.006
    },
    // ... autres planètes ...
  ]
}
```

### Principales options du constructeur
- `width`, `height` : dimensions du SVG
- `animationSpeed` : vitesse de l'animation
- `showTrails` : afficher les traînées des planètes
- `fadeTrails` : estomper les traînées
- `showOrbits` : afficher les orbites
- `starTwinkle` : scintillement de l'étoile
- `twinkleSpeed` : vitesse du scintillement
- `showHabitableZone` : afficher la zone d'habitabilité
- `enableZoom` : activer le zoom interactif
- `minZoom`, `maxZoom` : limites du zoom
- `timeScale` : accélération du temps (utile pour comparer systèmes)
- `showStarryBackground` : afficher le fond étoilé (par défaut : true)
- `showComet` : afficher la comète animée dans le fond (par défaut : true)

### Méthodes principales
- `play()`

---

# Visualisation du système TRAPPIST-1

Ce projet permet de visualiser dynamiquement les orbites d’un système planétaire (comme TRAPPIST-1 ou le Système solaire) en SVG, avec de nombreuses options d’affichage et d’animation.

## Dépendances

- [d3.js](https://d3js.org/) (inclus via CDN)

## Installation et utilisation

1. **Inclure les scripts dans votre HTML :**
   ```html
   <div id="exoplanet-viz"></div>
   <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
   <script src="js/exoplanets.js"></script>
   <script src="data/trappist-1.js"></script>
   <script>
     const exo = new Exoplanets('exoplanet-viz', exoplanetData, {
       width: 800,
       height: 600,
       animationSpeed: 1,
       showTrails: true,
       showOrbits: true,
       showHabitableZone: true
     });
   </script>
   ```

2. **Format des données attendues :**
   ```js
   const exoplanetData = {
     star: {
       name: "TRAPPIST-1",
       radius: 0.121, // en rayons solaires
       color: "#FF6B35",
       mass: 0.089, // en masses solaires
       temperature: 2511 // en Kelvin
     },
     planets: [
       {
         id: "trappist-1b",
         name: "TRAPPIST-1b",
         radius: 1.116, // en rayons terrestres
         semiMajorAxis: 0.01154, // en UA
         orbitalPeriod: 1.51087, // en jours
         mass: 1.374, // en masses terrestres
         color: "#E74C3C",
         temperature: 400, // en Kelvin
         eccentricity: 0.006
       },
       // ... autres planètes ...
     ]
   }
   ```

## Propriétés/options du composant

Le constructeur de la classe `Exoplanets` accepte un objet d’options pour personnaliser la visualisation :

| Option                  | Type      | Description                                                                 | Valeur par défaut |
|-------------------------|-----------|-----------------------------------------------------------------------------|-------------------|
| `width`                 | Number    | Largeur du SVG                                                              | 800               |
| `height`                | Number    | Hauteur du SVG                                                              | 600               |
| `animationSpeed`        | Number    | Vitesse de l’animation                                                      | 1                 |
| `showTrails`            | Boolean   | Afficher les traînées des planètes                                          | true              |
| `fadeTrails`            | Boolean   | Estomper les traînées                                                       | false             |
| `showOrbits`            | Boolean   | Afficher les orbites                                                        | true              |
| `starTwinkle`           | Boolean   | Scintillement de l’étoile                                                   | false             |
| `twinkleSpeed`          | Number    | Vitesse du scintillement                                                    | 1                 |
| `showHabitableZone`     | Boolean   | Afficher la zone d’habitabilité                                             | true              |
| `enableZoom`            | Boolean   | Activer le zoom interactif                                                  | false             |
| `minZoom`               | Number    | Zoom minimum                                                                | 0.5               |
| `maxZoom`               | Number    | Zoom maximum                                                                | 5                 |
| `timeScale`             | Number    | Accélération du temps (pour comparer plusieurs systèmes)                    | 1                 |
| `showStarryBackground`  | Boolean   | Afficher le fond étoilé                                                     | true              |
| `showComet`             | Boolean   | Afficher la comète animée dans le fond                                      | true              |

## Méthodes principales

- `play()` : Démarre ou reprend l’animation.
- `pause()` : Met en pause l’animation.
- `reset()` : Réinitialise la simulation.
- `setOption(option, value)` : Modifie dynamiquement une option.

## Exemple d’utilisation avancée

```js
<code_block_to_apply_changes_from>
```

---

N’hésite pas à demander si tu veux un exemple plus détaillé ou une documentation en anglais !