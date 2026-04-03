---
name: wordpress-import
description: "Use this skill when importing WordPress sites into Stellify. Invoke with /wordpress-import to analyse a WordPress project and generate resources for custom post types, taxonomies, and fields. Assumes standard WordPress models (Post, Page, Category, Tag, User, Media) are already scaffolded via Stellify."
license: MIT
metadata:
  author: stellify
---

# WordPress Import Skill

You are importing a WordPress site into Stellify. This skill focuses on **analysing what's custom** about the WordPress site and generating only those elements. Standard WordPress functionality (Posts, Pages, Categories, Tags, Users, Media) is handled by Stellify's WordPress scaffold.

## Step 1 — Verify WordPress Scaffold

Before proceeding, check that the Stellify WordPress scaffold has been run. Look for the presence of standard WordPress models in the Laravel project:

- `app/Models/Post.php`
- `app/Models/Page.php`
- `app/Models/Category.php`
- `app/Models/Tag.php`

If these don't exist, instruct the user:

> **WordPress scaffold required**
>
> Before importing, you need to run the Stellify WordPress scaffold. This creates the standard models, controllers, and routes that every WordPress site uses.
>
> Run: `[scaffold command TBD]`
>
> Let me know when this is complete.

Do not proceed until the scaffold is in place.

## Step 2 — Analyse the WordPress Project

Perform a comprehensive analysis of the WordPress site to understand what's custom. This produces a report before any code generation happens.

### 2a. Identify the Active Theme

Look in `./wp-content/themes/` to find the active theme. If there are multiple themes, check for the most recently modified one, or the one with the most template files. If unsure, ask which theme to import.

Note whether it's a classic PHP theme or a block theme (presence of `theme.json` and HTML templates).

### 2b. Scan for Custom Post Types & Taxonomies

Read `functions.php` and any files it includes/requires. Extract:

- **Custom post types** via `register_post_type()` — capture name, labels, supports array, and any custom rewrite rules
- **Custom taxonomies** via `register_taxonomy()` — capture name, which post types it attaches to, hierarchical setting

Also check for CPT plugins that store configuration differently:
- Custom Post Type UI stores config in `wp_options` under `cptui_post_types` and `cptui_taxonomies`
- Pods, Toolset, and similar plugins have their own storage patterns

### 2c. Scan Plugins Directory

List the contents of `wp-content/plugins/` and categorise:

**Functionality plugins** (affect what the site does — need attention):
- WooCommerce — e-commerce (major rebuild)
- Advanced Custom Fields / ACF Pro — custom fields
- Gravity Forms / Contact Form 7 / WPForms — forms
- The Events Calendar — event post type
- Custom plugin folders (not from wordpress.org)

