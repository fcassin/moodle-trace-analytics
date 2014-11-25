var aggregate = {};

var mongoose = require('mongoose');
var mongooseLong = require('mongoose-long')(mongoose);
var uuid = require('node-uuid');

var mongoURI = 'mongodb://localhost/ktbs';

function generate_uuid() {
	return uuid.v1();
}

var schemaTypes = mongoose.Schema.Types;
// Obsel schema for mongodb
var obselSchema = new mongoose.Schema({
	'_serverid' : { type : String, default : generate_uuid },
	'@type' : String,
	begin : { type : schemaTypes.Long },
	end : { type: schemaTypes.Long },
	subject : String,
	attr : { type : Object, default : 'null' },
	added : { type : schemaTypes.Long, default : function() { 
		var now = new Date(); return now.getTime() } }
}, { collection : 'trace' });

function createMongoConnection() {
	var connection = mongoose.createConnection(mongoURI, function(err) {
		if (err) throw err;
	});

	return connection;
}

function disconnectMongo(connection) {
	connection.close(function(err) {
		if (err) throw err;
	});
}

// As a first exemple, we only aggregate weekly
// TODO add the frequence to sample as a parameter
aggregate.groupByDate = function(callback) {
	var connection = createMongoConnection();

	var mapReducer = {};

	mapReducer.map = function map() {
		var date = new Date(this.begin);
		var startWeekDate = new Date(date.getFullYear(),
																 date.getMonth(),
																 date.getDate() - date.getDay() + 1,
																 0, 0, 0, 0);

		//emit(startWeekDate, {item : this, count : 1});
		emit(startWeekDate, 1);
	}

	mapReducer.reduce = function(key, values) {
		return Array.sum(values);
		//return values.length;
	}

	mapReducer.query = { "@type" : "user_login" };
	mapReducer.verbose = true;

	var obselModel = connection.model('obsel', obselSchema);

	obselModel.mapReduce(mapReducer, function(err, results, stats) {
		if (err) throw err;

		console.log('Map/Reduce took %d ms', stats.processtime);

		//console.log(stats);
		//console.log(results);
		callback(results);
		/*for (var i = 0; i < results.length; i++) {
			console.log(results[i]);
		}*/

		disconnectMongo(connection);
	});
}

module.exports = aggregate;