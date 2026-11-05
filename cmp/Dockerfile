FROM nginx:1.27-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY index.html style.css app.js /usr/share/nginx/html/
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
