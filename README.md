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