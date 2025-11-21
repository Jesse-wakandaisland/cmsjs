# Understanding PocketBase 404 Responses

## Why You're Seeing 404

When you visit `http://127.0.0.1:8090` or `http://127.0.0.1:8090/api/` and get:

```json
{"code":404,"message":"Not Found.","data":{}}
```

**This is completely normal and expected!** Here's why:

### What's Happening

1. **Root Path (`/`)**: PocketBase doesn't serve anything at the root path. This is intentional - PocketBase is a backend API, not a full website.

2. **API Path (`/api/`)**: The base API path without a specific collection also returns 404 because you need to specify which collection you want to access.

### Where PocketBase DOES Respond

PocketBase has specific endpoints that DO work:

#### ✅ Admin UI (This WORKS)
```
http://127.0.0.1:8090/_/
```
This is where you:
- Create your admin account
- Create collections
- Manage data
- Configure settings

#### ✅ API Collections (After Creating Them)
```
http://127.0.0.1:8090/api/collections/content/records
http://127.0.0.1:8090/api/collections/templates/records
http://127.0.0.1:8090/api/collections/variations/records
```

But these only work AFTER you create the collections in the Admin UI.

#### ✅ Health Check
```
http://127.0.0.1:8090/api/health
```
Returns server health status.

## Getting Started with PocketBase

### Step 1: Access Admin UI

Visit http://127.0.0.1:8090/_/

On first visit, you'll see a screen to create an admin account:
- Email: your-email@example.com
- Password: (choose a secure password)

### Step 2: Create Collections

Click "Collections" → "New Collection" → "Base Collection"

Create these collections for CMS.js:

#### 1. `content` Collection

Fields:
- `type` (text, required)
- `title` (text)
- `body` (text, required)
- `html` (text)
- `css` (text)
- `js` (text)
- `metadata` (json)
- `status` (select: draft, published, archived)
- `author` (relation to users)

#### 2. `templates` Collection

Fields:
- `template_type` (text)
- `engine` (select: Cr8Base, Cr83D, Cr8Animation, Cr8Story, Cr8Multi, Cr8Form, Cr8Urweb)
- `config` (json)
- `html` (text)
- `css` (text)
- `js` (text)
- `preview_url` (url)
- `metadata` (json)

#### 3. `variations` Collection

Fields:
- `content_id` (relation to content)
- `style_name` (text)
- `config` (json)
- `fingerprint` (text, unique)

#### 4. `aframe_objects` Collection

Fields:
- `object_type` (select: box, sphere, cylinder, cone, etc.)
- `geometry` (json)
- `material` (json)
- `position` (json)
- `rotation` (json)
- `scale` (json)
- `animation` (json)
- `components` (json)
- `parent_id` (text)
- `scene_id` (text)
- `metadata` (json)

### Step 3: Test the API

After creating collections, test them:

```bash
# List all content (should return empty array initially)
curl http://127.0.0.1:8090/api/collections/content/records

# Create content (requires authentication)
curl -X POST http://127.0.0.1:8090/api/collections/content/records \
  -H "Content-Type: application/json" \
  -d '{
    "type": "page",
    "title": "Test Page",
    "body": "Hello World",
    "status": "published"
  }'
```

### Step 4: Configure API Rules

In Admin UI, for each collection:

1. Go to Collections → [collection name] → API Rules
2. Set rules based on your needs:

**For public read access:**
- List/Search Rule: `@request.auth.id != "" || status = "published"`
- View Rule: `@request.auth.id != "" || status = "published"`

**For authenticated write access:**
- Create Rule: `@request.auth.id != ""`
- Update Rule: `@request.auth.id = author.id`
- Delete Rule: `@request.auth.id = author.id`

## Testing Your Setup

### 1. Check PocketBase is Running

```bash
# Should show server info
curl http://127.0.0.1:8090/api/health

# Should show admin UI HTML
curl http://127.0.0.1:8090/_/
```

### 2. Check Collections Exist

```bash
# After creating collections, this should return an empty array or records
curl http://127.0.0.1:8090/api/collections/content/records
```

If you get 404 here, the collection doesn't exist yet - create it in Admin UI.

### 3. Test from Frontend

Open browser console at http://localhost:3000:

```javascript
// Check if PocketBase is accessible
fetch('http://127.0.0.1:8090/api/health')
  .then(r => r.json())
  .then(console.log)

// List content
fetch('http://127.0.0.1:8090/api/collections/content/records')
  .then(r => r.json())
  .then(console.log)
```

## Common Issues

### Issue: "CORS Error"

**Solution**: The `pb_hooks/main.pb.js` file should handle this. Make sure PocketBase is running and the hooks file is in place.

### Issue: "404 on /api/collections/content/records"

**Solution**: The `content` collection doesn't exist yet. Create it in Admin UI.

### Issue: "403 Forbidden"

**Solution**: The collection has API rules that require authentication. Either:
1. Log in first
2. Change the API rules to allow public access
3. Use the admin token in your request

### Issue: "Empty response on /"

**Solution**: This is normal! Use `/_/` for admin UI or `/api/collections/...` for API.

## Integration with CMS.js Frontend

Once PocketBase is set up with collections, the frontend will automatically:

1. **Sync with PGlite**: PocketBase ↔ Electric-SQL ↔ PGlite (browser)
2. **AevIP Updates**: Real-time incremental updates
3. **Store Generated Content**: Templates, 3D objects, variations

### Example: Saving Generated Template

```javascript
// Generate a template
const generator = cmsjs.systems.cr8engine.generateInfinite('Cr8Base');
const template = generator.next().value;

// Save to PocketBase via PGlite
await cmsjs.systems.pglite.createContent({
  type: 'template',
  title: template.id,
  html: template.html,
  css: template.css,
  metadata: { engine: 'Cr8Base', config: template }
});

// This will automatically sync to PocketBase backend!
```

## Quick Reference

| Endpoint | Purpose | Works Without Setup? |
|----------|---------|---------------------|
| `http://127.0.0.1:8090/` | Root (nothing here) | ❌ 404 (normal) |
| `http://127.0.0.1:8090/_/` | Admin UI | ✅ Yes |
| `http://127.0.0.1:8090/api/` | API base (nothing here) | ❌ 404 (normal) |
| `http://127.0.0.1:8090/api/health` | Health check | ✅ Yes |
| `http://127.0.0.1:8090/api/collections/[name]/records` | Collection API | ⚠️ After creating collection |

## Next Steps

1. ✅ Verify PocketBase is running
2. ✅ Access Admin UI at `/_/`
3. ✅ Create admin account
4. ⚠️ Create collections (content, templates, variations, aframe_objects)
5. ⚠️ Configure API rules
6. ✅ Test frontend integration

Once you complete step 4-5, the 404s will disappear and the full platform will work!

---

**Remember**: The 404 on `/` and `/api/` is NOT an error - it's how PocketBase is designed to work. The Admin UI and collection endpoints are what you actually use.
