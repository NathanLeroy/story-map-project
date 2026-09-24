import { SlideDeck } from './slidedeck.js';


// =====================================================
// MAP SETUP
// =====================================================

const map = L.map('map', {
  scrollWheelZoom: false
}).setView([39.9526, -75.1652], 12);

L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
).addTo(map);


// =====================================================
// SLIDES
// =====================================================

const container = document.querySelector('.slide-section');
const slides = document.querySelectorAll('.slide');


// =====================================================
// SLIDE OPTIONS
// =====================================================

const slideOptions = {

  // ---------------------------------------------------
  // SLIDE 1
  // Urban Agriculture Projects
  // ---------------------------------------------------

  'urban-agriculture-projects': {

    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, {
        radius: 8,
        color: '#ffffff',
        weight: 2,
        fillColor: '#046307',
        fillOpacity: 0.9
      });
    },

    onEachFeature: (feature, layer) => {

      const properties = feature.properties || {};

      const name =
        properties.label ||
        properties.name ||
        properties.NAME ||
        properties.PROJECT_NAME ||
        'Urban agriculture project';

      layer.bindTooltip(name);
    }
  },


  // ---------------------------------------------------
  // SLIDE 2
  // Food Retail Comparison
  // ---------------------------------------------------

  'food-retail-comparison': {

    style: (feature) => {

      const access = feature.properties?.SUPERMARKET_ACCESS;

      let fillColor = '#808080';

      if (access === 'Yes') {
        fillColor = '#2e7d32';
      }

      else if (access === 'No') {
        fillColor = '#d32f2f';
      }

      return {
        color: '#666666',
        weight: 0.5,
        fillColor: fillColor,
        fillOpacity: 0.6
      };
    },

    onEachFeature: (feature, layer) => {

      const properties = feature.properties || {};

      if (properties.SUPERMARKET_ACCESS !== undefined) {

        layer.bindTooltip(
          `Supermarket access: ${properties.SUPERMARKET_ACCESS}`
        );
      }
    }
  },


  // ---------------------------------------------------
  // SLIDE 3
  // Urban Agriculture + Supermarket Access
  // ---------------------------------------------------

  'urban-agriculture-food-access': {

    layers: [

      // ===============================================
      // LAYER 1: SUPERMARKET ACCESS
      // ===============================================

      {
        file: 'food-retail-comparison.json',

        options: {

          style: (feature) => {

            const access =
              feature.properties?.SUPERMARKET_ACCESS;

            let fillColor = '#808080';

            if (access === 'Yes') {
              fillColor = '#2e7d32';
            }

            else if (access === 'No') {
              fillColor = '#d32f2f';
            }

            return {
              color: '#666666',
              weight: 0.5,
              fillColor: fillColor,
              fillOpacity: 0.45
            };
          },

          onEachFeature: (feature, layer) => {

            const access =
              feature.properties?.SUPERMARKET_ACCESS;

            layer.bindTooltip(
              `Supermarket access: ${access ?? 'No data'}`
            );
          }
        }
      },


      // ===============================================
      // LAYER 2: URBAN AGRICULTURE PROJECTS
      // ===============================================

      {
        file: 'urban-agriculture-projects.json',

        options: {

          pointToLayer: (feature, latlng) => {

            console.log(
              'Urban agriculture feature:',
              feature
            );

            return L.circleMarker(latlng, {
              radius: 10,
              color: '#ffffff',
              weight: 3,
              fillColor: '#1976d2',
              fillOpacity: 1
            });
          },

          onEachFeature: (feature, layer) => {

            const properties =
              feature.properties || {};

            const name =
              properties.label ||
              properties.name ||
              properties.NAME ||
              properties.PROJECT_NAME ||
              'Urban agriculture project';

            layer.bindTooltip(name);
          }
        }
      }

    ]
  }

};


// =====================================================
// CREATE SLIDE DECK
// =====================================================

const deck = new SlideDeck(
  container,
  slides,
  map,
  slideOptions
);


// =====================================================
// SCROLL HANDLER
// =====================================================

document.addEventListener(
  'scroll',
  () => deck.calcCurrentSlideIndex()
);


// =====================================================
// PRELOAD DATA
// =====================================================

deck.preloadFeatureCollections();


// =====================================================
// INITIAL MAP STATE
// =====================================================

deck.syncMapToCurrentSlide();