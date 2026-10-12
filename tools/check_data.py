"""Check the data files for mistakes.

Run from the repo folder after editing data/*.js:
    python tools/check_data.py

Errors are things that will break the app (typos in names, unknown islands, missing combos).
Warnings are worth a look but won't break anything.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RARITIES = {"Common", "Rare", "Epic"}
CLASSES = {"Natural", "Fire", "Magical", "Ethereal", "Mythical", "Seasonal", "Legendary", "Supernatural",
           "Paironormal", "Primordial", "Celestial", "Dipster", "Titansoul"}
HOWS = {"Breed", "Teleport", "Zap", "Purchase", "Evolve", "Harmonize", "Synthesize", "Fuze", "Dig"}
ENTRY_KEYS = {"island", "how", "combo", "uses", "time", "enhanced", "cost", "limit", "eggs", "note"}
MONSTER_KEYS = {"name", "rarity", "class", "elements", "img", "islands"}
TIME_RE = re.compile(r"^(\d+d)?( ?\d+h)?( ?\d+m)?( ?\d+s)?$")
WILDCARD_RE = re.compile(
    r"^Any (Monster|Triple|\w+ Triple|Single Ethereal|Single Mythical|Mythical|Rare Wublin"
    r"|Rare \w+ (Double|Triple|Quad))$")


def load_js(path, var):
    """Read `MSM.<var> = ...;` from a data file and return it as Python data."""
    src = open(path, encoding="utf-8").read()
    start = src.index(f"MSM.{var} =") + len(f"MSM.{var} =")
    text = src[start:].strip()
    out, i = [], 0
    # Walk the text: keep strings as-is, drop comments, quote bare keys, drop trailing commas.
    token = re.compile(r'"(?:[^"\\]|\\.)*"|//[^\n]*|/\*.*?\*/|[A-Za-z_]\w*(?=\s*:)|,(?=\s*[\]}])|.', re.S)
    for m in token.finditer(text):
        t = m.group(0)
        if t.startswith("//") or t.startswith("/*") or t == ",":
            if t == "," and m.end() < len(text) and not re.match(r"\s*[\]}]", text[m.end():]):
                out.append(t)
            continue
        if re.match(r"[A-Za-z_]\w*$", t) and t not in ("true", "false", "null"):
            out.append(json.dumps(t))
        else:
            out.append(t)
    joined = "".join(out).strip()
    if joined.endswith(";"):
        joined = joined[:-1]
    try:
        return json.loads(joined)
    except json.JSONDecodeError as e:
        line = src[:start].count("\n") + joined[:e.pos].count("\n") + 1
        sys.exit(f"ERROR: {os.path.basename(path)} has a syntax problem near line {line}: {e.msg}")


def main():
    errors, warnings = [], []
    islands = load_js(os.path.join(ROOT, "data", "islands.js"), "islands")
    monsters = load_js(os.path.join(ROOT, "data", "monsters.js"), "monsters")
    wubbox = load_js(os.path.join(ROOT, "data", "wubbox.js"), "wubbox")

    island_names = [i["name"] for i in islands]
    for n in {n for n in island_names if island_names.count(n) > 1}:
        errors.append(f"islands.js: island listed twice: {n}")

    portrait_dir = os.path.join(ROOT, "images", "monster portrait squares")
    element_dir = os.path.join(ROOT, "images", "elements")
    portraits = {f.lower(): f for f in os.listdir(portrait_dir)} if os.path.isdir(portrait_dir) else None
    elements = {f.lower(): f for f in os.listdir(element_dir)} if os.path.isdir(element_dir) else None

    for folder, files in (("monster portrait squares", portraits), ("elements", elements)):
        for low, actual in (files or {}).items():
            if actual != low:
                warnings.append(f"images/{folder}/{actual}: rename to lowercase or it won't load on GitHub Pages")

    names = [m.get("name") for m in monsters]
    name_set = set(names)
    for n in sorted({n for n in names if names.count(n) > 1}):
        errors.append(f"monster listed twice: {n}")

    used_islands = set()
    for m in monsters:
        who = m.get("name", "<no name>")
        for k in MONSTER_KEYS - {"img"}:
            if k not in m:
                errors.append(f"{who}: missing {k}")
        for k in set(m) - MONSTER_KEYS:
            errors.append(f"{who}: unknown field {k!r}")
        if m.get("rarity") not in RARITIES:
            errors.append(f"{who}: rarity {m.get('rarity')!r} should be one of {sorted(RARITIES)}")
        if m.get("class") not in CLASSES:
            errors.append(f"{who}: class {m.get('class')!r} is not a known class")

        if elements is not None:
            for el in m.get("elements", []):
                if el.lower() + ".png" not in elements:
                    warnings.append(f"{who}: no element icon for {el!r}")
        if portraits is not None and who != "Epic Wubbox":
            img = m.get("img") or (
                re.sub(r"^(Rare|Epic|Adult)\s+", "", who).replace("'", "_").lower()
                + (" - adult" if who.startswith("Adult ") else
                   " - rare" if m.get("rarity") == "Rare" else
                   " - epic" if m.get("rarity") == "Epic" else "") + ".png")
            if img.lower() not in portraits:
                warnings.append(f"{who}: no portrait image (looked for {img!r})")

        seen = set()
        for e in m.get("islands", []):
            isl = e.get("island")
            where = f"{who} @ {isl}"
            used_islands.add(isl)
            if isl not in island_names:
                errors.append(f"{where}: island not in islands.js")
            if isl in seen:
                errors.append(f"{where}: island listed twice for this monster")
            seen.add(isl)
            for k in set(e) - ENTRY_KEYS:
                errors.append(f"{where}: unknown field {k!r}")
            how = e.get("how")
            if how not in HOWS:
                errors.append(f"{where}: how {how!r} should be one of {sorted(HOWS)}")
            if how == "Breed" and "combo" not in e:
                errors.append(f"{where}: Breed needs a combo")
            if how == "Zap" and "eggs" not in e:
                errors.append(f"{where}: Zap needs eggs")
            if "combo" in e:
                if len(e["combo"]) != 2:
                    errors.append(f"{where}: combo must have exactly 2 parents")
                for p in e["combo"]:
                    if p not in name_set and not WILDCARD_RE.match(p):
                        errors.append(f"{where}: combo parent {p!r} is not a monster or wildcard")
            for pair in e.get("eggs", []):
                if not (isinstance(pair, list) and len(pair) == 2 and isinstance(pair[1], int)):
                    errors.append(f"{where}: egg entry {pair!r} should look like [\"Name\", 3]")
                elif pair[0] not in name_set and not WILDCARD_RE.match(pair[0]):
                    errors.append(f"{where}: egg {pair[0]!r} is not a monster or wildcard")
            for k in ("time", "enhanced"):
                if k in e and not (e[k] and TIME_RE.match(e[k])):
                    errors.append(f"{where}: {k} {e[k]!r} should look like \"1d 6h 30m\"")
            if how in ("Breed",) and "time" not in e:
                warnings.append(f"{where}: no time")

    for n in island_names:
        if n not in used_islands:
            warnings.append(f"islands.js: no monsters on {n}")

    for isl, boxes in wubbox.items():
        if isl not in island_names:
            errors.append(f"wubbox.js: island {isl!r} not in islands.js")
        for t, lst in boxes.items():
            if isinstance(lst, list):
                for n in lst:
                    if n not in name_set:
                        errors.append(f"wubbox.js: {isl} {t}: {n!r} is not a monster")

    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("ERROR:", e)
    print(f"\n{len(monsters)} monsters, {len(islands)} islands - {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
