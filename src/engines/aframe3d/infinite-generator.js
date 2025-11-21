/**
 * Infinite 3D Object Generation System
 * Massively improved A-Frame integration with infinite variation capabilities
 *
 * Features:
 * - Infinite procedural 3D object generation
 * - Geometric primitives with infinite variations
 * - Material combinations (PBR, basic, shader)
 * - Animation variations
 * - Lighting configurations
 * - Environment variations
 * - Physics integration
 */

export class Infinite3DGenerator {
  constructor(pgliteManager, config = {}) {
    this.pglite = pgliteManager;
    this.config = {
      maxCachedObjects: 5000,
      enablePhysics: true,
      enableShaders: true,
      enableParticles: true,
      ...config
    };

    this.state = {
      generatedCount: 0,
      cache: new Map(),
      scenes: new Map()
    };

    // Primitive libraries
    this.primitives = [
      'box', 'sphere', 'cylinder', 'cone', 'torus', 'torus-knot',
      'plane', 'circle', 'ring', 'dodecahedron', 'icosahedron',
      'octahedron', 'tetrahedron', 'triangle'
    ];

    this.materialTypes = ['basic', 'standard', 'phong', 'physical', 'shader'];

    this.init();
  }

  /**
   * Initialize generator
   */
  init() {
    console.log('Infinite3DGenerator: Initialized');
  }

  /**
   * Generate infinite 3D objects
   */
  *generateInfinite(options = {}) {
    let index = 0;

    while (true) {
      const object = this.generate3DObject(index, options);
      object.id = `3d-obj-${index}`;
      object.index = index;

      // Cache if under limit
      if (this.state.cache.size < this.config.maxCachedObjects) {
        this.state.cache.set(object.id, object);
      }

      this.state.generatedCount++;

      yield object;
      index++;
    }
  }

  /**
   * Generate a single 3D object with infinite variations
   */
  generate3DObject(index, options = {}) {
    // Use index to create deterministic variations
    const seed = this.createSeed(index);

    const primitive = this.selectPrimitive(seed);
    const geometry = this.generateGeometry(primitive, seed);
    const material = this.generateMaterial(seed);
    const position = this.generatePosition(seed);
    const rotation = this.generateRotation(seed);
    const scale = this.generateScale(seed);
    const animation = this.generateAnimation(seed);
    const components = this.generateComponents(seed);

    return {
      object_type: primitive,
      geometry,
      material,
      position,
      rotation,
      scale,
      animation,
      components,
      metadata: {
        seed,
        index,
        generatedAt: Date.now()
      }
    };
  }

  /**
   * Create seed from index for deterministic generation
   */
  createSeed(index) {
    // Multiple seeds for different aspects
    return {
      main: index,
      geometry: index * 7 + 13,
      material: index * 11 + 17,
      position: index * 19 + 23,
      animation: index * 29 + 31,
      color: index * 37 + 41
    };
  }

  /**
   * Select primitive based on seed
   */
  selectPrimitive(seed) {
    return this.primitives[seed.main % this.primitives.length];
  }

