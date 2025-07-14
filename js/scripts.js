// scripts.js
// Gestion de l'affichage HTML spécifique et de l'intégration DOM pour Exoplanets

// Exemple d'importation des données (à adapter selon ton projet)
// import { data } from '../data/trappist-1.js';
// ou bien inclure le script data dans le HTML

// Instanciation de la classe Exoplanets
// const exo = new Exoplanets('container', data, { ... });

// ----- Création de la légende -----
function createLegend(exoplanets) {
    const legend = d3.select('#legend');
    legend.html('<h4>Planètes</h4>');
    exoplanets.data.planets.forEach(planet => {
        const item = legend.append('div')
            .attr('class', 'legend-item');
        item.append('div')
            .attr('class', 'legend-color')
            .style('background-color', planet.color || '#4facfe');
        item.append('span')
            .text(planet.name);
    });
    // Zone d'habitabilité
    if (exoplanets.habitableZone) {
        legend.append('div')
            .attr('class', 'legend-separator')
            .style('margin', '10px 0')
            .style('border-top', '1px solid #333');
        legend.append('h4').text("Zone d'habitabilité");
        const habitableInfo = legend.append('div').attr('class', 'habitable-zone-info');
        const habitableZoneColor = getComputedStyle(document.documentElement).getPropertyValue('--habitable-zone-color').trim();
        habitableInfo.append('p')
            .style('color', habitableZoneColor)
            .style('font-size', '12px')
            .text(`Limite interne: ${exoplanets.habitableZone.inner.toFixed(4)} UA`);
        habitableInfo.append('p')
            .style('color', habitableZoneColor)
            .style('font-size', '12px')
            .text(`Limite externe: ${exoplanets.habitableZone.outer.toFixed(4)} UA`);
        const habitablePlanets = exoplanets.data.planets.filter(planet => 
            planet.semiMajorAxis >= exoplanets.habitableZone.inner && 
            planet.semiMajorAxis <= exoplanets.habitableZone.outer
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

// ----- Popups planètes -----
function createPlanetPopup(planet, habitableZone) {
    d3.select('#planet-popup').remove();
    let habitabilityStatus = '';
    let habitabilityClass = '';
    if (habitableZone) {
        const successColor = getComputedStyle(document.documentElement).getPropertyValue('--success-color').trim();
        const warningColor = getComputedStyle(document.documentElement).getPropertyValue('--warning-color').trim();
        const infoColor = getComputedStyle(document.documentElement).getPropertyValue('--info-color').trim();
        const isInHabitableZone = planet.semiMajorAxis >= habitableZone.inner && planet.semiMajorAxis <= habitableZone.outer;
        if (isInHabitableZone) {
            habitabilityStatus = `<span style="color: ${successColor};">✓ Dans la zone habitable</span>`;
            habitabilityClass = 'habitable';
        } else if (planet.semiMajorAxis < habitableZone.inner) {
            habitabilityStatus = `<span style="color: ${warningColor};">✗ Trop proche de l'étoile</span>`;
            habitabilityClass = 'too-hot';
        } else {
            habitabilityStatus = `<span style="color: ${infoColor};">✗ Trop éloignée de l'étoile</span>`;
            habitabilityClass = 'too-cold';
        }
    }
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
    setTimeout(() => {
        popup.style('opacity', '1').style('transform', 'scale(1)');
    }, 10);
}
function updatePopupPosition(event) {
    const popup = d3.select('#planet-popup');
    if (popup.empty()) return;
    const popupNode = popup.node();
    const rect = popupNode.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let x = event.clientX + 15;
    let y = event.clientY - 15;
    if (x + rect.width > windowWidth) x = event.clientX - rect.width - 15;
    if (y + rect.height > windowHeight) y = event.clientY - rect.height - 15;
    if (y < 0) y = event.clientY + 15;
    popup.style('left', x + 'px').style('top', y + 'px');
}
function hidePlanetPopup() {
    const popup = d3.select('#planet-popup');
    if (!popup.empty()) {
        popup.style('opacity', '0').style('transform', 'scale(0.8)').transition().duration(200).on('end', function() { d3.select(this).remove(); });
    }
}

// ----- Popups étoile -----
function createStarPopup(star, luminosity) {
    d3.select('#star-popup').remove();
    let spectralType = '';
    if (star.temperature < 2400) spectralType = 'M9';
    else if (star.temperature < 2600) spectralType = 'M8';
    else if (star.temperature < 2800) spectralType = 'M7';
    else if (star.temperature < 3000) spectralType = 'M6';
    else spectralType = 'M5';
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
    setTimeout(() => {
        popup.style('opacity', '1').style('transform', 'scale(1)');
    }, 10);
}
function updateStarPopupPosition(event) {
    const popup = d3.select('#star-popup');
    if (popup.empty()) return;
    const popupNode = popup.node();
    const rect = popupNode.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    let x = event.clientX + 15;
    let y = event.clientY - 15;
    if (x + rect.width > windowWidth) x = event.clientX - rect.width - 15;
    if (y + rect.height > windowHeight) y = event.clientY - rect.height - 15;
    if (y < 0) y = event.clientY + 15;
    popup.style('left', x + 'px').style('top', y + 'px');
}
function hideStarPopup() {
    const popup = d3.select('#star-popup');
    if (!popup.empty()) {
        popup.style('opacity', '0').style('transform', 'scale(0.8)').transition().duration(200).on('end', function() { d3.select(this).remove(); });
    }
}

// ----- Indicateur de zoom -----
function createZoomIndicator(containerId) {
    d3.select('#zoom-indicator').remove();
    const container = d3.select(`#${containerId}`);
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
function updateZoomIndicator(currentZoom) {
    const zoomLevel = d3.select('#zoom-level');
    if (!zoomLevel.empty()) {
        zoomLevel.text(`Zoom: ${currentZoom.toFixed(2)}x`);
    }
}

// ----- Exemple de branchement des événements (à adapter selon ton code) -----
// exo.planets.on('mouseover', function(event, d) {
//     createPlanetPopup(d, exo.habitableZone);
//     updatePopupPosition(event);
// });
// exo.planets.on('mousemove', function(event, d) {
//     updatePopupPosition(event);
// });
// exo.planets.on('mouseout', function(event, d) {
//     hidePlanetPopup();
// });
// Idem pour l'étoile...

// N'oublie pas d'appeler createLegend(exo) et createZoomIndicator('container') après l'initialisation ! 