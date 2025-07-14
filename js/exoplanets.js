// Bibliothèque Exoplanets
class Exoplanets {
    constructor(containerId, data, options = {}) {
        this.containerId = containerId;
        this.data = data;
        this.options = {
            width: 800,
            height: 600,
            animationSpeed: 1,
            showTrails: true,
            showOrbits: true,
            fadeTrails: true,
            starTwinkle: true,
            twinkleSpeed: 8,
            showHabitableZone: true,
            enableZoom: true,
            minZoom: 0.5,
            maxZoom: 3,
            timeScale: 1, // Ajouté pour contrôler la vitesse du temps
            ...options
        };
        
        this.svg = null;
        this.simulation = null;
        this.isPlaying = true;
        this.animationId = null;
        this.time = 0;
        this.trails = {};
        this.maxTrailLength = 50;
        this.habitableZone = null;
        this.zoom = null;
        this.currentZoom = 1;
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.setupZoom();
        this.setupScales();
        this.calculateHabitableZone();
        this.createElements();
        this.setupAnimation();
        this.createLegend();
    }
    
    calculateHabitableZone() {
        // Calcul de la zone d'habitabilité basé sur la luminosité de l'étoile
        // Formule de luminosité : L = 4πR²σT⁴ où σ est la constante de Stefan-Boltzmann
        
        const starTemp = this.data.star.temperature;
        const starRadius = this.data.star.radius;
        
        // Constante de Stefan-Boltzmann en W⋅m⁻²⋅K⁻⁴
        const STEFAN_BOLTZMANN = 5.670374419e-8;
        
        // Rayon du Soleil en mètres
        const SOLAR_RADIUS_M = 6.957e8;
        
        // Luminosité du Soleil en watts
        const SOLAR_LUMINOSITY_W = 3.828e26;
        
        // Calcul du rayon de l'étoile en mètres
        const starRadiusM = starRadius * SOLAR_RADIUS_M;
        
        // Calcul de la luminosité de l'étoile en watts
        const starLuminosityW = 4 * Math.PI * Math.pow(starRadiusM, 2) * STEFAN_BOLTZMANN * Math.pow(starTemp, 4);
        
        // Conversion en luminosité solaire
        const luminosity = starLuminosityW / SOLAR_LUMINOSITY_W;
        
        // Calcul des limites de la zone d'habitabilité
        // Limite interne (zone chaude) : ~0.75 * sqrt(L)
        // Limite externe (zone froide) : ~1.77 * sqrt(L)
        const innerLimit = 0.75 * Math.sqrt(luminosity);
        const outerLimit = 1.77 * Math.sqrt(luminosity);
        
        this.habitableZone = {
            inner: innerLimit,
            outer: outerLimit,
            luminosity: luminosity
        };
        starLuminosityW
        console.log(`Luminosité Trappist: ${starLuminosityW}`);
        console.log(`Luminosité Soleil: ${SOLAR_LUMINOSITY_W}`);
        console.log(`Luminosité calculée: ${(luminosity * 100).toFixed(6)}% L☉`);
        console.log(`Zone d'habitabilité calculée: ${innerLimit.toFixed(4)} - ${outerLimit.toFixed(4)} UA`);
    }
    
