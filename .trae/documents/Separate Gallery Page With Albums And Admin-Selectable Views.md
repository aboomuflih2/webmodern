## Routing
- Public routes in `src/App.tsx`:
  - `Route path="/gallery" element={<GalleryIndex />} />`
  - `Route path="/gallery/:albumSlug" element={<GalleryAlbum />} />`
- Header navigation (`src/components/Header.tsx`): Add a “Gallery” menu item linking to `/gallery`.

## Pages
- `src/pages/GalleryIndex.tsx`:
  - Fetch published albums sorted by `display_order`.
  - Render album cards: cover image, title, optional description/tag, photo count.
  - Pagination or “Load More” with incremental fetch; prepare filter controls (year/category) for future.
- `src/pages/GalleryAlbum.tsx`:
  - Get `albumSlug` from route params, fetch album + photos.
  - Header: title, linked event (if any), description, date (event or published_at).
  - Display according to `display_mode`:
    - Grid (thumbnails + popup/lightbox modal with next/prev/slideshow).
    - Banner Slider (full-width carousel with caption, autoplay, arrows, dots).
    - Grid + Slider (banner on top, grid below).
  - Modal viewer reuses existing Dialog components for consistency; keyboard/touch navigation.

## Display Modes
- Enum `display_mode`: `grid`, `slider`, `grid_slider` stored per album.
- Implement:
  - Grid: responsive CSS grid, lazy-loaded thumbnails, open modal on click.
  - Slider: top hero-style carousel; autoplay with configurable interval; manual arrows + dots.
  - Mixed: render slider then grid of all photos.

## Data Model (Supabase)
- `gallery_albums`:
  - `id (uuid)`, `title (text)`, `slug (text unique)`, `description (text nullable)`,
  - `cover_image (text)`, `display_mode (text enum)`, `type (text: event/campus/staff/other nullable)`,
  - `related_event_id (uuid nullable)`, `status (text: draft/published)`, `published_at (timestamp)`,
  - `is_active (bool)`, `display_order (int)`, `created_by`, `updated_by`, timestamps.
- `album_photos` (or extend `gallery_photos` with `album_id`):
  - `id (uuid)`, `album_id (uuid fk)`, `image_path (text)`, `caption (text nullable)`,
  - `sort_order (int)`, `is_active (bool)`, timestamps.
- Indexes: unique index on `slug`, indexes on `status`, `is_active`, `display_order`, `album_id`.

## RLS & Permissions
- Public read: allow `select` on `gallery_albums` where `status = 'published' AND is_active = true` and on `album_photos` where `is_active = true`.
- Admin write: allow `insert/update/delete` for admin roles only.
- Storage: continue using `gallery-images` bucket; enforce public read for images, admin write for uploads.

## Admin Panel
- Add `src/pages/admin/GalleryAlbumsManager.tsx` or extend existing `GalleryManager`:
  - Album List: title, type/related event, display mode, status; actions: view/edit/delete.
  - Create/Edit form: title, slug (auto/editable), description, display mode, type, related event (dropdown), cover image picker/upload, status (draft/published).
  - Manage Photos: multi-upload (drag-and-drop), sortable grid/list (drag to change `sort_order`), caption input, toggle active/inactive, delete.
  - Publish workflow: Save Draft / Publish.
- Admin routes in `src/App.tsx`: add `admin/gallery-albums` if split.

## Migration From Existing Gallery
- Inspect current storage (`gallery_photos`) and event associations.
- For each event with photos:
  - Create an album: `title = event.title`, `related_event_id = event.id`, `display_mode = grid` (default), `cover_image = first image`, `status = published`, `slug = slugify(title)`.
  - Attach existing images to `album_photos` with `sort_order` reflecting current ordering.
- Verify `/gallery` lists all albums and `/gallery/{album-slug}` shows the photos.

## News/Events Page Cleanup
- Remove the embedded gallery section and related state/handlers from `src/pages/NewsEvents.tsx`.
- Optionally on event detail (if exists): show a small preview (3–4 thumbnails) or just a “View full album →” button linking to `/gallery/{album-slug}`.

## Frontend Behaviour Details
- Lightbox modal: reuse existing `Dialog` and `Button` components; add keyboard navigation (←/→), Escape to close; captions under image.
- Slider: implement a minimal custom carousel using state/timers, or integrate a lightweight slider later if the project adopts one.
- Accessibility: focus trap in modal, aria labels for navigation buttons, alt text from caption or title.

## Performance & SEO
- Thumbnails for grid (smaller variant of images); lazy-loading on cards and grid.
- Autoplay interval configurable; pause on hover; avoid heavy work on mobile.
- Per-album SEO: unique `<title>` and meta description; image `alt` populated.

## Validation & QA
- Navigation: Gallery menu → `/gallery`; album card click → `/gallery/{slug}`.
- Modes: Grid, Slider, Mixed render correctly; captions visible; modal navigation works.
- Mobile responsiveness: cards, grid, modal/slider usable on touch.
- Permissions: public can only read published/active; admins can manage albums/photos.

## Deliverables
- New pages: `GalleryIndex.tsx`, `GalleryAlbum.tsx`.
- Routes: `/gallery`, `/gallery/:albumSlug`.
- Admin: albums manager UI and routes.
- DB migrations: tables, indexes, RLS policies.
- News page cleaned up; optional event → album linking.