FROM openjdk:11
WORKDIR /app
ENTRYPOINT ["java","-jar","starter.jar","address=172.16.16.222","homedir=/app/home"]