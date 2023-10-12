FROM oven/bun:slim

WORKDIR /app

COPY bun.lockb package.json ./

RUN bun i

COPY . .

CMD [ "bun", "index.ts" ]