## Admin Navigation
- Add a clear entry in the admin menu: “Gallery → Albums” routed to `/admin/gallery-albums`.
- Keep the existing media manager (`/admin/gallery`) for raw photos if needed; Albums manager focuses on album-level organization.

## Albums List Page
- Table columns: Title, Type (Event/Campus/Staff/Other), Display Mode, Status (Draft/Published), Active, Order, Actions.
- Actions: View (opens public album), Edit, Delete, Toggle Active, Publish/Unpublish.
- Drag-and-drop to reorder albums (`display_order`), consistent with existing admin patterns.
- Filters: by Status and Type; simple search by Title.

## Create/Edit Album Form
- Fields: Title (required), Slug (auto from title, editable, unique check), Description, Type (Event/Campus/Staff/Other), Related Event (optional dropdown), Display Mode (`grid`, `slider`, `grid_slider`), Status (Draft/Published), Active, Display Order.
- Cover Image: upload new or pick from existing album photos using a picker modal.
- Publish flow: Save Draft, Publish; when publishing, set `published_at` if not set.
- Validation: prevent duplicate slug; ensure required Title; display-mode enum constraint; user feedback via toasts.

## Manage Photos (Inside Album)
- Multi-file upload to `gallery-images` bucket under `albums/<albumId>/...` with progress UI.
- Photo grid with:
  - Inline Caption edit
  - Drag-and-drop sort to update `sort_order`
  - Active/Inactive toggle
  - Delete
- Bulk operations: select multiple and delete or set active/inactive.
- Optional: Set selected photo as cover image.

## Display Mode Configuration
- `grid`: thumbnails grid + lightbox modal on click.
- `slider`: full-width banner carousel at top; autoplay toggle in admin; arrows/dots always on.
- `grid_slider`: banner + grid.
- Add optional album field `autoplay_ms` (default 4000) for slider timing.

## Data Model & Policies
- Use `gallery_albums` and `gallery_photos` with `album_id`, `caption`, `sort_order`, `is_active`.
- RLS: public read for published/active; admin-only writes via `user_roles` (already covered by your SQL migration).
- Indexes: unique index on `slug`; indexes on `status`, `is_active`, `display_order`, `album_id`.

## UX & Feedback
- Loading states and skeletons in list/grid.
- Toasts for success/error; disable buttons during uploads/saves.
- Confirmations on delete operations.

## Integration With Public Pages
- Ensure `/gallery` and `/gallery/:albumSlug` pull album data including `display_mode`, `cover_image`, captions.
- When an album is published/active, it appears on the index; drafts stay hidden.

## Migration & Backfill (Optional)
- Script to create albums from existing event photos:
  - For each event, create album (title=event title, related_event_id set, display mode=grid, cover=first image, status=published).
  - Attach existing images to `gallery_photos` with `album_id` and ordered `sort_order`.

## QA Checklist
- Admin menu and routing.
- Album CRUD and validations.
- Photo uploads, sorting, activation, deletion.
- Display modes render correctly on public album page.
- Permissions: public read only; admin can write.
- Mobile responsiveness and accessibility in admin and public views.

## Deliverables
- Enhanced admin Albums manager: list, filters, drag reorder, CRUD form, photo management, cover picker.
- Confirmed routing and visibility in admin nav.
- Optional migration script to backfill albums from events.
- Documentation notes for content team on creating albums and choosing display modes.