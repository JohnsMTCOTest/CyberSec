FROM debian:12-slim
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*
COPY exploitme.c /src/exploitme.c
RUN gcc -fno-stack-protector -z execstack -o /app/exploitme /src/exploitme.c
CMD ["/app/exploitme"]
