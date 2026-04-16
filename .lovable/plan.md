
The user wants a new "Manutenção Predial" (Building Maintenance) feature, separate from machine tickets. Let me plan this concisely.

**Scope:**
1. New "Cadastros" tabs: "Setor Predial" and "Localização Predial" (alongside existing Fornecedores/Localizações).
2. New page `/building-maintenance` with:
   - Request button (open new building maintenance request)
   - List view to see/resolve requests (similar to tickets flow)
3. Sidebar entry + route + role access.

**Database:**
- `building_sectors` (id, name, created_at)
- `building_locations` (id, name, sector_id, created_at)
- `building_maintenance_requests` (id, code serial, sector_id, location_id, title, description, priority, status [pending/in_progress/resolved], requested_by, assigned_to, photo_url, resolution_notes, resolution_photo_url, actual_hours, created_at, started_at, resolved_at)
- RLS: authenticated full access (matches existing pattern)
- Sequence for code (e.g., MP-0001)

**Frontend files:**
- `src/pages/BuildingMaintenance.tsx` — single page with two tabs: "Solicitar/Lista" and uses dialogs for create + resolve. Filters by status.
- `src/components/forms/BuildingRequestDialog.tsx` — create request (sector dropdown, location dropdown filtered by sector, title, description, priority, photo upload to `ticket-attachments`).
- `src/components/forms/BuildingResolveDialog.tsx` — resolve (notes, photo, actual hours).
- `src/pages/Registrations.tsx` — add 2 new tabs: "Setor Predial" with CRUD, "Localização Predial" with CRUD + sector selector.
- `src/components/layout/AppSidebar.tsx` — add "Manutenção Predial" entry (icon: Building2).
- `src/App.tsx` — register route.
- `src/hooks/useAuth.tsx` — allow route for all roles (or admin/supervisor/planejador/technician — exclude operator from resolving but allow requesting). Simpler: allow all authenticated users; restrict resolve action by role inside the page.

**Permissions:**
- Anyone authenticated can create a request.
- Only admin/supervisor/planejador/technician can mark in_progress/resolved.

**No design changes** — reuse existing glass-card / 3D theme.
