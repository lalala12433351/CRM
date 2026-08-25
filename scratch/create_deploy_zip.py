import os
import zipfile

zip_filename = "pixbe-crm-deploy.zip"

# Files and directories to include
items_to_include = [
    "package.json",
    "package-lock.json",
    "Procfile",
    ".npmrc",
    "server.ts",
    "vite.config.ts",
    "public",
    "dist"
]

print(f"Creating Linux-compatible POSIX zip archive: {zip_filename}")

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zf:
    for item in items_to_include:
        if not os.path.exists(item):
            print(f"Warning: {item} does not exist, skipping.")
            continue

        if os.path.isfile(item):
            # Store with forward slashes
            zf.write(item, arcname=item.replace("\\", "/"))
            print(f" Added file: {item}")
        elif os.path.isdir(item):
            for root, dirs, files in os.walk(item):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, start=".")
                    arcname = rel_path.replace("\\", "/")
                    zf.write(full_path, arcname=arcname)
                    print(f" Added dir file: {arcname}")

print("\nVerifying archive entry paths:")
with zipfile.ZipFile(zip_filename, "r") as zf:
    for name in zf.namelist():
        print("  -", name)

print("\nArchive size:", os.path.getsize(zip_filename), "bytes")
