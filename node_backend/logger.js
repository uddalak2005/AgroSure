import winston from 'winston';
import LokiTransport from 'winston-loki';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new LokiTransport({
      host: 'http://192.168.0.102:3100',
      labels: { job: 'agrisure-backend' },
      json: false,
      batching: true,
      interval: 4,
    })
  ]
});

<<<<<<< HEAD
export default logger;
=======
export default logger;
>>>>>>> 5c75385aa5f93fff442c8aba8d04aa3da857e9db
