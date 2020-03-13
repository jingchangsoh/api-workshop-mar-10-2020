const { join } = require('path');
const fs = require('fs');

// load the library
const precondtions = require('express-preconditions');


const cors = require('cors');
const range = require('express-range')
const compression = require('compression')

const { Validator, ValidationError } = require('express-json-validator-middleware')
const  OpenAPIValidator  = require('express-openapi-validator').OpenApiValidator;

const schemaValidator = new Validator({ allErrors: true, verbose: true });

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

//disable express's etag
app.set('etag', false)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// TODO 1/2 Load schemans
new OpenAPIValidator({
    apiSpec: join(__dirname, 'schema', 'zips.yaml')
}).install(app)
    .then(() => {
// OK we can proceed with the rest of our app
// TODO 2/2 Copy your routes from workshop02 here
        // Mandatory workshop
        // TODO GET /api/states
        app.get('/api/states',
            (req, resp) => {  //handler
                console.info('in GET /api/states: ', new Date().toDateString())
                const result = db.findAllStates();
                //status code
                resp.status(200)
                // set header, public, age = 5min
                resp.set('Cache-Control', "public,max-age=300")
                
                // set content type
                resp.type('application/json');
                resp.set('X-generated-on', (new Date()).toDateString());
                //send data
                resp.json(result);
            } 
        )

        const options = {
            stateAsync: (req) => {
                const state = req.params.state
                const limit = parseInt(req.query.limit) || 10;
                const offset = parseInt(req.query.offset) || 0;
                return Promise.resolve({
                    // "CA_0_10"
                    etag: `"${state}_${offset}_${limit}"`
                })
            }
        }

        // TODO GET /api/state/:state
        // GET /api/state/CA state=CA
        app.get('/api/state/:state',
            precondtions(options),
            (req, resp) => {  //handler
                const state = req.params.state // read the value from the route :state
                //read the query string
                const limit = parseInt(req.query.limit) || 10;
                const offset = parseInt(req.query.offset) || 0;
                //10 result from the top
                const result = db.findCitiesByState(state,
                    { offset, limit });
                //status code
                resp.status(200)
                //set content type
                resp.type('application/json');
                //etag
                resp.set("ETag",`"${state}_${offset}_${limit}"`)
                //send data
                resp.json(result);
            }
        )

        // TODO GET /api/city/:cityId
        app.get('/api/city/:cityId',
            (req, resp) => {  //handler
                const cityId = req.params.cityId // read the value from the route :state
                //10 result from the top
                const result = db.findCityById(cityId);
                //status code
                resp.status(200)
                //set content type
                resp.type('application/json');
                //send data
                resp.json(result);
            }
        )

        // TODO POST /api/city
        // Content-Type: application/x-www-form-urlencoded
        app.post('/api/city',
            (req, resp) => {  //handler
                const body = req.body;
                console.info('body =', body);
                /*
                if (!db.validateForm(body)) {
                    //status code
                    resp.status(400);
                    //set content type
                    resp.type('application/json');
                    //send data
                    resp.json({ 'message': 'incomplete form' });
                    return
                }*/
                //TODO loc = "number,number" => [number,number]
                db.insertCity(body)
                //status code
                resp.status(201);
                //set content type
                resp.type('application/json');
                //send data
                resp.json({ 'message': 'created' });
            }

        )
        //TODO DELETE /api/city/:name

        // Optional workshop
        // TODO HEAD /api/state/:state
        // IMPORTANT: HEAD must be place before GET for the
        // same resource. Otherwise the GET handler will be invoked


        // TODO GET /state/:state/count
        app.get('/api/state/:state/count',
            (req, resp) => {  //handler
                const state = req.params.state
                const count = db.countCitiesInState(state);
                const result = {
                    state: state,
                    numOfCities: count,
                    timestamp: (new Date().toDateString())
                }
                //status code
                resp.status(200)
                //set content type
                resp.type('application/json');

                //send data
                resp.json(result);
            }
        )

        // TODO GET /api/city/:name
        app.get('/api/city/:name',
            (req, resp) => {  //handler
                const name = req.params.name // read the value from the route :state
                //10 result from the top
                const result = db.findCitiesByName(name);
                //status code
                resp.status(200)
                //set content type
                resp.type('application/json');
                //send data
                resp.json(result);
            }
        )
// End of workshop

// workshop02 above ^^^^
    app.use('/schema', express.static(join(__dirname, 'schema')));

    app.use((error, req, resp, next) => {

        if (error instanceof ValidationError) {
            console.error('Schema validation error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }

        else if (error.status) {
            console.error('OpenAPI specification error: ', error)
            return resp.status(400).type('application/json').json({ error: error });
        }

        console.error('Error: ', error);
        resp.status(400).type('application/json').json({ error: error });

    });

    const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
    app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`);
    });
})
.catch(error =>{
// there is an error with our yaml file
    console.error("Error :", error);
})
// Start of workshop


// End of workshop


