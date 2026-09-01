import os
import zipfile

OUTPUT_ZIP = "Pixbe_CRM_Project.zip"

EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "coverage",
    ".next",
    ".cache"
}

EXCLUDE_FILES = {
    OUTPUT_ZIP,
    "pixbe-crm-deploy.zip",
    "package-lock.json.bak"
}

def create_zip():
    print(f"Creating project archive: {OUTPUT_ZIP}...")
    total_files = 0
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk("."):
            # Filter out excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".tmp")]
            
            for file in files:
                if file in EXCLUDE_FILES or file.endswith(".zip") or file.endswith(".log"):
                    continue
                file_path = os.path.join(root, file)
                # Archive path relative to root
                rel_path = os.path.relpath(file_path, ".").replace("\\", "/")
                z.write(file_path, rel_path)
                total_files += 1

    size_mb = os.path.getsize(OUTPUT_ZIP) / (1024 * 1024)
    print(f"Successfully packaged {total_files} files into {OUTPUT_ZIP} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    create_zip()
