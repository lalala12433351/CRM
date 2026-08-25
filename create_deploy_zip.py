import os
import zipfile

OUTPUT_ZIP = "pixbe-crm-deploy.zip"

FILES_TO_INCLUDE = [
    "Procfile",
    "package.json",
    "package-lock.json",
    "firebase-applet-config.json",
    ".env",
    ".env.example"
]

DIRS_TO_INCLUDE = [
    "dist",
    "public",
    ".ebextensions",
    ".platform"
]

def build_zip():
    print(f"Creating {OUTPUT_ZIP} with POSIX forward-slash paths for AWS Elastic Beanstalk...")
    count = 0
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as z:
        for file in FILES_TO_INCLUDE:
            if os.path.exists(file):
                z.write(file, file)
                print(f" Added file: {file}")
                count += 1
            else:
                print(f" Warning: {file} not found, skipping")

        for d in DIRS_TO_INCLUDE:
            if os.path.exists(d):
                for root, dirs, files in os.walk(d):
                    for f in files:
                        full_path = os.path.join(root, f)
                        # Normalize to forward slashes for Linux Zip compatibility
                        archive_name = full_path.replace("\\", "/")
                        z.write(full_path, archive_name)
                        count += 1
                        print(f" Added: {archive_name}")
            else:
                print(f" Warning: directory {d} not found")

    print(f"\nSuccessfully created {OUTPUT_ZIP} with {count} entries!")

if __name__ == "__main__":
    build_zip()
