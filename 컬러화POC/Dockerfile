FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    COLORIZER_DATA_DIR=/data \
    COLORIZER_SECURE_COOKIE=1 \
    MPLCONFIGDIR=/tmp/matplotlib

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py dicom_processing.py persistence.py ./
COPY static ./static
COPY templates ./templates

RUN mkdir -p /data && chown -R 10001:10001 /app /data
USER 10001:10001

EXPOSE 8501

CMD ["gunicorn", "--bind", "0.0.0.0:8501", "--workers", "1", "--threads", "4", "--timeout", "300", "--access-logfile", "-", "app:app"]
