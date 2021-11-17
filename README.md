# Pwoli with TypeScript and NodeJS - Sample Application

A sample TypeScript enabled NodeJS app which uses Pwoli to show users on how it works.

## Try it out

Easiest way is to clone this repo into your local:

```
git clone https://github.com/internetmango/pwoli-nodejs-typescript-sample.git
npm install
```

- Provide your DB credentials in the file models/index.ts

```
npm run build
npm run start
```

Point your browser to http://localhost:5000/items/list and you should see a page with a `GridView` where you can do CRUD operations for the items.

Point your browser to http://localhost:5000/items/api to see the RESTful API features mentioned in https://internetmango.github.io/pwoli/rest-api

- Insert some dummy records into the table `Company` for populating this `GridView` with some records.
