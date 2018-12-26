FROM node:chakracore-10.13.0

COPY docs/dockerize/debian9.aliyun.sources.list /etc/apt/sources.list
RUN apt-get update \
    && apt-get -y --no-install-recommends install netcat=1.10-41 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Working enviroment
ENV \
    CNPM_DIR="/var/app/cnpmjs.org" \
    CNPM_DATA_DIR="/var/data/cnpm_data" 

RUN mkdir  -p ${CNPM_DIR}
COPY . ${CNPM_DIR}/

WORKDIR ${CNPM_DIR}
COPY docs/dockerize/wait-for-it.sh ${CNPM_DIR}
COPY docs/dockerize/config.js  ${CNPM_DIR}/config/
RUN chmod +x wait-for-it.sh \
    && npm un --save sqlite3 \
    && npm install --build-from-source --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/mirrors/node \
    && npm install oss-cnpm@2.4.1 --registry=https://registry.npm.taobao.org



EXPOSE 7001/tcp 7002/tcp
VOLUME ["/var/data/cnpm_data"]


# Entrypoint
CMD ["node", "dispatch.js"]