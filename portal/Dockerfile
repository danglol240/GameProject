FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY index.html room.js /usr/share/nginx/html/
COPY vendor/ /usr/share/nginx/html/vendor/
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