    createSVG() {
        const container = d3.select(`#${this.containerId}`);
        container.select('svg').remove();
        
        this.svg = container
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .style('background', 'radial-gradient(circle at center, #0a0a0a 0%, #000000 100%)');
        
        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.options.width/2}, ${this.options.height/2})`);
    }
    
    setupZoom() {
        if (!this.options.enableZoom) return;
        
        // Créer la fonction de zoom
        this.zoom = d3.zoom()
            .scaleExtent([this.options.minZoom, this.options.maxZoom])
            .on('zoom', (event) => {
                this.currentZoom = event.transform.k;
                this.g.attr('transform', event.transform);
                
                // Mettre à jour l'échelle des planètes en fonction du zoom
                this.updatePlanetSizes();
                
                // Mettre à jour l'échelle des traînées
                this.updateTrailSizes();
                
                // Mettre à jour l'indicateur de zoom
                this.updateZoomIndicator();
            })
            .on('end', () => {
                // Optionnel : sauvegarder le niveau de zoom
                console.log(`Zoom actuel: ${this.currentZoom.toFixed(2)}x`);
            });
        
        // Appliquer le zoom au SVG
        this.svg.call(this.zoom);
        
        // Ajouter un indicateur de zoom
        this.createZoomIndicator();
    }
    
    setupScales() {
        const maxDistance = d3.max(this.data.planets, d => d.semiMajorAxis);
        const minDistance = d3.min(this.data.planets, d => d.semiMajorAxis);
        const minRadius = 50; // Distance minimale en pixels pour la première orbite
        const maxRadius = Math.min(this.options.width, this.options.height) / 2 - 50;
        // L'échelle commence à minDistance -> minRadius, et maxDistance -> maxRadius
        this.radiusScale = d3.scaleLinear()
            .domain([minDistance, maxDistance])
            .range([minRadius, maxRadius]);
        // Cette ligne crée une échelle linéaire avec D3 qui permet de convertir le rayon réel des planètes (en prenant le minimum et le maximum des rayons présents dans les données) en un rayon affiché à l'écran compris entre 3 et 6 pixels. Cela permet de représenter visuellement les différences de taille entre les planètes tout en gardant des valeurs adaptées à l'affichage SVG.
        this.planetSizeScale = d3.scaleLinear()
            .domain(d3.extent(this.data.planets, d => d.radius))
            .range([3, 6]);
    }
    
    createElements() {
        const self = this;
        // Créer la zone d'habitabilité (avant les orbites pour qu'elle soit en arrière-plan)
        if (this.options.showHabitableZone && this.habitableZone) {
            this.createHabitableZone();
        }
        
        // Créer les orbites
        if (this.options.showOrbits) {
            this.g.selectAll('.orbit-path')
                .data(this.data.planets)
                .enter()
                .append('ellipse')
                .attr('class', 'orbit-path')
                .attr('cx', function(d) {
                    // Décalage du centre de l'ellipse pour que le foyer (étoile) soit au centre
                    const a = self.radiusScale(d.semiMajorAxis);
                    const e = d.eccentricity || 0;
                    return -a * e;
                })
                .attr('cy', 0)
                .attr('rx', function(d) {
                    return self.radiusScale(d.semiMajorAxis);
                })
                .attr('ry', function(d) {
                    const a = self.radiusScale(d.semiMajorAxis);
                    const e = d.eccentricity || 0;
                    return a * Math.sqrt(1 - e * e);
                })
                .style('fill', 'none')
                .style('stroke', 'rgba(255, 255, 255, 0.3)')
                .style('stroke-width', 1)
                .style('stroke-dasharray', '3,3');
        }
        
        // Créer l'étoile
        this.star = this.g.append('circle')
            .attr('class', 'star')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 12)
            .style('fill', this.data.star.color || '#FFF5B7')
            .style('filter', `drop-shadow(0 0 20px ${this.data.star.color || '#FFF5B7'})`)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                // Agrandir l'étoile
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', (self.data.star.radius || 8) * 1.3);
                
                // Afficher la popup
                self.showStarInfo();
                
                // Positionner la popup
                self.updateStarPopupPosition(event);
            })
            .on('mousemove', function(event, d) {
                // Mettre à jour la position de la popup quand la souris bouge
                self.updateStarPopupPosition(event);
            })
            .on('mouseout', function(event, d) {
                // Réduire l'étoile
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', self.data.star.radius || 8);
                
                // Masquer la popup
                self.hideStarPopup();
            });
        
        // Appliquer les options de scintillement
        this.updateStarTwinkle();
        
        // Créer les traînées des planètes
        this.trailsGroup = this.g.append('g').attr('class', 'trails');
        
        // Créer les planètes
        this.planets = this.g.selectAll('.planet')
            .data(this.data.planets)
            .enter()
            .append('circle')
            .attr('class', 'planet')
            .attr('r', d => this.planetSizeScale(d.radius))
            .style('fill', d => d.color || '#4facfe')
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                // Agrandir la planète
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', self.planetSizeScale(d.radius) * 1.3);
                
                // Afficher la popup
                self.showPlanetInfo(d);
                
                // Positionner la popup
                self.updatePopupPosition(event);
            })
            .on('mousemove', function(event, d) {
                // Mettre à jour la position de la popup quand la souris bouge
                self.updatePopupPosition(event);
            })
            .on('mouseout', function(event, d) {
                // Réduire la planète
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', self.planetSizeScale(d.radius));
                
                // Masquer la popup
                self.hidePlanetPopup();
            });
        
        // Initialiser les traînées
        this.data.planets.forEach(planet => {
            this.trails[planet.id] = [];
        });
    }
    
    createHabitableZone() {
        const innerRadius = this.radiusScale(this.habitableZone.inner);
        const outerRadius = this.radiusScale(this.habitableZone.outer);
        
        // Obtenir les couleurs depuis les variables CSS
        const habitableZoneBg = getComputedStyle(document.documentElement).getPropertyValue('--habitable-zone-bg').trim();
        const habitableZoneBorder = getComputedStyle(document.documentElement).getPropertyValue('--habitable-zone-border').trim();
        const habitableZoneColor = getComputedStyle(document.documentElement).getPropertyValue('--habitable-zone-color').trim();
        const bgPrimary = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
        const bgTertiary = getComputedStyle(document.documentElement).getPropertyValue('--bg-tertiary').trim();
        
        // Créer un anneau pour la zone d'habitabilité
        this.g.append('circle')
            .attr('class', 'habitable-zone')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', outerRadius)
            .style('fill', habitableZoneBg)
            .style('stroke', habitableZoneBorder)
            .style('stroke-width', 2)
            .style('stroke-dasharray', '5,5');
        
        // Créer un cercle intérieur pour "masquer" le centre
        this.g.append('circle')
            .attr('class', 'habitable-zone-inner')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', innerRadius)
            .style('fill', `radial-gradient(circle at center, ${bgPrimary} 0%, ${bgTertiary} 100%)`)
            .style('stroke', habitableZoneBorder)
            .style('stroke-width', 2)
            .style('stroke-dasharray', '5,5');
        
        // Ajouter des étiquettes pour la zone d'habitabilité
        const labelRadius = (innerRadius + outerRadius) / 2;
        const labelAngle = Math.PI / 4; // 45 degrés
        
        this.g.append('text')
            .attr('class', 'habitable-zone-label')
            .attr('x', labelRadius * Math.cos(labelAngle))
            .attr('y', labelRadius * Math.sin(labelAngle))
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('fill', habitableZoneColor)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Zone d\'habitabilité');
    }
    
    setupAnimation() {
        this.animate();
    }
    
    // Ajout d'une fonction utilitaire pour résoudre l'équation de Kepler
    solveKeplerEquation(M, e, tol = 1e-6, maxIter = 20) {
        // M : anomalie moyenne (en radians)
        // e : excentricité
        // tol : tolérance de convergence
        // maxIter : nombre max d'itérations
        let E = M;
        for (let i = 0; i < maxIter; i++) {
            let delta = E - e * Math.sin(E) - M;
            if (Math.abs(delta) < tol) break;
            E = E - delta / (1 - e * Math.cos(E));
        }
        return E;
    }
    
    animate() {
        if (!this.isPlaying) return;
        // Utilise timeScale pour ajuster la vitesse du temps
        this.time += 0.01 * this.options.animationSpeed * this.options.timeScale;
        // Mettre à jour les positions des planètes
        this.planets.each((d, i) => {
            const e = d.eccentricity || 0;
            const a = d.semiMajorAxis;
            const period = d.orbitalPeriod;
            // Anomalie moyenne (M)
            const M = (this.time / period) * 2 * Math.PI;
            // Anomalie excentrique (E)
            const E = this.solveKeplerEquation(M, e);
            // Anomalie vraie (theta)
            const theta = 2 * Math.atan2(
                Math.sqrt(1 + e) * Math.sin(E / 2),
                Math.sqrt(1 - e) * Math.cos(E / 2)
            );
            // Distance planète-étoile (r)
            const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
            // Conversion à l'échelle d'affichage
            const x = this.radiusScale(r) * Math.cos(theta);
            const y = this.radiusScale(r) * Math.sin(theta);
            d.x = x;
            d.y = y;
            // Mettre à jour les traînées
            if (this.options.showTrails) {
                this.trails[d.id].push({x, y});
                if (this.trails[d.id].length > this.maxTrailLength) {
                    this.trails[d.id].shift();
                }
            }
        });
        // Appliquer les nouvelles positions
        this.planets
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
        // Mettre à jour les traînées
        if (this.options.showTrails) {
            this.updateTrails();
        }
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateTrails() {
        // Supprimer toutes les traînées existantes
        this.trailsGroup.selectAll('.planet-trail').remove();
        
        if (!this.options.showTrails) return;
        
        // Créer des traînées pour chaque planète
        this.data.planets.forEach(planet => {
            const points = this.trails[planet.id];
            if (points.length < 2) return;
            
            const color = planet.color || '#4facfe';
            
            if (this.options.fadeTrails) {
                // Créer des traînées avec estompage graduel
                for (let i = 0; i < points.length - 1; i++) {
                    const segmentPoints = points.slice(i, i + 2);
                    const opacity = (i / points.length) * 0.8; // Opacité décroissante
                    
                    if (opacity > 0.01) { // Éviter les segments trop transparents
                        this.trailsGroup.append('path')
                            .attr('class', 'planet-trail')
                            .style('stroke', color)
                            .style('stroke-width', 2)
                            .style('fill', 'none')
                            .style('opacity', opacity)
                            .attr('d', () => {
                                const line = d3.line()
                                    .x(point => point.x)
                                    .y(point => point.y)
                                    .curve(d3.curveCardinal);
                                return line(segmentPoints);
                            });
                    }
                }
            } else {
                // Créer une traînée simple sans estompage
                this.trailsGroup.append('path')
                    .attr('class', 'planet-trail')
                    .style('stroke', color)
                    .style('stroke-width', 2)
                    .style('fill', 'none')
                    .style('opacity', 0.6)
                    .attr('d', () => {
                        const line = d3.line()
                            .x(point => point.x)
                            .y(point => point.y)
                            .curve(d3.curveCardinal);
                        return line(points);
                    });
            }
        });
    }
    
    createLegend() {
        const legend = d3.select('#legend');
        legend.html('<h4>Planètes</h4>');
        
        this.data.planets.forEach(planet => {
            const item = legend.append('div')
                .attr('class', 'legend-item');
            
            item.append('div')
                .attr('class', 'legend-color')
                .style('background-color', planet.color || '#4facfe');
            
            item.append('span')
                .text(planet.name);
        });
        
        // Ajouter des informations sur la zone d'habitabilité
        if (this.habitableZone) {
            legend.append('div')
                .attr('class', 'legend-separator')
                .style('margin', '10px 0')
                .style('border-top', '1px solid #333');
            
            legend.append('h4')
                .text('Zone d\'habitabilité');
            
            const habitableInfo = legend.append('div')
                .attr('class', 'habitable-zone-info');
            
            // Obtenir les couleurs depuis les variables CSS
            const habitableZoneColor = getComputedStyle(document.documentElement).getPropertyValue('--habitable-zone-color').trim();
            
            habitableInfo.append('p')
                .style('color', habitableZoneColor)
                .style('font-size', '12px')
                .text(`Limite interne: ${this.habitableZone.inner.toFixed(4)} UA`);
            
            habitableInfo.append('p')
                .style('color', habitableZoneColor)
                .style('font-size', '12px')
                .text(`Limite externe: ${this.habitableZone.outer.toFixed(4)} UA`);
            
            // Identifier les planètes dans la zone d'habitabilité
            const habitablePlanets = this.data.planets.filter(planet => 
                planet.semiMajorAxis >= this.habitableZone.inner && 
                planet.semiMajorAxis <= this.habitableZone.outer
            );
            
            if (habitablePlanets.length > 0) {
                habitableInfo.append('p')
                    .style('color', habitableZoneColor)
                    .style('font-size', '12px')
                    .style('font-weight', 'bold')
                    .text(`Planètes habitables: ${habitablePlanets.map(p => p.name).join(', ')}`);
            }
        }
    }
    
    showPlanetInfo(planet) {
        // Créer ou mettre à jour la popup
        this.createPlanetPopup(planet);
    }
    
    createPlanetPopup(planet) {
        // Supprimer la popup existante s'il y en a une
        d3.select('#planet-popup').remove();
        
        // Vérifier si la planète est dans la zone d'habitabilité
        let habitabilityStatus = '';
        let habitabilityClass = '';
        if (this.habitableZone) {
            const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim();
            const warningColor = getComputedStyle(document.documentElement).getPropertyValue('--warning-color').trim();
            const infoColor = getComputedStyle(document.documentElement).getPropertyValue('--info-color').trim();
            
            const isInHabitableZone = planet.semiMajorAxis >= this.habitableZone.inner && 
                                     planet.semiMajorAxis <= this.habitableZone.outer;
            if (isInHabitableZone) {
                habitabilityStatus = `<span style="color: ${successColor};">✓ Dans la zone habitable</span>`;
                habitabilityClass = 'habitable';
            } else if (planet.semiMajorAxis < this.habitableZone.inner) {
                habitabilityStatus = `<span style="color: ${warningColor};">✗ Trop proche de l'étoile</span>`;
                habitabilityClass = 'too-hot';
            } else {
                habitabilityStatus = `<span style="color: ${infoColor};">✗ Trop éloignée de l'étoile</span>`;
                habitabilityClass = 'too-cold';
            }
        }
        
        // Créer la popup
        const popup = d3.select('body')
            .append('div')
            .attr('id', 'planet-popup')
            .attr('class', `planet-popup ${habitabilityClass}`)
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.95)')
            .style('border', `2px solid ${planet.color || '#4facfe'}`)
            .style('border-radius', '12px')
            .style('padding', '15px')
            .style('color', 'white')
            .style('font-family', 'Arial, sans-serif')
            .style('font-size', '14px')
            .style('max-width', '280px')
            .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.6)')
            .style('backdrop-filter', 'blur(10px)')
            .style('z-index', '10000')
            .style('pointer-events', 'none')
            .style('opacity', '0')
            .style('transform', 'scale(0.8)')
            .style('transition', 'all 0.3s ease');
        
        // Contenu de la popup
        popup.html(`
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${planet.color || '#4facfe'}; box-shadow: 0 0 10px ${planet.color || '#4facfe'};"></div>
                <h3 style="margin: 0; color: ${planet.color || '#4facfe'}; font-size: 18px;">${planet.name}</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div><strong>Rayon:</strong></div>
                <div>${planet.radius} R⊕</div>
                
                <div><strong>Demi-grand axe:</strong></div>
                <div>${planet.semiMajorAxis} UA</div>
                
                <div><strong>Période orbitale:</strong></div>
                <div>${planet.orbitalPeriod} jours</div>
                
                <div><strong>Masse:</strong></div>
                <div>${planet.mass || 'Inconnue'} M⊕</div>
                
                <div><strong>Température:</strong></div>
                <div>${planet.temperature || 'Inconnue'} K</div>
            </div>
            
            ${habitabilityStatus ? `<div style="margin-top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px; font-size: 12px;">
                <strong>Zone d'habitabilité:</strong><br>${habitabilityStatus}
            </div>` : ''}
        `);
        
        // Animer l'apparition de la popup
        setTimeout(() => {
            popup.style('opacity', '1')
                .style('transform', 'scale(1)');
        }, 10);
    }
    
    updatePopupPosition(event) {
        const popup = d3.select('#planet-popup');
        if (popup.empty()) return;
        
        const popupNode = popup.node();
        const rect = popupNode.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let x = event.clientX + 15;
        let y = event.clientY - 15;
        
        // Ajuster la position si la popup dépasse les bords de l'écran
        if (x + rect.width > windowWidth) {
            x = event.clientX - rect.width - 15;
        }
        if (y + rect.height > windowHeight) {
            y = event.clientY - rect.height - 15;
        }
        if (y < 0) {
            y = event.clientY + 15;
        }
        
        popup.style('left', x + 'px')
             .style('top', y + 'px');
    }
    
    hidePlanetPopup() {
        const popup = d3.select('#planet-popup');
        if (!popup.empty()) {
            popup.style('opacity', '0')
                .style('transform', 'scale(0.8)')
                .transition()
                .duration(200)
                .on('end', function() {
                    d3.select(this).remove();
                });
        }
    }
    
    showStarInfo() {
        // Créer ou mettre à jour la popup de l'étoile
        this.createStarPopup();
    }
    
    createStarPopup() {
        // Supprimer la popup existante s'il y en a une
        d3.select('#star-popup').remove();
        
        const star = this.data.star;
        
        // Utiliser la luminosité calculée par la formule de Stefan-Boltzmann
        const luminosity = this.habitableZone ? this.habitableZone.luminosity : Math.pow(star.mass, 2.5);
        
        // Déterminer le type spectral basé sur la température
        let spectralType = '';
        if (star.temperature < 2400) spectralType = 'M9';
        else if (star.temperature < 2600) spectralType = 'M8';
        else if (star.temperature < 2800) spectralType = 'M7';
        else if (star.temperature < 3000) spectralType = 'M6';
        else spectralType = 'M5';
        
        // Créer la popup
        const popup = d3.select('body')
            .append('div')
            .attr('id', 'star-popup')
            .attr('class', 'star-popup')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.95)')
            .style('border', `2px solid ${star.color || '#FF6B35'}`)
            .style('border-radius', '12px')
            .style('padding', '15px')
            .style('color', 'white')
            .style('font-family', 'Arial, sans-serif')
            .style('font-size', '14px')
            .style('max-width', '300px')
            .style('box-shadow', '0 8px 32px rgba(0, 0, 0, 0.6)')
            .style('backdrop-filter', 'blur(10px)')
            .style('z-index', '10000')
            .style('pointer-events', 'none')
            .style('opacity', '0')
            .style('transform', 'scale(0.8)')
            .style('transition', 'all 0.3s ease');
        
        // Contenu de la popup
        popup.html(`
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${star.color || '#FF6B35'}; box-shadow: 0 0 15px ${star.color || '#FF6B35'};"></div>
                <h3 style="margin: 0; color: ${star.color || '#FF6B35'}; font-size: 20px;">${star.name}</h3>
            </div>
            
            <div style="margin-bottom: 12px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px;">
                <div style="font-size: 12px; opacity: 0.8;">Étoile naine rouge ultra-froide</div>
                <div style="font-size: 12px; opacity: 0.8;">Type spectral: ${spectralType}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div><strong>Rayon:</strong></div>
                <div>${star.radius} R☉</div>
                
                <div><strong>Masse:</strong></div>
                <div>${star.mass} M☉</div>
                
                <div><strong>Température:</strong></div>
                <div>${star.temperature} K</div>
                
                <div><strong>Luminosité:</strong></div>
                <div>${(luminosity * 100).toFixed(3)}% L☉</div>
            </div>
            
            <div style="margin-top: 10px; padding: 8px; background: rgba(255, 255, 255, 0.1); border-radius: 6px; font-size: 12px;">
                <strong>Caractéristiques:</strong><br>
                • Naine rouge ultra-froide<br>
                • Âge estimé: 7.6 ± 2.2 milliards d'années<br>
                • Distance: 39.5 années-lumière<br>
                • 7 planètes confirmées
            </div>
        `);
        
        // Animer l'apparition de la popup
        setTimeout(() => {
            popup.style('opacity', '1')
                .style('transform', 'scale(1)');
        }, 10);
    }
    
    updateStarPopupPosition(event) {
        const popup = d3.select('#star-popup');
        if (popup.empty()) return;
        
        const popupNode = popup.node();
        const rect = popupNode.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let x = event.clientX + 15;
        let y = event.clientY - 15;
        
        // Ajuster la position si la popup dépasse les bords de l'écran
        if (x + rect.width > windowWidth) {
            x = event.clientX - rect.width - 15;
        }
        if (y + rect.height > windowHeight) {
            y = event.clientY - rect.height - 15;
        }
        if (y < 0) {
            y = event.clientY + 15;
        }
        
        popup.style('left', x + 'px')
             .style('top', y + 'px');
    }
    
    hideStarPopup() {
        const popup = d3.select('#star-popup');
        if (!popup.empty()) {
            popup.style('opacity', '0')
                .style('transform', 'scale(0.8)')
                .transition()
                .duration(200)
                .on('end', function() {
                    d3.select(this).remove();
                });
        }
    }
    
    play() {
        this.isPlaying = true;
        this.animate();
    }
    
    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    reset() {
        this.time = 0;
        this.trails = {};
        this.data.planets.forEach(planet => {
            this.trails[planet.id] = [];
        });
        this.trailsGroup.selectAll('.planet-trail').remove();
    }
    
    setSpeed(speed) {
        this.options.animationSpeed = speed;
    }
    
    toggleTrails() {
        this.options.showTrails = !this.options.showTrails;
        if (!this.options.showTrails) {
            this.trailsGroup.selectAll('.planet-trail').remove();
        }
    }
    
    toggleFadeTrails() {
        this.options.fadeTrails = !this.options.fadeTrails;
    }
    
    setTrails(show) {
        this.options.showTrails = show;
        if (!show) {
            this.trailsGroup.selectAll('.planet-trail').remove();
        }
    }
    
    setFadeTrails(fade) {
        this.options.fadeTrails = fade;
    }
    
    setStarTwinkle(show) {
        this.options.starTwinkle = show;
        this.updateStarTwinkle();
    }
    
    setTwinkleSpeed(speed) {
        this.options.twinkleSpeed = speed;
        this.updateStarTwinkle();
    }
    
    updateStarTwinkle() {
        if (this.star) {
            if (this.options.starTwinkle) {
                this.star.style('animation', `twinkle ${this.options.twinkleSpeed}s ease-in-out infinite`);
            } else {
                this.star.style('animation', 'none');
            }
        }
    }
    
    toggleHabitableZone() {
        this.options.showHabitableZone = !this.options.showHabitableZone;
        this.updateHabitableZoneVisibility();
    }
    
    setHabitableZone(show) {
        this.options.showHabitableZone = show;
        this.updateHabitableZoneVisibility();
    }
    
    updateHabitableZoneVisibility() {
        const habitableElements = this.g.selectAll('.habitable-zone, .habitable-zone-inner, .habitable-zone-label');
        if (this.options.showHabitableZone) {
            habitableElements.style('display', 'block');
        } else {
            habitableElements.style('display', 'none');
        }
    }
    
    updatePlanetSizes() {
        if (!this.planets) return;
        
        this.planets.each((d, i) => {
            const baseRadius = this.planetSizeScale(d.radius);
            const scaledRadius = Math.max(1, baseRadius / this.currentZoom); // Éviter les planètes trop petites
            
            d3.select(this.planets.nodes()[i])
                .attr('r', scaledRadius);
        });
    }
    
    updateTrailSizes() {
        if (!this.options.showTrails) return;
        
        const trailWidth = Math.max(0.5, 2 / this.currentZoom); // Éviter les traînées trop fines
        
        this.trailsGroup.selectAll('.planet-trail')
            .style('stroke-width', trailWidth);
    }
    
    createZoomIndicator() {
        // Supprimer l'indicateur existant s'il y en a un
        d3.select('#zoom-indicator').remove();
        
        // Créer un indicateur de zoom dans le coin supérieur droit
        const container = d3.select(`#${this.containerId}`);
        const indicator = container.append('div')
            .attr('id', 'zoom-indicator')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('background', 'rgba(0, 0, 0, 0.7)')
            .style('color', 'white')
            .style('padding', '5px 10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('font-family', 'Arial, sans-serif')
            .style('pointer-events', 'none')
            .style('z-index', '1000');
        
        indicator.append('div')
            .attr('id', 'zoom-level')
            .text('Zoom: 1.00x');
        
        indicator.append('div')
            .style('font-size', '10px')
            .style('opacity', '0.8')
            .text('Utilisez la molette pour zoomer');
    }
    
    updateZoomIndicator() {
        const zoomLevel = d3.select('#zoom-level');
        if (!zoomLevel.empty()) {
            zoomLevel.text(`Zoom: ${this.currentZoom.toFixed(2)}x`);
        }
    }
    
    getHabitableZoneInfo() {
        if (!this.habitableZone) return null;
        
        // Vérifier quelles planètes sont dans la zone d'habitabilité
        const habitablePlanets = this.data.planets.filter(planet => 
            planet.semiMajorAxis >= this.habitableZone.inner && 
            planet.semiMajorAxis <= this.habitableZone.outer
        );
        
        return {
            inner: this.habitableZone.inner,
            outer: this.habitableZone.outer,
            habitablePlanets: habitablePlanets
        };
    }
    
    // Méthodes de contrôle du zoom
    setZoom(scale) {
        if (!this.zoom || !this.options.enableZoom) return;
        
        const clampedScale = Math.max(this.options.minZoom, Math.min(this.options.maxZoom, scale));
        this.svg.transition()
            .duration(300)
            .call(this.zoom.transform, d3.zoomIdentity.scale(clampedScale));
    }
    
    zoomIn() {
        if (!this.zoom || !this.options.enableZoom) return;
        
        const newScale = Math.min(this.options.maxZoom, this.currentZoom * 1.5);
        this.setZoom(newScale);
    }
    
    zoomOut() {
        if (!this.zoom || !this.options.enableZoom) return;
        
        const newScale = Math.max(this.options.minZoom, this.currentZoom / 1.5);
        this.setZoom(newScale);
    }
    
    resetZoom() {
        if (!this.zoom || !this.options.enableZoom) return;
        
        this.svg.transition()
            .duration(300)
            .call(this.zoom.transform, d3.zoomIdentity);
    }
    
    enableZoom(enable) {
        this.options.enableZoom = enable;
        if (enable && !this.zoom) {
            this.setupZoom();
        } else if (!enable && this.zoom) {
            this.svg.on('.zoom', null);
            this.zoom = null;
            d3.select('#zoom-indicator').remove();
        }
    }
    
    getCurrentZoom() {
        return this.currentZoom;
    }
}

// La classe Exoplanets est maintenant disponible pour être utilisée dans le fichier HTML 