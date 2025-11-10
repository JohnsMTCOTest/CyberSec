FROM debian:12-slim
RUN apt-get update && apt-get install -y qemu-system-arm python3 && rm -rf /var/lib/apt/lists/*
COPY qemu-wrapper.sh /usr/local/bin/qemu-wrapper.sh
RUN chmod +x /usr/local/bin/qemu-wrapper.sh
CMD ["/usr/local/bin/qemu-wrapper.sh"]
