const pkg = require("sequelize");
class Me extends pkg.Model{
    test = 'Mahesh';
}
console.log('me', Me)
module.exports = Me;
