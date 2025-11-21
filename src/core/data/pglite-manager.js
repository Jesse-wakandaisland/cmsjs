/**
 * PGlite Manager
 * Manages browser-side PostgreSQL database using PGlite (WASM)
 * Integrates with Electric-SQL for real-time sync
 */

import { PGlite } from '@electric-sql/pglite';

export class PGliteManager {
  constructor(config = {}) {
    this.config = {
      dataDir: 'idb://cmsjs-db',
      debug: false,
      schema: {
        content: true,
        templates: true,
        variations: true,
        assets: true,
        settings: true
      },
      ...config
    };

    this.db = null;
    this.ready = false;
    this.init();
  }

  /**
   * Initialize PGlite database
   */
  async init() {
    try {
      // PGlite uses constructor, not static create method
      this.db = new PGlite(this.config.dataDir, {
        debug: this.config.debug
      });

      await this.createSchema();
      this.ready = true;

      console.log('PGlite: Database initialized');
    } catch (error) {
      console.error('PGlite: Initialization failed', error);
      throw error;
    }
  }

  /**
   * Create database schema
   */
  async createSchema() {
    // Content table - stores all CMS content
    if (this.config.schema.content) {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS content (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT,
          body TEXT NOT NULL,
          html TEXT,
          css TEXT,
          js TEXT,
          metadata JSONB DEFAULT '{}',
          tags TEXT[],
          status TEXT DEFAULT 'draft',
          author TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          published_at TIMESTAMP,
          version INTEGER DEFAULT 1
        );

        CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
        CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
        CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_content_updated ON content(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_content_tags ON content USING GIN(tags);
        CREATE INDEX IF NOT EXISTS idx_content_metadata ON content USING GIN(metadata);
      `);
    }

    // Templates table - stores cr8engine templates
    if (this.config.schema.templates) {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          engine_type TEXT NOT NULL,
          template_data JSONB NOT NULL,
          preview_url TEXT,
          tags TEXT[],
          config JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
        CREATE INDEX IF NOT EXISTS idx_templates_engine ON templates(engine_type);
        CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
      `);
    }

    // Variations table - stores infinite design variations
    if (this.config.schema.variations) {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS variations (
          id TEXT PRIMARY KEY,
          content_id TEXT REFERENCES content(id) ON DELETE CASCADE,
          style_name TEXT NOT NULL,
          variation_index INTEGER NOT NULL,
          css TEXT NOT NULL,
          html TEXT,
          config JSONB DEFAULT '{}',
          preview_data JSONB,
          fingerprint TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_variations_content ON variations(content_id);
        CREATE INDEX IF NOT EXISTS idx_variations_style ON variations(style_name);
        CREATE INDEX IF NOT EXISTS idx_variations_fingerprint ON variations(fingerprint);
      `);
    }

    // Assets table - stores media files, 3D objects, etc.
    if (this.config.schema.assets) {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS assets (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          url TEXT NOT NULL,
          thumbnail_url TEXT,
          metadata JSONB DEFAULT '{}',
          tags TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_assets_mime ON assets(mime_type);
        CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
      `);
    }

    // Settings table - stores app settings
    if (this.config.schema.settings) {
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // A-Frame 3D objects table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS aframe_objects (
        id TEXT PRIMARY KEY,
        object_type TEXT NOT NULL,
        geometry JSONB NOT NULL,
        material JSONB NOT NULL,
        position JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
        rotation JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
        scale JSONB DEFAULT '{"x": 1, "y": 1, "z": 1}',
        animation JSONB,
        components JSONB DEFAULT '{}',
        parent_id TEXT,
        scene_id TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_aframe_type ON aframe_objects(object_type);
      CREATE INDEX IF NOT EXISTS idx_aframe_scene ON aframe_objects(scene_id);
      CREATE INDEX IF NOT EXISTS idx_aframe_parent ON aframe_objects(parent_id);
    `);

    console.log('PGlite: Schema created');
  }

  /**
   * Query helper
   */
  async query(sql, params = []) {
    if (!this.ready) {
      throw new Error('Database not ready');
    }

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      console.error('PGlite: Query error', error, sql, params);
      throw error;
    }
  }

  /**
   * Execute helper (for non-query operations)
   */
  async exec(sql) {
    if (!this.ready) {
      throw new Error('Database not ready');
    }

    try {
      await this.db.exec(sql);
    } catch (error) {
      console.error('PGlite: Exec error', error, sql);
      throw error;
    }
  }

  /**
   * Content CRUD operations
   */
  async createContent(content) {
    const sql = `
      INSERT INTO content (id, type, title, body, html, css, js, metadata, tags, status, author)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const params = [
      content.id,
      content.type,
      content.title || null,
      content.body,
      content.html || null,
      content.css || null,
      content.js || null,
      JSON.stringify(content.metadata || {}),
      content.tags || [],
      content.status || 'draft',
      content.author || null
    ];

    const result = await this.query(sql, params);
    return result.rows[0];
  }

  async getContent(id) {
    const sql = 'SELECT * FROM content WHERE id = $1';
    const result = await this.query(sql, [id]);
    return result.rows[0];
  }

  async updateContent(id, updates) {
    const fields = [];
    const params = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          fields.push(`${key} = $${paramIndex}`);
          params.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          params.push(value);
        }
        paramIndex++;
      }
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    fields.push(`version = version + 1`);
    params.push(id);

