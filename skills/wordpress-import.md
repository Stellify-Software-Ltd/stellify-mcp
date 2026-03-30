---
name: wordpress-import
description: "Use this skill when importing WordPress sites into Stellify. Invoke with /wordpress-import to start the guided workflow. Covers: analyzing WordPress exports, converting post types to Eloquent models, transforming PHP templates to Vue components, migrating forms and plugins, and creating routes and API endpoints."
license: MIT
metadata:
  author: stellify
---

# WordPress Import Skill

You are helping the user import a WordPress site into Stellify. Follow this workflow.

## Step 1: Understand the Project

First, call `get_project` to see the current Stellify project structure.

Then ask the user:
- Do they have a WordPress XML export, REST API JSON, or theme files?
- Which parts do they want to import? (posts, pages, templates, forms, etc.)

## Step 2: Analyze WordPress Content

Read the WordPress export files the user provides. Identify:

- **Post types**: Posts, pages, custom post types
- **Taxonomies**: Categories, tags, custom taxonomies
- **Templates**: header.php, footer.php, single.php, etc.
- **Custom fields**: ACF field groups or post meta
- **Plugins**: Forms, SEO, ecommerce, etc.

Report what you found and confirm the import plan.

## Step 3: Create Models

For each WordPress post type, use `create_resources`:

```
create_resources({
  name: "Post",
  fields: [
    { name: "title", type: "string", max: 255 },
    { name: "slug", type: "string", unique: true },
    { name: "content", type: "longtext" },
    { name: "excerpt", type: "text", nullable: true },
    { name: "status", type: "string", default: "draft" },
    { name: "published_at", type: "datetime", nullable: true },
    { name: "featured_image", type: "string", nullable: true }
  ],
  relationships: [
    { type: "belongsTo", model: "User", name: "author" },
    { type: "belongsToMany", model: "Category" },
    { type: "belongsToMany", model: "Tag" }
  ],
  controller: true,
  migration: true,
  api: true
})
```

Create taxonomy models (Category, Tag) with `belongsToMany` relationships back to content.

## Step 4: Convert Templates to Vue

For each WordPress template, create a Vue component:

1. `create_file(type='js', extension='vue', name='ComponentName')`
2. `create_statement_with_code` for imports and reactive state
3. `create_method` for data fetching and handlers
4. `html_to_elements` to convert the HTML (pass file UUID for @click auto-wiring)
5. `save_file` with template, data, and statements arrays
6. `get_assembled_code` to verify

### WordPress to Vue Mapping

| WordPress | Vue Equivalent |
|-----------|----------------|
| `the_title()` | `{{ post.title }}` |
| `the_content()` | `<div v-html="post.content">` |
| `the_excerpt()` | `{{ post.excerpt }}` |
| `get_the_date()` | `{{ post.published_at }}` |
| `the_post_thumbnail()` | `<img :src="post.featured_image">` |
| `have_posts()` / `the_post()` | `v-for="post in posts"` |
| `WP_Query` | `Http.get('/api/posts')` |
| `wp_nav_menu()` | Menu component with Collection |
| `get_header()` | `<Header />` component import |
| `get_footer()` | `<Footer />` component import |

## Step 5: Create Routes

For static pages:
```
create_route({
  project_id: "[uuid]",
  name: "About",
  path: "/about",
  method: "GET",
  type: "web"
})
```

Then use `html_to_elements` with the page UUID to add content.

For dynamic content, wire routes to controllers:
```
save_route({
  uuid: "[route-uuid]",
  controller: "[controller-uuid]",
  controller_method: "[method-uuid]"
})
```

## Step 6: Convert Forms

WordPress form plugins become Stellify Form components:

```javascript
import { Form, Http } from 'stellify-framework'

const form = Form.create({
  name: '',
  email: '',
  message: ''
}).rules({
  name: 'required|min:2',
  email: 'required|email',
  message: 'required|min:10'
})

async function submit() {
  if (await form.validate()) {
    await Http.post('/api/contact', form.data())
  }
}
```

Create an API route for form submission with a controller method.

## Step 7: Navigation Menus

Create a Menu component with the menu structure:

```javascript
const menuItems = ref([
  { label: 'Home', path: '/', children: [] },
  { label: 'About', path: '/about', children: [
    { label: 'Team', path: '/about/team' }
  ]}
])
```

Use `v-for` with recursion for nested menus.

## Step 8: Verify

After each component:
- Call `get_assembled_code` to check the output
- Confirm with the user before proceeding

## Plugin Equivalents

| WordPress Plugin | Stellify Approach |
|------------------|-------------------|
| Contact Form 7 | Form composable + API route |
| Yoast SEO | Model fields (meta_title, meta_description) |
| ACF | Model fields + JSON casts for repeaters |
| WooCommerce | create_resources for Product, Order, etc. |
| Gravity Forms | Form composable with complex validation |

## Tips

- Import models before templates (templates need models for data)
- Use `frameworkImports: ['Http', 'Form']` in save_file for composables
- Check `appJs.action_required` in create_file response for Vue mount files
- Shortcodes become Vue components: `[gallery]` → `<Gallery />`
