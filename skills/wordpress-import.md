---
name: wordpress-import
description: "Use this skill when importing WordPress sites into Stellify. Invoke with /wordpress-import to start the guided workflow. Covers: analyzing WordPress exports, converting post types to Eloquent models, transforming PHP templates to Vue components, migrating forms and plugins, and creating routes and API endpoints."
license: MIT
metadata:
  author: stellify
---

# WordPress Import Skill

You are importing a WordPress site into Stellify by reading its PHP theme files and recreating the site as a structured Laravel application using the Stellify MCP tools.

**Match the rendering approach of the WordPress site.** If content is server-rendered in WordPress (which most of it will be — posts, pages, archives, navigation), create Blade templates. If a feature uses JavaScript for client-side interactivity (AJAX forms, dynamic filtering, live search, infinite scroll, modals, sliders), create a Vue component for that specific piece. The default is Blade — only reach for Vue when the WordPress source is doing something that genuinely requires JS.

## Step 1 — Identify the Active Theme

Look in `./wp-content/themes/` to find the active theme. If there are multiple themes, check for the most recently modified one, or the one with the most template files. If unsure, ask which theme to import.

Before proceeding, ask the user:

> **How do you want to handle the database?**
>
> **A) Connect to existing WordPress database** — Models map directly to the WordPress tables (`wp_posts`, `wp_users`, etc.) using the existing column names. No migrations, no data copying. Your Laravel app reads and writes to the same database WordPress uses. This is the fastest path.
>
> **B) Fresh database** — Create new Laravel migrations with clean column names (`title` instead of `post_title`, etc.). You start with an empty database and can optionally migrate content from WordPress later.

These are the only questions you may ask. Do not ask anything else.

## Step 2 — Inventory the Theme

Read the full theme directory. Categorise every file:

- **Core templates**: index.php, single.php, page.php, archive.php, search.php, 404.php, front-page.php, home.php
- **Structural partials**: header.php, footer.php, sidebar.php
- **Template parts**: anything in template-parts/ or patterns/
- **Functions**: functions.php (and any files it includes/requires)
- **Styles**: style.css, any CSS/SCSS files
- **Config**: theme.json if present (block theme configuration)

Print the inventory before proceeding.

## Step 3 — Analyse functions.php

Read functions.php thoroughly. Extract:

- **Custom post types** registered via `register_post_type()` → these become Laravel models
- **Taxonomies** registered via `register_taxonomy()` → these become models or enums
- **Navigation menus** registered via `register_nav_menus()` → these define nav structure
- **Widget areas** registered via `register_sidebar()` → note for layout
- **Enqueued scripts/styles** via `wp_enqueue_script/style()` → note any JS dependencies
- **Custom image sizes** via `add_image_size()` → note for media handling
- **Theme supports** via `add_theme_support()` → note post formats, thumbnails, etc.
- **Shortcodes** via `add_shortcode()` → these become Blade includes or components
- **AJAX handlers** via `wp_ajax_*` → these become API routes
- **Any included files** → read those too

## Step 4 — Plan the Laravel Structure

Before calling any Stellify tools, plan:

- **Models:** One per post type (Post, Page, plus any custom types from Step 3)
- **Controllers:** One per model with index/show actions
- **Routes:** Match WordPress URL structure (archive at `/`, singles at `/{slug}`, taxonomies at `/category/{slug}`)
- **Views:** Mirror WordPress template hierarchy — layout from header+footer, index/show views per post type, partials from template-parts
- **Migrations (Mode B only):** One per model with fields from WordPress core + any custom fields found in templates

## Step 5 — Build in Stellify (Order of Operations)

Execute the plan using Stellify MCP tools in this order. This order matters — parent records must exist before children.

### 5a. Create Models, Migrations & Controllers

Use the `create_resources` tool with `api: false` to generate models and controllers together. The `api: false` flag ensures controller methods return data arrays (for Blade views) rather than JSON responses.

**If Mode A (connect to existing WordPress database):**

Create resources that map to the existing WordPress tables. No migrations. Set the model's table and primary key to match WordPress.

```php
// Example Post model
class Post extends Model {
    protected $table = 'wp_posts';
    protected $primaryKey = 'ID';
    
    // Scope to only published posts (not revisions, drafts, etc.)
    public function scopePublished($query) {
        return $query->where('post_status', 'publish')
                     ->where('post_type', 'post');
    }
}
```

