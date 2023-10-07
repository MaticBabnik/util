# Paper docker

Couldn't find a simple PaperMC docker image, so I made one.

### Sample compose file

```yml
services:
    vanilla:
        image: weebify/papermc:1.20.1-71 # <- build/publish ur own
        stdin_open: true # interactive (-i)
        tty: true # TTY (-t)
        restart: unless-stopped
        ports:
            - 25565
        volumes:
            - data:/mc
        environment:
            - MEMORY=8G

volumes:
    data:
```