  /**
   * Generate geometry parameters
   */
  generateGeometry(primitive, seed) {
    const baseParams = {
      primitive
    };

    // Primitive-specific parameters
    switch (primitive) {
      case 'box':
        return {
          ...baseParams,
          width: 1 + (seed.geometry % 5) * 0.5,
          height: 1 + ((seed.geometry * 2) % 5) * 0.5,
          depth: 1 + ((seed.geometry * 3) % 5) * 0.5,
          segmentsWidth: 1 + (seed.geometry % 10),
          segmentsHeight: 1 + ((seed.geometry * 2) % 10),
          segmentsDepth: 1 + ((seed.geometry * 3) % 10)
        };

      case 'sphere':
        return {
          ...baseParams,
          radius: 0.5 + (seed.geometry % 10) * 0.2,
          segmentsWidth: 16 + (seed.geometry % 32),
          segmentsHeight: 12 + ((seed.geometry * 2) % 24),
          phiStart: (seed.geometry % 360),
          phiLength: 180 + (seed.geometry % 180),
          thetaStart: (seed.geometry % 180),
          thetaLength: 90 + (seed.geometry % 90)
        };

      case 'cylinder':
        return {
          ...baseParams,
          radius: 0.5 + (seed.geometry % 5) * 0.2,
          height: 1 + (seed.geometry % 10) * 0.3,
          segmentsRadial: 12 + (seed.geometry % 24),
          segmentsHeight: 1 + (seed.geometry % 10),
          openEnded: seed.geometry % 2 === 0,
          thetaStart: (seed.geometry % 360),
          thetaLength: 180 + (seed.geometry % 180)
        };

      case 'torus':
        return {
          ...baseParams,
          radius: 1 + (seed.geometry % 5) * 0.3,
          radiusTubular: 0.2 + (seed.geometry % 5) * 0.1,
          segmentsRadial: 8 + (seed.geometry % 24),
          segmentsTubular: 16 + ((seed.geometry * 2) % 32),
          arc: 180 + (seed.geometry % 180)
        };

      case 'torus-knot':
        return {
          ...baseParams,
          radius: 0.5 + (seed.geometry % 5) * 0.2,
          radiusTubular: 0.1 + (seed.geometry % 5) * 0.05,
          segmentsRadial: 8 + (seed.geometry % 16),
          segmentsTubular: 64 + (seed.geometry % 64),
          p: 2 + (seed.geometry % 5),
          q: 3 + ((seed.geometry * 2) % 7)
        };

      case 'cone':
        return {
          ...baseParams,
          radiusBottom: 0.5 + (seed.geometry % 5) * 0.2,
          radiusTop: (seed.geometry % 3) * 0.2,
          height: 1 + (seed.geometry % 10) * 0.3,
          segmentsRadial: 12 + (seed.geometry % 24),
          segmentsHeight: 1 + (seed.geometry % 10),
          openEnded: seed.geometry % 2 === 0
        };

      case 'dodecahedron':
      case 'icosahedron':
      case 'octahedron':
      case 'tetrahedron':
        return {
          ...baseParams,
          radius: 0.5 + (seed.geometry % 10) * 0.2,
          detail: seed.geometry % 5
        };

      case 'plane':
      case 'circle':
        return {
          ...baseParams,
          radius: 1 + (seed.geometry % 10) * 0.5,
          segments: 16 + (seed.geometry % 48),
          thetaStart: (seed.geometry % 360),
          thetaLength: 180 + (seed.geometry % 180)
        };

      case 'ring':
        return {
          ...baseParams,
          radiusInner: 0.5 + (seed.geometry % 5) * 0.2,
          radiusOuter: 1 + (seed.geometry % 5) * 0.3,
          segmentsTheta: 16 + (seed.geometry % 32),
          segmentsPhi: 1 + (seed.geometry % 8),
          thetaStart: (seed.geometry % 360),
          thetaLength: 180 + (seed.geometry % 180)
        };

      default:
        return baseParams;
    }
  }

  /**
   * Generate material properties
   */
  generateMaterial(seed) {
    const type = this.materialTypes[seed.material % this.materialTypes.length];

    const baseMaterial = {
      type,
      color: this.generateColor(seed.color),
      opacity: 0.7 + (seed.material % 3) * 0.1,
      transparent: seed.material % 3 > 0
    };

    // Type-specific properties
    switch (type) {
      case 'standard':
      case 'physical':
        return {
          ...baseMaterial,
          metalness: (seed.material % 10) / 10,
          roughness: (seed.material % 10) / 10,
          emissive: this.generateColor(seed.color + 100),
          emissiveIntensity: (seed.material % 5) * 0.2
        };

      case 'phong':
        return {
          ...baseMaterial,
          shininess: 10 + (seed.material % 90),
          specular: this.generateColor(seed.color + 50)
        };

      case 'shader':
        return {
          ...baseMaterial,
          shader: this.generateShader(seed),
          uniforms: this.generateShaderUniforms(seed)
        };

      default:
        return baseMaterial;
    }
  }

