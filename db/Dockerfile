FROM postgis/postgis:18-3.6

RUN apt-get update
RUN apt-get install -y ca-certificates lsb-release wget

RUN wget https://packages.groonga.org/debian/groonga-apt-source-latest-trixie.deb

RUN apt-get install -y ./groonga-apt-source-latest-trixie.deb

RUN apt-get update

RUN apt-get install -y postgresql-18-pgdg-pgroonga
