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

## Step 0 — Discover Tools

List all available Stellify MCP tools. Understand what each tool does, what parameters it requires, and any dependencies between them (e.g. you need a file before you can add methods to it, you need a method before you can add statements). Print a summary of the tools and their creation order.

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

Before calling any Stellify tools, write out the full plan:

### Models
- Post (always — WordPress core)
- Page (always — WordPress core)
- Category, Tag (if used)
- Any custom post types found in Step 3
- User (if the theme has author pages)

### Controllers
- PostController (index, show) — handles blog listing and single posts
- PageController (show) — handles static pages
- One controller per custom post type
- HomeController — if front-page.php or a static homepage exists
- SearchController — if search.php exists

### Routes (web.php)
Map the WordPress URL structure:
- `/` → HomeController or PostController@index
- `/blog` or `/posts` → PostController@index (if static homepage)
- `/{post-slug}` → PostController@show
- `/{page-slug}` → PageController@show
- `/category/{slug}` → PostController@index (filtered)
- `/tag/{slug}` → PostController@index (filtered)
- `/search` → SearchController@index
- Custom post type archives and singles

### Blade Views
Everything is Blade. The directory structure should be:
```
layouts/
  app.blade.php          ← from header.php + footer.php
posts/
  index.blade.php        ← from archive.php or index.php
  show.blade.php         ← from single.php
pages/
  show.blade.php         ← from page.php
partials/
  nav.blade.php          ← from wp_nav_menu output
  sidebar.blade.php      ← from sidebar.php
  post-card.blade.php    ← from template-parts/content.php
  comments.blade.php     ← from comments.php
  search-form.blade.php  ← from searchform.php
errors/
  404.blade.php          ← from 404.php
```

### Migrations (Mode B only)
If the user chose Mode B (fresh database), plan one migration per model with fields derived from:
- WordPress core fields: title, slug, content, excerpt, featured_image, status, published_at
- Custom fields from `get_post_meta()` calls found in templates
- Any ACF or custom meta boxes registered in functions.php

If the user chose Mode A (existing database), skip migrations entirely — the tables already exist.

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
For each WordPress template file, read the PHP and create the equivalent Blade view. **All views use `@extends('layouts.app')` and `@section('content')`.**

**WordPress → Blade translation guide:**

The Blade column depends on which database mode was chosen. Mode A uses WordPress column names directly; Mode B uses clean Laravel names.

| WordPress | Blade (Mode A — existing DB) | Blade (Mode B — fresh DB) |
|-----------|------------------------------|---------------------------|
| `the_title()` | `{{ $post->post_title }}` | `{{ $post->title }}` |
| `the_content()` | `{!! $post->post_content !!}` | `{!! $post->content !!}` |
| `the_excerpt()` | `{{ $post->post_excerpt }}` | `{{ $post->excerpt }}` |
| `the_permalink()` | `{{ route('posts.show', $post->post_name) }}` | `{{ route('posts.show', $post->slug) }}` |
| `the_post_thumbnail()` | via `wp_postmeta` lookup | `<img src="{{ asset('storage/' . $post->featured_image) }}" />` |
| `the_date()` / `the_time()` | `{{ \Carbon\Carbon::parse($post->post_date)->format('d M Y') }}` | `{{ $post->published_at->format('d M Y') }}` |
| `the_author()` | `{{ $post->author->display_name }}` | `{{ $post->author->name }}` |
| `comments_template()` | `@include('partials.comments', ['post' => $post])` | same |
| `get_template_part('content')` | `@include('partials.post-card', ['post' => $post])` | same |
| `have_posts() / the_post()` | Use an `s-loop` element (see below) | same |
| `wp_link_pages()` | `{{ $posts->links() }}` | same |
| `get_search_form()` | `@include('partials.search-form')` | same |
| `wp_nav_menu()` | `@include('partials.nav')` | same |
| `get_header()` / `get_footer()` | handled by `@extends('layouts.app')` | same |
| `esc_html()` / `esc_attr()` | `{{ }}` (Blade auto-escapes) | same |
| `wp_kses_post()` | `{!! !!}` (for trusted HTML content) | same |

**Stellify `s-loop` elements for iteration:**

WordPress's "The Loop" (`have_posts() / the_post()`) requires two things in Stellify:

1. **Set the element type to `s-loop`** using `update_element` with `type: "s-loop"` and `variable` set to the collection name from the controller's return array. This tells Stellify to iterate over that variable and pass each item as `$item` to child elements.

2. **Write the `@foreach` in the Blade template as well.** The Blade content inside the element still needs the `@foreach` loop.

Example: If the controller returns `['posts' => Post::paginate(10)]`, the element that lists posts should be updated to:
```json
{
  "uuid": "<element-uuid>",
  "data": {
    "type": "s-loop",
    "variable": "posts"
  }
}
```
And the Blade content inside uses `@foreach($posts as $post)` ... `@endforeach` as normal.

This applies to any listing — post archives, category pages, search results, related posts, comment lists, navigation menu items, etc.

### 5f. Create Partials & Components
Convert template-parts/ files into Blade partials using `@include`. Static partials receive data via the second argument: `@include('partials.post-card', ['post' => $post])`. If a template part relies on JavaScript for interactivity (e.g. a slider, a filterable gallery, a live search form), create a Vue component instead and ensure it is registered and mounted in `app.js`.

### 5g. Style with Tailwind
Do not try to port WordPress CSS. Read the visual intent from the theme's CSS/theme.json and apply Tailwind utility classes directly in the Blade templates. For example:
- WordPress container → `<div class="max-w-4xl mx-auto px-4">`
- WordPress navigation → `<nav class="flex items-center gap-6">`
- WordPress post grid → `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">`

## Step 6 — Review

After building everything, print a summary:
- Database mode chosen (A or B)
- Total models created (and which WordPress tables they map to, if Mode A)
- Total controllers and methods
- Total routes
- Total Blade views and partials
- Total Vue components (if any) and why each was needed
- Any WordPress features that could NOT be mapped (e.g. specific plugins, shortcodes with no equivalent)
- If Mode B: provide a SQL migration query or artisan command to copy content from the WordPress database to the new schema
- Suggestions for manual follow-up

## Important Rules

- **Blade for SSR, Vue for interactivity.** If the WordPress source is server-rendered PHP (posts, pages, archives, menus, layouts), create Blade templates using `@extends`, `@section`, `@include`, `@foreach`, `{{ }}` and `{!! !!}`. If the WordPress source uses JavaScript for interactivity (AJAX, dynamic filtering, sliders, modals, live search, infinite scroll), create a Vue component. When creating Vue components, ensure they are registered and mounted in `app.js` via `createApp` — do not just import them.
- **Do not ask questions** except the two permitted in Step 1 (which theme, and which database mode). Make reasonable decisions and document them.
- **Work file by file** — read a WordPress file, create the Stellify equivalent, move to the next.
- **Show progress** — print what you're reading and what you're creating as you go.
- **Handle block themes** — if theme.json exists and templates are in HTML with block markup (`<!-- wp:xxx -->`), parse the block structure rather than traditional PHP templates. The output is still Blade (or Vue where the block is interactive).
- **Style with Tailwind** — do not port WordPress CSS. Interpret the visual intent and use Tailwind utilities.
- **Be pragmatic** — focus on the core templates that define the site's main pages. Skip hyper-specific template variations unless they're clearly important.
- **Content handling depends on database mode** — In Mode A (existing DB), the content is already there via the WordPress tables. In Mode B (fresh DB), content is separate and can be migrated later.