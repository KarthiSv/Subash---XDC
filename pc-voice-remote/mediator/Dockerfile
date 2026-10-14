# Optional: run the mediator in the cloud (Render, Fly.io, Railway, a VPS...)
# so your phone can reach your PC from anywhere. Set PCREMOTE_TOKEN as a secret.
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8765
EXPOSE 8765
CMD ["python", "mediator.py"]
