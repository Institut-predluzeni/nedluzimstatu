FROM filipjirsak/mail-service:latest 

WORKDIR /home/app

ARG SENDGRID_API_KEY    

COPY ./zadosti.js /home/app/data/
COPY ./zadost.html /home/app/data/
COPY ./zadost.txt /home/app/data/

ADD ./application.yaml /home/app/application-tmp.yaml

RUN sed "$ s/SENDGRID_API_TOKEN/$SENDGRID_API_KEY/" /home/app/application-tmp.yaml > /home/app/application-ns.yaml
RUN rm /home/app/application-tmp.yaml

ENTRYPOINT ["java", "-Dmicronaut.config.files=/home/app/application-ns.yaml", "-Dmicronaut.http.client.read-timeout=1m", "-Dmicronaut.server.thread-selection=auto", "-jar", "/home/app/application.jar"]
