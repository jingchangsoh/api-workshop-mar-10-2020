const range = require('express-range')
const compression = require('compression')

const express = require('express')

const data = require('./zips')
const CitiesDB = require('./zipsdb')

//Load application keys
const db = CitiesDB(data);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start of workshop

// Mandatory workshop
// TODO GET /api/states
app.get('/api/states',
	(req, resp) => {  //handler
		const result = db.findAllStates(); 
		//status code
		resp.status(200)
		//set content type
		resp.type('application/json');
		resp.set('X-generated-on', (new Date()).toDateString());
		//send data
		resp.json(result);
	}
)

// TODO GET /api/state/:state
// GET /api/state/CA state=CA
app.get('/api/state/:state',
	(req, resp) => {  //handler
		const state = req.params.state // read the value from the route :state
		//read the query string
		const limit = parseInt (req.query.limit) || 10;
		const offset = parseInt (req.query.offset) || 0;
		//10 result from the top
		const result = db.findCitiesByState(state, 
			{offset , limit }); 
		//status code
		resp.status(200)
		//set content type
		resp.type('application/json');
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
		console.info('body =',body);
		if (!db.validateForm(body)){
			//status code
			resp.status(400);
			//set content type
			resp.type('application/json');
			//send data
			resp.json({'message':'incomplete form'});
			return
		}
		//TODO loc = "number,number" => [number,number]
		db.insertCity(body)
		//status code
		resp.status(201);
		//set content type
		resp.type('application/json');
		//send data
		resp.json({'message':'created'});
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

const PORT = parseInt(process.argv[2] || process.env.APP_PORT) || 3000;
app.listen(PORT, () => {
	console.info(`Application started on port ${PORT} at ${new Date()}`);
});

