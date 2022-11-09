import { createServer } from 'http';
import path = require('path');
import { Application as Pwoli, Model, View } from 'pwoli';
//Pwoli.ormAdapterClasses = { mongoose: MongooseAdapter };
Pwoli.setViewPath(path.join(__dirname, 'views'));

const url = require('url');
import queryString = require('querystring');

import {
    GridView,
    ListView,
    SerialColumn,
    ActionColumn,
    CheckboxColumn,
    RadioButtonColumn,
    ActiveForm,
    DataHelper,
} from 'pwoli';
import fs = require('fs');
import Event from "./mongo-models/Event";
import Organization from "./mongo-models/Organization";

class MyGridView extends GridView {
    public key = 'Mahesh';
    public async init() {
        return await super.init.call(this);
    }
    public async run() {
        return await super.run.call(this);
    }
}

createServer(async function (req, res) {
    Pwoli.view = new View({});
    //Pwoli.orm = 'mongoose'
    //
    const uri = url.parse(req.url).pathname;
    let filename = path.join(process.cwd(), uri);
    
    if(req.url.includes('noview')){
        res.write('noview');
        res.end();
    } else if (fs.existsSync(filename) && !fs.statSync(filename).isDirectory()) {
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
            await Event.remove(req.url.substring(req.url.lastIndexOf('/') + 1).split('?')[0]);
        }else if (req.url.includes('items/create') || req.url.includes('items/update')) {
            
            const event = (req.url.includes('items/create')
                ? new Event()
                : await Event.findById(req.url.substring(req.url.lastIndexOf('/') + 1).split('?')[0]) as any);
            //
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

                if (req.headers['x-requested-with'] === 'XMLHttpRequest' && event.load(post)) {
                    res.setHeader('Content-Type', 'application/json');
                    res.write(JSON.stringify(await ActiveForm.validate(event)));
                    res.end();
                    return;
                }
                
                //
                if (event.load(post) && (await event.verify())) {
                    //event.eventId = 1;
                    //event.title = 'tc';
                    await event
                        .save()
                        .then((result) => console.log('save-success', result))
                        .catch((error) => console.log('save-error', error));
                    //
                    // res.writeHead(301,
                    //     { Location: '/form?success=true' }
                    // );
                    res.writeHead(302, {
                        Location: '/items/list',
                    });
                    return res.end();
                }
            }
            const form1 = new ActiveForm();
            const form2 = new ActiveForm({ action: '/form', options: { 'data-pjax': 'true' } });
            await form1.initialization;
            await form2.initialization;
            const orgsList = {};
            (await Organization.find()).forEach(org => { orgsList[org.id] = org.title } );
            
            res.write(await Pwoli.view.render('/form_mongo.ejs', { form1, form2, event, orgsList }));
            res.end();
            return;
        }

        Pwoli.request = req;
        const filterModel = new Event();
        filterModel._id = null;
        
        const dataProvider = (filterModel as any).search(DataHelper.parseUrl(req.url));
        dataProvider.query.populate = 'organization';
        let sort = dataProvider.getSort();
        //
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
                    'contactPerson.name',
                    'organization.title',
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
                // options: {
                //     id: 'my-grid',
                // },
            });
            // res.write(await grid.render());

            let content = '';
            // grid = await grid.render();
            // res.write(await Pwoli.view.setLayout('/layout.ejs').render('/grid.ejs', { grid }));

            if (req.headers['x-requested-with'] === 'XMLHttpRequest')
                content = await Pwoli.view.render('/_grid.ejs', { grid, company: new Event() }, false); //rendering just the grid rendered in _grid.ejs if it's a Pjax request.
            else content = await Pwoli.view.render('/grid.ejs', { grid, company: new Event() });
            return Pwoli.respond(res, content);
            //Pwoli.respond(res, (res) => return res.render('view', { ...params }));
        } else if (req.url.includes('items/viewlist')) {
            Pwoli.setViewPath(path.join(__dirname, 'views'));
            // dataProvider.getSort().attributes = {
            //     id: {asc: ['id', 'asc'], desc: ['id', 'desc']}
            //   }
            let list = new ListView({
                dataProvider,
                itemView: '/_item.ejs',
                layout: '{summary}\n{sorter}\n{items}\n{pager}',
                options: {
                    id: 'my-grid',
                },
            });
            // res.write(await grid.render());

            let content = '';
            // grid = await grid.render();
            // res.write(await Pwoli.view.setLayout('/layout.ejs').render('/grid.ejs', { grid }));

            if (req.headers['x-requested-with'] === 'XMLHttpRequest')
                content = await Pwoli.view.render('/_list.ejs', { list, company: new Event() }, false); //rendering just the grid rendered in _grid.ejs if it's a Pjax request.
            else content = await Pwoli.view.render('/list.ejs', { list, company: new Event() });
            return Pwoli.respond(res, content);
            //Pwoli.respond(res, (res) => return res.render('view', { ...params }));
        } else if (req.url.includes('items/api')) {
            //If you want to add custom fields to the JSON response for each model, just do like below:
            const models = await dataProvider.getModels();
            for (let model of models) {
                model.setAttributeValues({
                    myGetter: await model.getter, //getter is a custom `getter` written in Event model.
                    // model.dataValues.anotherField = anotherValue;
                });
                
            }
            await dataProvider.setModels(models);

            Pwoli.respond(res, dataProvider);
        }
    }
}).listen(3005, function () {});