**Low priority** (usually don't need porting):
- Yoast SEO / Rank Math — SEO meta (can note fields but not critical)
- Caching plugins (W3 Total Cache, WP Rocket)
- Security plugins (Wordfence, Sucuri)
- Backup plugins

**Builder plugins** (affect how templates work):
- Elementor / Elementor Pro
- WPBakery / Visual Composer
- Divi Builder
- Beaver Builder

Note: If a builder plugin is present, templates may be stored in the database rather than theme files.

### 2d. Database Analysis

If database access is available (direct connection or SQL dump), run these diagnostic queries:

```sql
-- Custom post types in use (beyond standard post/page/attachment)
SELECT post_type, COUNT(*) as count
FROM wp_posts
WHERE post_status = 'publish'
  AND post_type NOT IN ('post', 'page', 'attachment', 'revision', 'nav_menu_item', 'wp_template', 'wp_template_part', 'wp_global_styles', 'wp_navigation')
GROUP BY post_type
ORDER BY count DESC;

-- Custom taxonomies in use (beyond standard category/post_tag)
SELECT taxonomy, COUNT(*) as term_count
FROM wp_term_taxonomy
WHERE taxonomy NOT IN ('category', 'post_tag', 'nav_menu', 'link_category', 'post_format', 'wp_theme', 'wp_template_part_area')
GROUP BY taxonomy
ORDER BY term_count DESC;

-- Custom meta keys (reveals ACF fields, custom meta)
-- Excludes WordPress internal keys (prefixed with _)
SELECT meta_key, COUNT(*) as usage_count
FROM wp_postmeta
WHERE meta_key NOT LIKE '\_%'
GROUP BY meta_key
ORDER BY usage_count DESC
LIMIT 30;

-- ACF field groups (if ACF is used)
SELECT post_title, post_name
FROM wp_posts
WHERE post_type = 'acf-field-group'
  AND post_status = 'publish';

-- Shortcodes in content (indicates embedded functionality)
SELECT post_type, COUNT(*) as posts_with_shortcodes
FROM wp_posts
WHERE post_content REGEXP '\\[[a-zA-Z0-9_-]+.*\\]'
  AND post_status = 'publish'
GROUP BY post_type;

-- Gutenberg blocks in use (for block themes)
SELECT
  SUBSTRING_INDEX(SUBSTRING_INDEX(post_content, '<!-- wp:', -1), ' ', 1) as block_type,
  COUNT(*) as usage_count
FROM wp_posts
WHERE post_content LIKE '%<!-- wp:%'
  AND post_status = 'publish'
GROUP BY block_type
ORDER BY usage_count DESC
LIMIT 20;
```

### 2e. Produce Analysis Report

Present a structured summary before proceeding:

```
## WordPress Site Analysis

### Theme
- Name: theme-name
- Type: Classic PHP / Block theme
- Template files: [count]

### Content Summary
- Posts: [count]
- Pages: [count]
- [custom-type]: [count]

### Custom Post Types
| Name | Slug | Supports | Count |
|------|------|----------|-------|
| Portfolio | project | title, editor, thumbnail | 34 |
| Testimonial | testimonial | title, editor | 12 |

### Custom Taxonomies
| Name | Slug | Attached To | Hierarchical | Terms |
|------|------|-------------|--------------|-------|
| Project Type | project_type | project | Yes | 5 |

### Custom Fields (non-standard meta keys)
| Key | Used By | Count |
|-----|---------|-------|
| project_client | project | 34 |
| project_url | project | 34 |
| testimonial_company | testimonial | 12 |

### Plugins Requiring Attention
- Advanced Custom Fields Pro — field definitions above
- Contact Form 7 — 2 forms found

### Content Flags
- 15 posts contain shortcodes (will need processing during content migration)
- Page builder detected: Elementor (some layouts stored in database)

### Generation Plan
**Will generate:**
- Model: Project (custom post type)
- Model: Testimonial (custom post type)
- Model: ProjectType (custom taxonomy)
- Add fields to models: client, url, company

**Standard (already scaffolded):**
- Post, Page, Category, Tag, User, Media

**Manual attention needed:**
- Contact forms (2) — recreate in Laravel
- Shortcodes in content — process during migration
- Elementor layouts — extract design intent from theme templates
```

After presenting the report, ask:

> Does this analysis look correct? Ready to proceed with generating the custom resources?

## Step 3 — Generate Custom Resources

For each custom post type and taxonomy identified, create the necessary Laravel resources using Stellify MCP tools.

### 3a. Custom Post Type Models

For each custom post type, use `create_resources` with `api: false`:

**Model requirements:**
- Table name matching the post type slug (e.g., `projects`, `testimonials`)
- Standard fields: `title`, `slug`, `content`, `excerpt`, `status`, `published_at`, `author_id`
- Custom fields identified from meta analysis
- `getRouteKeyName()` returning `'slug'` for URL-friendly routing
- Relationships to custom taxonomies

**Migration requirements:**
- All standard fields plus custom fields
- Foreign keys to users table for author
- Indexes on slug, status, published_at

**Controller requirements:**
- `index()` returning paginated published items
- `show($model)` returning single item
- Return arrays (Stellify convention), not views or JSON

Example model structure:

```php
class Project extends Model
{
    protected $fillable = [
        'title', 'slug', 'content', 'excerpt',
        'status', 'published_at', 'author_id',
        'client', 'url', // custom fields
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function projectTypes(): BelongsToMany
    {
        return $this->belongsToMany(ProjectType::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
```

### 3b. Custom Taxonomy Models

For each custom taxonomy:

**Model requirements:**
- Table name matching taxonomy slug (e.g., `project_types`)
- Fields: `name`, `slug`, `description`, `parent_id` (if hierarchical)
- `getRouteKeyName()` returning `'slug'`
- Relationship to associated post types via pivot table

**Migration requirements:**
- Main taxonomy table
- Pivot table linking to each associated post type (e.g., `project_project_type`)

### 3c. Routes

Create routes following WordPress URL conventions where sensible:

```php
// Custom post type archives and singles
Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');

// Custom taxonomy archives
Route::get('/project-type/{projectType}', [ProjectTypeController::class, 'show'])->name('project-types.show');
```

## Step 4 — Document Manual Tasks

Create a summary of items requiring manual attention:

### Forms
List each form found with fields and purpose. The user will need to recreate these using Laravel form handling or a package like Laravel Livewire.

### Shortcodes in Content
List shortcodes found and their apparent purpose. These will need to be:
1. Processed during content migration (find/replace with HTML)
2. Or converted to Blade components if they need to remain dynamic

### Plugin Functionality
For significant plugins (WooCommerce, membership plugins, booking systems), note that this functionality needs separate planning and is outside the scope of this import.

### Content Migration
Note that content migration is a separate step. The user will need to:
1. Export content from WordPress (WP-CLI, plugin, or direct SQL)
2. Transform data to match new schema
3. Import into Laravel database
4. Process/clean embedded shortcodes
5. Migrate media files and update URLs

## Important Rules

- **Analysis first** — Always complete the full analysis before generating any code
- **Only generate custom elements** — Standard WordPress models come from the scaffold
- **Fresh database only** — This skill assumes a clean Laravel database, not connecting to WordPress tables
- **No template conversion** — Visual design/styling is handled by a separate skill
- **Document unknowns** — Flag anything that can't be automatically converted
- **Be pragmatic** — Focus on post types and taxonomies actually in use (have content), not just registered
