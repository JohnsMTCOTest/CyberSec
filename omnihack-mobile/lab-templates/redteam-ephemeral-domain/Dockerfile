FROM alpine:3.18
RUN apk add --no-cache samba curl bash
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh
CMD ["/startup.sh"]
