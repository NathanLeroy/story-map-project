class SlideDeck {

  /**
   * A slide deck object
   */
  constructor(container, slides, map, slideOptions = {}) {
    this.container = container;
    this.slides = slides;
    this.map = map;
    this.slideOptions = slideOptions;

    this.dataLayer = L.layerGroup().addTo(map);
    this.currentSlideIndex = 0;
  }


  /**
   * Update the data layer with a single GeoJSON FeatureCollection.
   */
  updateDataLayer(data, options) {

    this.dataLayer.clearLayers();

    const defaultOptions = {

      pointToLayer: (p, latlng) =>
        L.marker(latlng),

      style: (feature) =>
        feature.properties.style,

      onEachFeature: (feature, layer) => {

        if (
          feature.properties &&
          feature.properties.label
        ) {

          layer.bindTooltip(
            feature.properties.label
          );

        }

      },

    };

    const geoJsonLayer = L.geoJSON(
      data,
      options || defaultOptions
    ).addTo(this.dataLayer);

    return geoJsonLayer;
  }


  /**
   * Load a slide's normal GeoJSON file.
   */
  async getSlideFeatureCollection(slide) {

    const resp = await fetch(
      `data/${slide.id}.json`
    );

    const data = await resp.json();

    return data;
  }


  /**
   * Hide all slides.
   */
  hideAllSlides() {

    for (const slide of this.slides) {
      slide.classList.add('hidden');
    }

  }


  /**
   * Show the map data associated with a slide.
   */
  async syncMapToSlide(slide) {

    const slideConfig =
      this.slideOptions[slide.id];


    // ==========================================
    // Slide with multiple GeoJSON layers
    // ==========================================

    if (slideConfig?.layers) {

      this.dataLayer.clearLayers();

      const layersCreated = [];

      for (const layerConfig of slideConfig.layers) {

        const resp = await fetch(
          `data/${layerConfig.file}`
        );

        if (!resp.ok) {

          console.error(
            `Could not load ${layerConfig.file}`
          );

          continue;
        }

        const collection =
          await resp.json();

        const layer = L.geoJSON(
          collection,
          layerConfig.options || {}
        );

        layer.addTo(this.dataLayer);

        layersCreated.push(layer);

      }


      // ----------------------------------------
      // Combine bounds from all layers
      // ----------------------------------------

      const combinedBounds =
        L.latLngBounds([]);

      for (const layer of layersCreated) {

        const bounds =
          layer.getBounds();

        if (bounds.isValid()) {

          combinedBounds.extend(
            bounds
          );

        }

      }


      // ----------------------------------------
      // Zoom to both layers
      // ----------------------------------------

      if (combinedBounds.isValid()) {

        this.map.flyToBounds(
          combinedBounds
        );

      }

      return;
    }


    // ==========================================
    // Normal single-layer slide
    // ==========================================

    const collection =
      await this.getSlideFeatureCollection(slide);

    const options =
      slideConfig;

    const layer =
      this.updateDataLayer(
        collection,
        options
      );


    // ==========================================
    // Zoom to data
    // ==========================================

    const boundsFromBbox = (bbox) => {

      const [
        west,
        south,
        east,
        north
      ] = bbox;

      return L.latLngBounds(
        L.latLng(south, west),
        L.latLng(north, east)
      );

    };


    // ==========================================
    // Permanent popups
    // ==========================================

    const handleFlyEnd = () => {

      if (slide.showpopups) {

        layer.eachLayer((l) => {

          if (
            l.feature &&
            l.feature.properties &&
            l.feature.properties.label
          ) {

            l.bindTooltip(
              l.feature.properties.label,
              { permanent: true }
            );

            l.openTooltip();

          }

        });

      }

      this.map.removeEventListener(
        'moveend',
        handleFlyEnd
      );

    };


    this.map.addEventListener(
      'moveend',
      handleFlyEnd
    );


    // ==========================================
    // Zoom map
    // ==========================================

    if (collection.bbox) {

      this.map.flyToBounds(
        boundsFromBbox(
          collection.bbox
        )
      );

    } else {

      this.map.flyToBounds(
        layer.getBounds()
      );

    }

  }


  /**
   * Show the current slide.
   */
  syncMapToCurrentSlide() {

    const slide =
      this.slides[this.currentSlideIndex];

    this.syncMapToSlide(slide);

  }


  /**
   * Move to the next slide.
   */
  goNextSlide() {

    this.currentSlideIndex++;

    if (
      this.currentSlideIndex ===
      this.slides.length
    ) {

      this.currentSlideIndex = 0;

    }

    this.syncMapToCurrentSlide();

  }


  /**
   * Move to the previous slide.
   */
  goPrevSlide() {

    this.currentSlideIndex--;

    if (
      this.currentSlideIndex < 0
    ) {

      this.currentSlideIndex =
        this.slides.length - 1;

    }

    this.syncMapToCurrentSlide();

  }


  /**
   * Preload all slide GeoJSON files.
   */
  preloadFeatureCollections() {

    for (const slide of this.slides) {

      // Normal slides
      const slideConfig =
        this.slideOptions[slide.id];

      if (slideConfig?.layers) {

        // Preload each layer in a multi-layer slide
        for (
          const layerConfig
          of slideConfig.layers
        ) {

          fetch(
            `data/${layerConfig.file}`
          );

        }

      } else {

        // Normal one-file slide
        this.getSlideFeatureCollection(
          slide
        );

      }

    }

  }


  /**
   * Calculate which slide is currently visible.
   */
  calcCurrentSlideIndex() {

    const windowHeight =
      window.innerHeight;

    const scrollPos =
      window.scrollY;

    const scrollPeek = 64;

    const currentSlideThreshold =
      scrollPos +
      windowHeight -
      scrollPeek;

    let i;


    for (
      i = this.slides.length - 1;
      i > 0;
      i--
    ) {

      const slidePos =
        this.slides[i].offsetTop +
        this.container.offsetTop;

      if (
        slidePos <=
        currentSlideThreshold
      ) {

        break;

      }

    }


    if (
      i !== this.currentSlideIndex
    ) {

      this.currentSlideIndex = i;

      this.syncMapToCurrentSlide();

    }

  }

}


export { SlideDeck };