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
        
        this.init();
    }
    
    init() {
        this.createSVG();
        this.setupScales();
        this.calculateHabitableZone();
        this.createElements();
        this.setupAnimation();
        this.createLegend();
    }
    
    calculateHabitableZone() {
        // Calcul de la zone d'habitabilité basé sur la température de l'étoile
        // Formule simplifiée : zone d'habitabilité = L*^0.5 où L* est la luminosité de l'étoile
        // Pour une étoile naine rouge comme TRAPPIST-1, on utilise une approximation
        
        const starTemp = this.data.star.temperature;
        const starMass = this.data.star.mass;
        
        // Calcul de la luminosité approximative (relation masse-luminosité pour les naines rouges)
        const luminosity = Math.pow(starMass, 2.5);
        
        // Calcul des limites de la zone d'habitabilité
        // Limite interne (zone chaude) : ~0.75 * sqrt(L)
        // Limite externe (zone froide) : ~1.77 * sqrt(L)
        const innerLimit = 0.75 * Math.sqrt(luminosity);
        const outerLimit = 1.77 * Math.sqrt(luminosity);
        
        this.habitableZone = {
            inner: innerLimit,
            outer: outerLimit
        };
        
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
    
    setupScales() {
        const maxDistance = d3.max(this.data.planets, d => d.semiMajorAxis);
        const minRadius = Math.min(this.options.width, this.options.height) / 2 - 50;
        
        this.radiusScale = d3.scaleLinear()
            .domain([0, maxDistance])
            .range([0, minRadius]);
        
        this.planetSizeScale = d3.scaleLinear()
            .domain(d3.extent(this.data.planets, d => d.radius))
            .range([3, 12]);
    }
    
    createElements() {
        // Créer la zone d'habitabilité (avant les orbites pour qu'elle soit en arrière-plan)
        if (this.options.showHabitableZone && this.habitableZone) {
            this.createHabitableZone();
        }
        
        // Créer les orbites
        if (this.options.showOrbits) {
            this.g.selectAll('.orbit-path')
                .data(this.data.planets)
                .enter()
                .append('circle')
                .attr('class', 'orbit-path')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', d => this.radiusScale(d.semiMajorAxis))
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
            .attr('r', this.data.star.radius || 8)
            .style('fill', this.data.star.color || '#FFF5B7')
            .style('filter', `drop-shadow(0 0 20px ${this.data.star.color || '#FFF5B7'})`);
        
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
            .on('click', (event, d) => this.showPlanetInfo(d))
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d => this.planetSizeScale(d.radius) * 1.3);
            }.bind(this))
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('r', d => this.planetSizeScale(d.radius));
            }.bind(this));
        
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
    
    animate() {
        if (!this.isPlaying) return;
        
        this.time += 0.01 * this.options.animationSpeed;
        
        // Mettre à jour les positions des planètes
        this.planets.each((d, i) => {
            const angle = (this.time / d.orbitalPeriod) * 2 * Math.PI;
            const x = this.radiusScale(d.semiMajorAxis) * Math.cos(angle);
            const y = this.radiusScale(d.semiMajorAxis) * Math.sin(angle);
            
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
        const info = d3.select('#planet-info');
        info.style('display', 'block');
        
        // Vérifier si la planète est dans la zone d'habitabilité
        let habitabilityStatus = '';
        if (this.habitableZone) {
            // Obtenir les couleurs depuis les variables CSS
            const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim();
            const warningColor = getComputedStyle(document.documentElement).getPropertyValue('--warning-color').trim();
            const infoColor = getComputedStyle(document.documentElement).getPropertyValue('--info-color').trim();
            
            const isInHabitableZone = planet.semiMajorAxis >= this.habitableZone.inner && 
                                     planet.semiMajorAxis <= this.habitableZone.outer;
            if (isInHabitableZone) {
                habitabilityStatus = `<p><strong>Zone d'habitabilité:</strong> <span style="color: ${successColor};">✓ Dans la zone habitable</span></p>`;
            } else if (planet.semiMajorAxis < this.habitableZone.inner) {
                habitabilityStatus = `<p><strong>Zone d'habitabilité:</strong> <span style="color: ${warningColor};">✗ Trop proche de l'étoile</span></p>`;
            } else {
                habitabilityStatus = `<p><strong>Zone d'habitabilité:</strong> <span style="color: ${infoColor};">✗ Trop éloignée de l'étoile</span></p>`;
            }
        }
        
        info.html(`
            <h4>${planet.name}</h4>
            <p><strong>Rayon:</strong> ${planet.radius} R⊕</p>
            <p><strong>Demi-grand axe:</strong> ${planet.semiMajorAxis} UA</p>
            <p><strong>Période orbitale:</strong> ${planet.orbitalPeriod} jours</p>
            <p><strong>Masse:</strong> ${planet.mass || 'Inconnue'} M⊕</p>
            <p><strong>Température:</strong> ${planet.temperature || 'Inconnue'} K</p>
            ${habitabilityStatus}
        `);
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
}

// La classe Exoplanets est maintenant disponible pour être utilisée dans le fichier HTML 