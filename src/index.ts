import { Application as Pwoli } from 'pwoli';
import { createServer } from 'http';
console.log('pomc', Pwoli.ormModelClass);
import ejs = require("ejs");
import path = require('path');
import url = require("url");
import fs = require('fs')
Pwoli.viewPath = path.join(__dirname, 'views');
Pwoli.view.layout = '/layout.ejs'
import { Company } from './models';
import { ActiveDataProvider, DataHelper, GridView } from 'pwoli';
class MyGridView extends GridView{
  public key = 'Mahesh';
  public async init() {
    console.log('helloooo', this.dataProvider);
    await super.init.call(this);
  }
  public async run() {
    return await super.run.call(this);
  }
}

createServer(async function (req, res) {
  const uri = url.parse(req.url).pathname
  let filename = path.join(process.cwd(), uri);
  console.log('filename', filename);
  if (fs.existsSync(filename) && !fs.statSync(filename).isDirectory()) {
    fs.readFile(filename, "binary", function (err, file) {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.write(err + "\n");
        res.end();
        return;
      }
      res.writeHead(200);
      res.write(file, "binary");
      res.end();
      return;
    });
  } else {
    if (!req.url.includes("page")) {
    res.end();
    return;
    }
    
    
  Pwoli.request = req;
  const filterModel = new Company();
  console.log('parsed-query', DataHelper.parseUrl(req.url));
  const dataProvider = filterModel.search(DataHelper.parseUrl(req.url));
    const view = Pwoli.view;
    const grid = new MyGridView({ dataProvider, filterModel, columns: ['id', 'title'] });
    console.log('ejs', ejs);
    const company = (Company as any).build({ title: 'testCompany' });
    //res.write(company.title);
    res.write(await Pwoli.view.render('/layout.ejs', { view, 'subview': 'grid', grid })); //write a response
    res.end(); //end the response
  }
  
}).listen(5000, function(){
  console.log("Server started at port 5000"); //the server object listens on port 3000
});
