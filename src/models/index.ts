export const Sequelize = require("sequelize");
import { DataTypes } from "sequelize";
export let sequelize;
const config = {
    "username": 'root2',
    "password": 'root',
    "database": 've',
    "host": '127.0.0.1',
    "dialect": "mysql"
};
sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
);
import Company from './Company';
export { Company };