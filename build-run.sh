docker build -t unifaun . 
docker run -it --init \
  -p 8000:8000 \
  -e UNIFAUN_TOKEN \
  -e UNIFAUN_SENDER \
  -e UNIFAUN_SERVICE \
  -e SHOPIFY_WEBHOOK_SECRET \
  unifaun