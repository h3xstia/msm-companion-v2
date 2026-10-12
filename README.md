# msm-companion-v2
Companion website for the game My Singing Monsters: collection tracker, breeding simulator,
zapping and Wubbox progress, availability (synced from the MSM wiki) and island plans.

No build step, just plain files. Edit, commit and push and GitHub Pages deploys it.

## Folder layout

| Path | What it is |
|---|---|
| `data/monsters.js` | Every monster and how to get it on each island. **Edit this to add monsters.** The comment at the top explains every field. |
| `data/islands.js` | Island list, order, sidebar groups, breeding elements, teleport levels |
| `data/wubbox.js` | The monsters each Wubbox needs |
| `images/` | Portraits and element icons. File names must be **lowercase** (GitHub Pages is case-sensitive). |
| `index.html`, `css/app.css` | Page and styles |
| `js/` | The app. `main.js` is the shell, `views/` has one file per section |
| `tools/check_data.py` | Checks the data files for mistakes |
| `sw.js`, `manifest.json` | Offline support / installable app |

## Adding or editing monsters

1. Edit `data/monsters.js` (copy an existing monster as a starting point).
2. Add its portrait to `images/monster portrait squares/` using a lowercase name, e.g. `glowl.png`,
   Rare Glowl is `glowl - rare.png`, Epic Glowl is `glowl - epic.png`.
3. Run the checker:
   ```
   python tools/check_data.py
   ```
   It catches misspelled names, unknown islands, bad times and missing images.
   The deploy also runs it and stops if there are errors.

## Running it locally

Any static web server works, e.g. from this folder:
```
python -m http.server 8642
```
then open http://localhost:8642. (Opening `index.html` directly from disk won't work because browsers block modules from `file://`.)

## Deploying (GitHub Pages)

1. Repo **Settings > Pages > Source: GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` checks the data, fills in secrets and a version number, and publishes.

### Cloud sync (optional)

Add repo secrets `SUPABASE_URL` and `SUPABASE_KEY` (Settings > Secrets and variables > Actions).
v2 uses its own table so it never overwrites v1 saves. Create it once in the Supabase SQL editor:

```sql
create table public.user_saves_v2 (
  id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.user_saves_v2 enable row level security;
create policy "own save" on public.user_saves_v2
  for all using (auth.uid() = id) with check (auth.uid() = id);
```

To let people delete their own account from Settings, also run:

```sql
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```

In Supabase **Authentication > URL Configuration**, add the site's URL so sign-up emails link back correctly.

---
Fan-made and not affiliated with Big Blue Bubble. Monster art belongs to Big Blue Bubble.
