# node16
FROM node:16

WORKDIR /app

COPY . .

RUN npm config set registry https://registry.npmmirror.com/

RUN npm install

EXPOSE 3000

RUN chmod +x start.sh

CMD ["sh", "-c", "./start.sh && tail -f /dev/null"]