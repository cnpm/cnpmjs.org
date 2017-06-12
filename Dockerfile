FROM node:6.11
MAINTAINER lvyi <lvscar  {aT} gmail.com>

# Working enviroment
ENV \
    CNPM_DIR="/var/app/cnpmjs.org" \
    CONFIG_FILE="${CNPM_DIR}/config/config.js" \
    DATA_DIR="/var/cnpm" 

RUN mkdir  -p ${CNPM_DIR}

WORKDIR ${CNPM_DIR}

COPY package.json ${CNPM_DIR}

RUN npm install

COPY .  ${CNPM_DIR}

EXPOSE 7001/tcp 7002/tcp

# Entrypoint
CMD ["node", "dispatch.js"]

