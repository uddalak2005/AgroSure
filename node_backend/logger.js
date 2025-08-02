// logger.js
import winston from 'winston';
import LokiTransport from 'winston-loki';

const logger = winston.createLogger({
  transports: [
    new LokiTransport({
      host: 'http://192.168.0.102:3100', // Replace with your actual Loki endpoint
      labels: { job: 'agrisure-backend' },
      json: true,
      batching: true,
      interval: 4, // Push logs every 5 seconds
    })
  ]
});

export default logger;
