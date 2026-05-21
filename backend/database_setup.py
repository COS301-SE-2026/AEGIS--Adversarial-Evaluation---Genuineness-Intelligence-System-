import shutil
import os

def setup():
    print("Setting up AEGIS backend...\n")

    if not os.path.exists(".env"):
        shutil.copy(".env.example", ".env")
        db_url = input("Enter your DATABASE_URL (ask a teammate for credentials): ").strip()
        write_db_url(db_url)
        print("✓ .env created")
    else:
        print("✓ .env already exists")
        overwrite = input("  Do you want to update the DATABASE_URL? (y/n): ").strip().lower()
        if overwrite == "y":
            db_url = input("Enter your DATABASE_URL (ask a teammate for credentials): ").strip()
            write_db_url(db_url)
            print("✓ .env updated")
        else:
            db_url = get_existing_db_url()
            print("  Keeping existing DATABASE_URL")

    if not os.path.exists("alembic.ini"):
        shutil.copy("alembic.ini.example", "alembic.ini")
        write_alembic_url(db_url)
        print("✓ alembic.ini created")
    else:
        print("✓ alembic.ini already exists")
        overwrite = input("  Do you want to update the database URL in alembic.ini? (y/n): ").strip().lower()
        if overwrite == "y":
            write_alembic_url(db_url)
            print("✓ alembic.ini updated")
        else:
            print("  Keeping existing alembic.ini")

    print("\nSetup complete! Now run:")
    print("  alembic upgrade head")


def get_existing_db_url():
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                return line.strip().split("=", 1)[1]
    return None


def write_db_url(db_url):
    with open(".env", "r") as f:
        content = f.read()
    with open(".env", "w") as f:
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("DATABASE_URL="):
                new_lines.append(f"DATABASE_URL={db_url}")
            else:
                new_lines.append(line)
        f.write("\n".join(new_lines))


def write_alembic_url(db_url):
    with open("alembic.ini", "r") as f:
        content = f.read()
    with open("alembic.ini", "w") as f:
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("sqlalchemy.url"):
                new_lines.append(f"sqlalchemy.url = {db_url}")
            else:
                new_lines.append(line)
        f.write("\n".join(new_lines))


if __name__ == "__main__":
    setup()