    const sql = `
      UPDATE content
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(sql, params);
    return result.rows[0];
  }

  async deleteContent(id) {
    const sql = 'DELETE FROM content WHERE id = $1 RETURNING *';
    const result = await this.query(sql, [id]);
    return result.rows[0];
  }

  async listContent(filters = {}) {
    let sql = 'SELECT * FROM content WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.author) {
      sql += ` AND author = $${paramIndex}`;
      params.push(filters.author);
      paramIndex++;
    }

    sql += ' ORDER BY updated_at DESC';

    if (filters.limit) {
      sql += ` LIMIT ${parseInt(filters.limit)}`;
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Template operations
   */
  async saveTemplate(template) {
    const sql = `
      INSERT INTO templates (id, name, category, engine_type, template_data, tags, config)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE
      SET name = $2, category = $3, engine_type = $4, template_data = $5,
          tags = $6, config = $7, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const params = [
      template.id,
      template.name,
      template.category,
      template.engine_type,
      JSON.stringify(template.template_data),
      template.tags || [],
      JSON.stringify(template.config || {})
    ];

    const result = await this.query(sql, params);
    return result.rows[0];
  }

  async getTemplates(category = null) {
    let sql = 'SELECT * FROM templates';
    const params = [];

    if (category) {
      sql += ' WHERE category = $1';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Variation operations
   */
  async saveVariation(variation) {
    const sql = `
      INSERT INTO variations (id, content_id, style_name, variation_index, css, html, config, fingerprint)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (fingerprint) DO UPDATE
      SET css = $5, html = $6, config = $7
      RETURNING *
    `;

    const params = [
      variation.id,
      variation.content_id,
      variation.style_name,
      variation.variation_index,
      variation.css,
      variation.html || null,
      JSON.stringify(variation.config || {}),
      variation.fingerprint
    ];

    const result = await this.query(sql, params);
    return result.rows[0];
  }

  async getVariations(contentId, styleName = null) {
    let sql = 'SELECT * FROM variations WHERE content_id = $1';
    const params = [contentId];

    if (styleName) {
      sql += ' AND style_name = $2';
      params.push(styleName);
    }

    sql += ' ORDER BY variation_index';

    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * A-Frame 3D object operations
   */
  async saveAFrameObject(obj) {
    const sql = `
      INSERT INTO aframe_objects (id, object_type, geometry, material, position, rotation, scale, animation, components, parent_id, scene_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE
      SET object_type = $2, geometry = $3, material = $4, position = $5,
          rotation = $6, scale = $7, animation = $8, components = $9,
          parent_id = $10, scene_id = $11, metadata = $12
      RETURNING *
    `;

    const params = [
      obj.id,
      obj.object_type,
      JSON.stringify(obj.geometry),
      JSON.stringify(obj.material),
      JSON.stringify(obj.position || {x: 0, y: 0, z: 0}),
      JSON.stringify(obj.rotation || {x: 0, y: 0, z: 0}),
      JSON.stringify(obj.scale || {x: 1, y: 1, z: 1}),
      obj.animation ? JSON.stringify(obj.animation) : null,
      JSON.stringify(obj.components || {}),
      obj.parent_id || null,
      obj.scene_id || null,
      JSON.stringify(obj.metadata || {})
    ];

    const result = await this.query(sql, params);
    return result.rows[0];
  }

  async getAFrameObjects(sceneId) {
    const sql = 'SELECT * FROM aframe_objects WHERE scene_id = $1 ORDER BY created_at';
    const result = await this.query(sql, [sceneId]);
    return result.rows;
  }

  /**
   * Get database size
   */
  async getSize() {
    try {
      const result = await this.query('SELECT pg_database_size(current_database()) as size');
      return result.rows[0]?.size || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Cleanup and optimize
   */
  async vacuum() {
    await this.exec('VACUUM');
  }

  /**
   * Export data
   */
  async export() {
    const data = {
      content: await this.query('SELECT * FROM content'),
      templates: await this.query('SELECT * FROM templates'),
      variations: await this.query('SELECT * FROM variations'),
      aframe_objects: await this.query('SELECT * FROM aframe_objects'),
      settings: await this.query('SELECT * FROM settings')
    };

    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      data: {
        content: data.content.rows,
        templates: data.templates.rows,
        variations: data.variations.rows,
        aframe_objects: data.aframe_objects.rows,
        settings: data.settings.rows
      }
    };
  }

  /**
   * Import data
   */
  async import(exportData) {
    // TODO: Implement import with conflict resolution
    console.log('Import not yet implemented', exportData);
  }

  /**
   * Close database
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.ready = false;
    }
  }
}