Key WordPress table mappings:
- Posts & Pages → `wp_posts` (distinguished by `post_type` column: 'post', 'page', or custom types)
- Categories & Tags → `wp_terms` + `wp_term_taxonomy` + `wp_term_relationships`
- Users → `wp_users`
- Post meta / custom fields → `wp_postmeta`
- Comments → `wp_comments`
- Navigation menus → `wp_posts` with `post_type = 'nav_menu_item'` + `wp_terms` with taxonomy `nav_menu`

In Blade templates, use WordPress column names:
- `$post->post_title` (not `$post->title`)
- `$post->post_content` (not `$post->content`)
- `$post->post_excerpt` (not `$post->excerpt`)
- `$post->post_name` (this is the slug)
- `$post->post_date` (not `$post->published_at`)
- `$post->post_status` (not `$post->status`)

**If Mode B (fresh database):**

Create new resources with clean Laravel migrations for each model identified in Step 4. Use clean column names (`title`, `slug`, `content`, `excerpt`, `status`, `published_at`, etc.). After the import is complete, suggest a data migration SQL query or artisan command that maps data from the WordPress tables to the new schema.

### 5b. Refine Controller Methods

`create_resources` (Step 5a) scaffolds controllers automatically. Review and refine the generated methods to ensure they query the right data. Controller methods in Stellify return data arrays — Stellify automatically merges these into the Blade view context. For example:

```php
// CORRECT for Stellify — returns a data array, Stellify handles the view binding
public function index(): array
{
    return ['posts' => Post::where('status', 'published')->latest('published_at')->paginate(10)];
}

public function show(Post $post): array
{
    return ['post' => $post];
}

// WRONG — do not return JSON
public function index()
{
    return Post::where('status', 'published')->get();
}

// WRONG — do not call view() directly, Stellify handles this
public function index()
{
    return view('posts.index', compact('posts'));
}
```

**Mode A note:** WordPress stores posts, pages, and custom post types all in `wp_posts`, distinguished by the `post_type` column. Controllers must scope queries accordingly — e.g. `Post::where('post_type', 'post')->where('post_status', 'publish')`. It also stores revisions and auto-drafts in the same table, so always filter by `post_status`.

### 5c. Create Routes
Create route entries mapping URLs to controller methods.

### 5d. Create the Layout (layouts/app.blade.php)
Read header.php and footer.php. Create a single Blade layout that combines:
- The HTML structure from header.php (doctype, head, opening body, nav)
- `@yield('content')` for page content
- The structure from footer.php (closing elements, footer content)

Translate WordPress functions to Blade:
- `wp_head()` → `@vite(['resources/css/app.css', 'resources/js/app.js'])` and `<meta>` tags
- `wp_footer()` → nothing needed (Vite handles it)
- `wp_nav_menu()` → `@include('partials.nav')`
- `bloginfo('name')` → `{{ config('app.name') }}`
- `bloginfo('description')` → `{{ config('app.description', '') }}`
- `body_class()` → appropriate Tailwind classes
- `language_attributes()` → `lang="{{ str_replace('_', '-', app()->getLocale()) }}"`

### 5e. Create Blade Views
For each WordPress template file, read the PHP and create the equivalent Blade view using `html_to_elements`. **All views use `@extends('layouts.app')` and `@section('content')`.**

**⚠️ Multiple Root Elements:** When converting HTML with multiple root-level elements (e.g., `<header>`, `<main>`, `<footer>`), only the first root element gets attached to the route. Make separate `html_to_elements` calls for each root element.

**WordPress → Blade translation guide:**

Mode A uses WordPress column names; Mode B uses clean Laravel names.

**IMPORTANT:** Inside `@foreach` loops, use `$item` as the loop variable. This matches the Stellify assembler's expectations for `textField`, `hrefField`, `srcField` attributes.

| WordPress | Blade (Mode A) | Blade (Mode B) | Stellify Attribute |
|-----------|----------------|----------------|-------------------|
| `the_title()` | `{{ $item->post_title }}` | `{{ $item->title }}` | `textField: "title"` |
| `the_content()` | `{!! $item->post_content !!}` | `{!! $item->content !!}` | statement with code |
| `the_excerpt()` | `{{ $item->post_excerpt }}` | `{{ $item->excerpt }}` | `textField: "excerpt"` |
| `the_permalink()` | `{{ route('posts.show', $item->post_name) }}` | `{{ route('posts.show', $item->slug) }}` | `hrefExpression: "..."` |
| `the_date()` | `{{ $item->post_date->format('d M Y') }}` | `{{ $item->published_at->format('d M Y') }}` | statement with code |
| `the_author()` | `{{ $item->author->display_name }}` | `{{ $item->author->name }}` | statement with code |
| `get_template_part()` | `@include('partials.post-card', ['post' => $item])` | same | s-directive |
| `have_posts()` | `@foreach($posts as $item)` | same | s-directive pair |