  /**
   * Generate color from seed
   */
  generateColor(seed) {
    const hue = seed % 360;
    const saturation = 60 + (seed % 40);
    const lightness = 45 + (seed % 30);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Generate shader
   */
  generateShader(seed) {
    const shaders = ['flat', 'standard', 'toon', 'fresnel', 'noise', 'gradient'];
    return shaders[seed.material % shaders.length];
  }

  /**
   * Generate shader uniforms
   */
  generateShaderUniforms(seed) {
    return {
      time: { value: 0 },
      intensity: { value: (seed.material % 10) / 10 },
      frequency: { value: 1 + (seed.material % 5) }
    };
  }

  /**
   * Generate position
   */
  generatePosition(seed) {
    const spread = 20; // Objects spread across 20 units
    const layers = 10; // 10 vertical layers

    return {
      x: ((seed.position * 7) % spread) - spread / 2,
      y: ((seed.position * 11) % layers),
      z: -5 - ((seed.position * 13) % spread)
    };
  }

  /**
   * Generate rotation
   */
  generateRotation(seed) {
    return {
      x: (seed.main * 17) % 360,
      y: (seed.main * 23) % 360,
      z: (seed.main * 29) % 360
    };
  }

  /**
   * Generate scale
   */
  generateScale(seed) {
    const baseScale = 0.5 + (seed.main % 10) * 0.2;
    const variation = 1 + (seed.main % 5) * 0.1;

    return {
      x: baseScale * variation,
      y: baseScale * (1 / variation),
      z: baseScale
    };
  }

  /**
   * Generate animation
   */
  generateAnimation(seed) {
    const animationTypes = [
      { property: 'rotation', to: '0 360 0', loop: true },
      { property: 'rotation', to: '360 0 0', loop: true },
      { property: 'position', dir: 'alternate', loop: true },
      { property: 'scale', dir: 'alternate', loop: true },
      { property: 'material.color', loop: true }
    ];

    const type = animationTypes[seed.animation % animationTypes.length];
    const duration = 1000 + (seed.animation % 10) * 500;
    const easing = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'][seed.animation % 5];

    return {
      ...type,
      dur: duration,
      easing,
      enabled: seed.animation % 3 > 0
    };
  }

  /**
   * Generate additional components
   */
  generateComponents(seed) {
    const components = {};

    // Shadow
    if (seed.main % 2 === 0) {
      components.shadow = {
        cast: true,
        receive: seed.main % 4 > 1
      };
    }

    // Physics (if enabled)
    if (this.config.enablePhysics && seed.main % 5 === 0) {
      components['dynamic-body'] = {
        mass: 1 + (seed.main % 10),
        linearDamping: 0.1 + (seed.main % 5) * 0.1,
        angularDamping: 0.1 + (seed.main % 5) * 0.1
      };
    }

    // Particles (if enabled)
    if (this.config.enableParticles && seed.main % 10 === 0) {
      components['particle-system'] = {
        preset: ['dust', 'snow', 'rain'][seed.main % 3],
        particleCount: 100 + (seed.main % 500),
        maxAge: 1 + (seed.main % 5)
      };
    }

    // Sound
    if (seed.main % 15 === 0) {
      components.sound = {
        src: `#sound-${seed.main % 10}`,
        autoplay: false,
        on: 'click',
        volume: 0.3 + (seed.main % 7) * 0.1
      };
    }

    return components;
  }

  /**
   * Generate complete A-Frame scene with infinite objects
   */
  async generateScene(sceneId, objectCount = 100) {
    const generator = this.generateInfinite();
    const objects = [];

    for (let i = 0; i < objectCount; i++) {
      const obj = generator.next().value;
      obj.scene_id = sceneId;

      objects.push(obj);

      // Save to PGlite
      if (this.pglite) {
        await this.pglite.saveAFrameObject(obj);
      }
    }

    const scene = {
      id: sceneId,
      objects,
      environment: this.generateEnvironment(sceneId),
      lighting: this.generateLighting(sceneId),
      camera: this.generateCamera(sceneId),
      createdAt: Date.now()
    };

    this.state.scenes.set(sceneId, scene);

    return scene;
  }

  /**
   * Generate environment configuration
   */
  generateEnvironment(sceneId) {
    const seed = sceneId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const presets = [
      'default', 'contact', 'egypt', 'checkerboard', 'forest',
      'goaland', 'yavapai', 'goldmine', 'threetowers', 'poison',
      'arches', 'tron', 'japan', 'dream', 'volcano', 'starry',
      'osiris', 'moon', 'valley'
    ];

    return {
      preset: presets[seed % presets.length],
      seed: seed % 100,
      skyType: ['atmosphere', 'gradient', 'color'][seed % 3],
      skyColor: this.generateColor(seed),
      horizonColor: this.generateColor(seed + 100),
      lighting: ['distant', 'point', 'directional'][seed % 3],
      shadow: seed % 2 === 0,
      fog: seed % 3 > 0,
      ground: ['none', 'flat', 'hills', 'canyon', 'spikes', 'noise'][seed % 6],
      groundYScale: 1 + (seed % 10) * 0.5,
      groundColor: this.generateColor(seed + 200),
      groundColor2: this.generateColor(seed + 300),
      dressing: ['none', 'cubes', 'pyramids', 'cylinders', 'towers', 'mushrooms'][seed % 6],
      dressingAmount: 10 + (seed % 40)
    };
  }

  /**
   * Generate lighting configuration
   */
  generateLighting(sceneId) {
    const seed = sceneId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      ambient: {
        color: this.generateColor(seed),
        intensity: 0.5 + (seed % 5) * 0.1
      },
      directional: {
        color: this.generateColor(seed + 50),
        intensity: 0.8 + (seed % 2) * 0.2,
        position: {
          x: -1 + (seed % 20) / 10,
          y: 2 + (seed % 10) / 5,
          z: -1 + (seed % 20) / 10
        },
        castShadow: seed % 2 === 0
      },
      point: seed % 3 === 0 ? {
        color: this.generateColor(seed + 100),
        intensity: 1 + (seed % 10) * 0.2,
        distance: 10 + (seed % 20),
        decay: 1 + (seed % 3) * 0.5,
        position: {
          x: (seed % 10) - 5,
          y: 3 + (seed % 5),
          z: -5 + (seed % 10)
        }
      } : null,
      hemisphere: seed % 4 === 0 ? {
        skyColor: this.generateColor(seed + 150),
        groundColor: this.generateColor(seed + 250),
        intensity: 0.6 + (seed % 4) * 0.1
      } : null
    };
  }

