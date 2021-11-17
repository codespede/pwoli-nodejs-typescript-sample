import { Sequelize } from 'sequelize';
let sequelize;
const config = {
    "username": 'root2',
    "password": 'root',
    "database": 've',
    "host": '127.0.0.1',
    "dialect": "mysql"
};

export default sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config as any
);
sequelize.sync()
