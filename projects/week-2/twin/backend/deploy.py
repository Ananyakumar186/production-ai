import os
import shutil
import zipfile
import subprocess

LAMBDA_ZIP = "lambda-deployment.zip"


def main():
    print("Creating Lambda deployment package...")

    # Clean up
    if os.path.exists(LAMBDA_ZIP):
        os.remove(LAMBDA_ZIP)
    if os.path.exists("lambda-deployment.zip"):
        os.remove("lambda-deployment.zip")

    # Create package directory
    os.makedirs("lambda-package")

    # Install dependencies using Docker with Lambda runtime image
    print("Installing dependencies for Lambda runtime...")

    try:
        subprocess.run(
            [
                "docker",
                "run",
                "--rm",
                "-v",
                f"{os.getcwd()}:/var/task",
                "--platform",
                "linux/amd64",  # Force x86_64 architecture
                "--entrypoint",
                "",  # Override the default entrypoint
                "public.ecr.aws/lambda/python:3.12",
                "/bin/sh",
                "-c",
                "pip install --target /var/task/lambda-package -r /var/task/requirements.txt --platform manylinux2014_x86_64 --only-binary=:all: --upgrade",
            ],
            check=True,
        )
    except FileNotFoundError:
        print("Error: Docker is not installed or not found in PATH. Please install Docker to continue.")
        return

    # Copy application files
    print("Copying application files...")
    for file in ["server.py", "lambda_handler.py", "context.py", "resources.py"]:
        if os.path.exists(file):
            shutil.copy2(file, "lambda-package/")
    
    with zipfile.ZipFile(LAMBDA_ZIP, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk("lambda-package"):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, "lambda-package")
                zipf.write(file_path, arcname)
    with zipfile.ZipFile("lambda-deployment.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk("lambda-package"):
                size_mb = os.path.getsize(LAMBDA_ZIP) / (1024 * 1024)
                print(f"✓ Created {LAMBDA_ZIP} ({size_mb:.2f} MB)")
                arcname = os.path.relpath(file_path, "lambda-package")
                zipf.write(file_path, arcname)

    # Show package size
    size_mb = os.path.getsize("lambda-deployment.zip") / (1024 * 1024)
    print(f"✓ Created lambda-deployment.zip ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()