**Conditional Rendering with `s-directive`:**

WordPress blocks that render conditionally (like `<!-- wp:post-featured-image -->`) use `s-directive` elements. See the MCP tool documentation for the sibling pattern — create an opening directive, content elements, then a closing directive as siblings.

Common WordPress conditionals to convert (use `$item` inside loops):
- `<!-- wp:post-featured-image -->` → `@if($item->featured_image)` ... `@endif`
- `<!-- wp:post-excerpt -->` → `@if($item->post_excerpt)` ... `@endif`
- `<!-- wp:post-comments -->` → `@if($item->comments->count() > 0)` ... `@endif`
- `<!-- wp:query-no-results -->` → `@if($posts->isEmpty())` ... `@endif` (outside loop)

**Iteration (The Loop):**

WordPress's "The Loop" (`have_posts() / the_post()`) maps to `@foreach` directives. Use `s-directive` elements for the opening `@foreach` and closing `@endforeach`.

**IMPORTANT - Loop Variable:** The default loop variable is `$item`. When creating elements inside a loop:
1. Do NOT pass raw Blade syntax to `html_to_elements` — it will be stored literally
2. Create clean HTML first, then use `update_element` to add dynamic attributes:
   - `textField: "title"` → outputs `{{ $item->title }}`
   - `hrefField: "slug"` → outputs `href="{{ $item->slug }}"`
   - `srcField: "featured_image"` → outputs `src="{{ $item->featured_image }}"`
3. For complex expressions (route helpers, method calls), use:
   - `hrefExpression: "{{ route('posts.show', $item->slug) }}"`
   - `srcExpression: "{{ $item->featured_image }}"`
4. For text with Blade code, create a statement with `create_statement_with_code`, then add its UUID to the element's `statements` array via `update_element`

Example loop structure using `s-directive` siblings:
```
1. s-directive with statement: "@foreach($posts as $item)"
2. article element (content to repeat)
3. s-directive with statement: "@endforeach"
```

### 5f. Create Partials & Components
Convert template-parts/ files into Blade partials using `@include`. Static partials receive data via the second argument: `@include('partials.post-card', ['post' => $post])`. If a template part relies on JavaScript for interactivity (e.g. a slider, a filterable gallery, a live search form), create a Vue component instead and ensure it is registered and mounted in `app.js`.

### 5g. Style with Tailwind
Do not try to port WordPress CSS. Read the visual intent from the theme's CSS/theme.json and apply Tailwind utility classes directly in the Blade templates. For example:
- WordPress container → `<div class="max-w-4xl mx-auto px-4">`
- WordPress navigation → `<nav class="flex items-center gap-6">`
- WordPress post grid → `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`

## Step 6 — Review (Optional)

If requested, summarize what was created and note any WordPress features that couldn't be mapped.

## Important Rules

- **Blade for SSR, Vue for interactivity.** If the WordPress source is server-rendered PHP (posts, pages, archives, menus, layouts), create Blade templates using `@extends`, `@section`, `@include`, `@foreach`, `{{ }}` and `{!! !!}`. If the WordPress source uses JavaScript for interactivity (AJAX, dynamic filtering, sliders, modals, live search, infinite scroll), create a Vue component. When creating Vue components, ensure they are registered and mounted in `app.js` via `createApp` — do not just import them.
- **Do not ask questions** except the two permitted in Step 1 (which theme, and which database mode). Make reasonable decisions and document them.
- **Work file by file** — read a WordPress file, create the Stellify equivalent, move to the next.
- **Show progress** — print what you're reading and what you're creating as you go.
- **Handle block themes** — if theme.json exists and templates are in HTML with block markup (`<!-- wp:xxx -->`), parse the block structure rather than traditional PHP templates. The output is still Blade (or Vue where the block is interactive).
- **Style with Tailwind** — do not port WordPress CSS. Interpret the visual intent and use Tailwind utilities.
- **Be pragmatic** — focus on the core templates that define the site's main pages. Skip hyper-specific template variations unless they're clearly important.
- **Content handling depends on database mode** — In Mode A (existing DB), the content is already there via the WordPress tables. In Mode B (fresh DB), content is separate and can be migrated later.