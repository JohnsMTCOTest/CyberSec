FROM alpine:3.18
RUN apk add --no-cache tcpdump
CMD ["/bin/sh", "-c", "tcpdump -w /mnt/pcap/traffic.pcap"]
