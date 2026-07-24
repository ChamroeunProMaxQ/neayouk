import { config } from 'dotenv';
import 'reflect-metadata';

config({
  path: '.env.test',
});

console.log('process.env.NODE_ENV', process.env.NODE_ENV);
