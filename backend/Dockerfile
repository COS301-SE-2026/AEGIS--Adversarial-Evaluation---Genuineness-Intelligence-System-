# use a lightweight python image
FROM python:3.11-slim

# set the folder that works inside the container
WORKDIR /app

# create a non admin user to increase security.
RUN useradd -m appuser

# copy the requirements file and install the required depenencies
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy all of the required folders in the backend
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY database_setup.py .

# give the ownership to the non-root user
RUN chown -R appuser:appuser /app

# switch to the non-root / non-admin user
USER appuser

# expose the port on which FastAPI will run on
EXPOSE 8000

# command to run the FastAPI app using Uvicorn on any port Render assigns at runtime
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
