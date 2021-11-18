import { createServer } from 'http';
import path = require('path');
import { Application as Pwoli } from 'pwoli';
import sequelize from "./models"
Pwoli.setViewPath(path.join(__dirname, 'views'));
Pwoli.ormAdapterClasses['mongoose'] = {};
//Pwoli.setORMAdapter(new Pwoli.ormAdapterClasses['sequelize']());
const url = require('url');
import queryString = require('querystring');

import {
    GridView,
    View,
    SerialColumn,
    ActionColumn,
    CheckboxColumn,
    RadioButtonColumn,
    ActiveForm,
    DataHelper,
} from 'pwoli';
import fs = require('fs');
import Company from './models/Company';
import Event from './models/Event';

class MyGridView extends GridView {
    public key = 'Mahesh';
    public async init() {
        return await super.init.call(this);
    }
    public async run() {
        return await super.run.call(this);
    }
}

sequelize.sync().then(result => {
        //console.log('sync', result);
    }).catch(err => {
        //console.log('sync', err);
    });
createServer(async function (req, res) {
    Pwoli.view = new View({});
    //Pwoli.orm = 'mongoose'
    //console.log('orma', Pwoli.ormAdapterClasses, Pwoli.orm, Pwoli.getORMAdapter())
    
    const uri = url.parse(req.url).pathname;
    let filename = path.join(process.cwd(), uri);
    if (fs.existsSync(filename) && !fs.statSync(filename).isDirectory()) {
        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.write(err + '\n');
                res.end();
                return;
            }
            res.writeHead(200);
            res.write(file, 'binary');
            res.end();
            return;
        });
    } else {
        if (req.url.includes('items/delete')) {
            await Company.destroy({ where: { id: req.url.substring(req.url.lastIndexOf('/') + 1) } });
        }else if (req.url.includes('items/create') || req.url.includes('items/update')) {
            console.log('req-query', req.url.substring(req.url.lastIndexOf('/') + 1));
            const company = req.url.includes('items/create')
                ? new Company()
                : await Company.findOne({ where: { id: req.url.substring(req.url.lastIndexOf('/') + 1) } });
            //console.log('company-test', company);
            if (req.method === 'POST') {
                let body = '';
                req.on('data', function (data) {
                    body += data;
                });
                const post: any = await new Promise((resolve, reject) => {
                    req.on('end', function () {
                        resolve(DataHelper.parseQueryParams(queryString.parse(body)));
                    });
                });

                if (req.headers['x-requested-with'] === 'XMLHttpRequest' && company.load(post)) { //If it's an ajax validation request sent by ActiveForm
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(await ActiveForm.validate(company)));
                    res.end();
                    return;
                }
                console.log('before-save', post, company.load(post) && (await company.verify()), company.eventId);
                if (company.load(post) && (await company.verify())) {
                    //company.eventId = 1;
                    //company.title = 'tc';
                    await company
                        .save()
                        .then((result) => console.log('save-success', result))
                        .catch((error) => console.log('save-error', error));
                    //console.log('after-save', await company.save())
                    // res.writeHead(301,
                    //     { Location: '/form?success=true' }
                    // );
                    res.writeHead(302, {
                        Location: '/items/list',
                    });
                    return res.end();
                }
            }
            const form1 = new ActiveForm(); //no need to give `action` as default `action` will be taken as the current URL.
            await form1.initialization;
            const eventsList = {};
            (await Event.findAll()).forEach(event => { eventsList[event.id] = event.title } );
            res.write(await Pwoli.view.render('/form.ejs', { form1, eventsList, company }));
            res.end();
            return;
        }

        Pwoli.request = req;
        const filterModel = new Company();

        const dataProvider = filterModel.search(DataHelper.parseUrl(req.url));
        dataProvider.query.include = [{ model: Event, as: 'event' }];
        let sort = dataProvider.getSort();
        //console.log('dp-sort', sort)
        sort.attributes['event.title'] = {
            asc: ['event', 'title', 'asc'],
            desc: ['event', 'title', 'desc'],
        };
        dataProvider.setSort(sort);
        if (req.url.includes('items/list')) {
            let grid = new MyGridView({
                dataProvider,
                filterModel,
                columns: [
                    { class: CheckboxColumn },
                    { class: RadioButtonColumn },
                    { class: SerialColumn },
                    'id',
                    'title',
                    {
                        attribute: 'event.title',
                        label: 'Event Title(Related column)',
                        //value: (model) => model?.title + '..',
                    },
                    {
                        attribute: 'getter',
                        filter: false,
                    },
                    {
                        label: 'Sample',
                        value: (model, attribute) => model.sampleFunc(attribute),
                    },
                    { class: ActionColumn, route: 'items' /*visibleButtons: { update: false }*/ },
                ],
                options: {
                    id: 'my-grid',
                },
            });
            // res.write(await grid.render());

            let content = '';
            // grid = await grid.render();
            // res.write(await Pwoli.view.setLayout('/layout.ejs').render('/grid.ejs', { grid }));

            if (req.headers['x-requested-with'] === 'XMLHttpRequest')
                content = await Pwoli.view.render('/_grid.ejs', { grid, company: new Company() }, false); //rendering just the grid rendered in _grid.ejs if it's a Pjax request.
            else content = await Pwoli.view.render('/grid.ejs', { grid, company: new Company() });
            return Pwoli.respond(res, content);
            //Pwoli.respond(res, (res) => return res.render('view', { ...params }));
        } else if (req.url.includes('items/api')) {
            //If you want to add custom fields to the JSON response for each model, just do like below:
            const models = await dataProvider.getModels();
            for (let model of models) {
                model.setAttributeValues({
                    myGetter: await model.getter, //getter is a custom `getter` written in Company model.
                    // model.dataValues.anotherField = anotherValue;
                });
                console.log('api-model', model);
            }
            await dataProvider.setModels(models);

            Pwoli.respond(res, dataProvider);
        }
    }
}).listen(5000, function () {
  console.log("Server started at port 5000. Locate to http://localhost:5000/items/list"); //the server object listens on port 5000
});