  /**
   * Generate camera configuration
   */
  generateCamera(sceneId) {
    const seed = sceneId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      position: {
        x: (seed % 20) - 10,
        y: 2 + (seed % 10) / 5,
        z: 10 + (seed % 10)
      },
      rotation: {
        x: -10 + (seed % 20),
        y: (seed % 360),
        z: 0
      },
      fov: 60 + (seed % 40),
      near: 0.1,
      far: 1000
    };
  }

  /**
   * Render scene to A-Frame HTML
   */
  renderScene(scene) {
    const envAttrs = this.renderEnvironmentAttributes(scene.environment);
    const lightingHTML = this.renderLighting(scene.lighting);
    const objectsHTML = scene.objects.map(obj => this.renderObject(obj)).join('\n');
    const cameraHTML = this.renderCamera(scene.camera);

    return `
      <a-scene ${envAttrs}>
        ${lightingHTML}
        ${cameraHTML}
        ${objectsHTML}
      </a-scene>
    `;
  }

  /**
   * Render environment attributes
   */
  renderEnvironmentAttributes(env) {
    return `
      environment="
        preset: ${env.preset};
        seed: ${env.seed};
        skyType: ${env.skyType};
        skyColor: ${env.skyColor};
        horizonColor: ${env.horizonColor};
        lighting: ${env.lighting};
        shadow: ${env.shadow};
        fog: ${env.fog ? '0.8' : '0'};
        ground: ${env.ground};
        groundYScale: ${env.groundYScale};
        groundColor: ${env.groundColor};
        groundColor2: ${env.groundColor2};
        dressing: ${env.dressing};
        dressingAmount: ${env.dressingAmount}
      "
    `.trim();
  }

  /**
   * Render lighting
   */
  renderLighting(lighting) {
    let html = '';

    // Ambient light
    html += `<a-entity light="type: ambient; color: ${lighting.ambient.color}; intensity: ${lighting.ambient.intensity}"></a-entity>\n`;

    // Directional light
    html += `<a-entity light="type: directional; color: ${lighting.directional.color}; intensity: ${lighting.directional.intensity}; castShadow: ${lighting.directional.castShadow}" position="${lighting.directional.position.x} ${lighting.directional.position.y} ${lighting.directional.position.z}"></a-entity>\n`;

    // Point light (if exists)
    if (lighting.point) {
      html += `<a-entity light="type: point; color: ${lighting.point.color}; intensity: ${lighting.point.intensity}; distance: ${lighting.point.distance}; decay: ${lighting.point.decay}" position="${lighting.point.position.x} ${lighting.point.position.y} ${lighting.point.position.z}"></a-entity>\n`;
    }

    // Hemisphere light (if exists)
    if (lighting.hemisphere) {
      html += `<a-entity light="type: hemisphere; color: ${lighting.hemisphere.skyColor}; groundColor: ${lighting.hemisphere.groundColor}; intensity: ${lighting.hemisphere.intensity}"></a-entity>\n`;
    }

    return html;
  }

  /**
   * Render camera
   */
  renderCamera(camera) {
    return `<a-entity camera position="${camera.position.x} ${camera.position.y} ${camera.position.z}" rotation="${camera.rotation.x} ${camera.rotation.y} ${camera.rotation.z}" fov="${camera.fov}" near="${camera.near}" far="${camera.far}" look-controls wasd-controls></a-entity>`;
  }

  /**
   * Render single object
   */
  renderObject(obj) {
    const geometryAttrs = this.renderGeometryAttributes(obj.geometry);
    const materialAttrs = this.renderMaterialAttributes(obj.material);
    const animationAttrs = obj.animation && obj.animation.enabled ? this.renderAnimationAttributes(obj.animation) : '';
    const componentAttrs = this.renderComponentAttributes(obj.components);

    return `
      <a-entity
        id="${obj.id}"
        geometry="${geometryAttrs}"
        material="${materialAttrs}"
        position="${obj.position.x} ${obj.position.y} ${obj.position.z}"
        rotation="${obj.rotation.x} ${obj.rotation.y} ${obj.rotation.z}"
        scale="${obj.scale.x} ${obj.scale.y} ${obj.scale.z}"
        ${animationAttrs}
        ${componentAttrs}>
      </a-entity>
    `.trim();
  }

  /**
   * Render geometry attributes
   */
  renderGeometryAttributes(geometry) {
    return Object.entries(geometry)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  /**
   * Render material attributes
   */
  renderMaterialAttributes(material) {
    const attrs = [];

    Object.entries(material).forEach(([key, value]) => {
      if (key !== 'type' && key !== 'uniforms') {
        attrs.push(`${key}: ${value}`);
      }
    });

    return attrs.join('; ');
  }

  /**
   * Render animation attributes
   */
  renderAnimationAttributes(animation) {
    const attrs = Object.entries(animation)
      .filter(([key]) => key !== 'enabled')
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    return `animation="${attrs}"`;
  }

  /**
   * Render component attributes
   */
  renderComponentAttributes(components) {
    return Object.entries(components)
      .map(([name, props]) => {
        const propsStr = Object.entries(props)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
        return `${name}="${propsStr}"`;
      })
      .join(' ');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      generatedCount: this.state.generatedCount,
      cachedObjects: this.state.cache.size,
      scenes: this.state.scenes.size
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.state.cache.clear();
  }
}
