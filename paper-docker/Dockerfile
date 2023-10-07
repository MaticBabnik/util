
FROM amazoncorretto:17-alpine-full

RUN apk --no-cache add wget

ARG PAPER_JAR="https://api.papermc.io/v2/projects/paper/versions/1.20.1/builds/71/downloads/paper-1.20.1-71.jar"

RUN wget -O /paper.jar ${PAPER_JAR}

WORKDIR /mc

ENV MEMORY=4G

EXPOSE 25565

CMD java -Xmx$MEMORY -Xms$MEMORY -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 \
    -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 \
    -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 \
    -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 \
    -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem \
    -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true \
    -Dcom.mojang.eula.agree=true -jar /paper.jar