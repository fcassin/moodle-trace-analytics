var ktbsMongo = {};

var mongoose = require('mongoose');
var mongooseLong = require('mongoose-long')(mongoose);
var uuid = require('node-uuid');

// TODO Handle connections here ? Singleton ? Pool ?

var mongoURI = 'mongodb://localhost/ktbs';

var schemaTypes = mongoose.Schema.Types;
// Obsel schema for mongodb
ktbsMongo.obselSchema = new mongoose.Schema({
	'_serverid' : { type : String, default : generate_uuid },
	'@type' : String,
	begin : { type : schemaTypes.Long },
	end : { type: schemaTypes.Long },
	subject : String,
	args : Object,
	results : Object,
	student : Boolean,
	attr : { type : Object, default : 'null' },
	course : { type: Object, default : 'null' },
	added : { type : schemaTypes.Long, default : function() { 
		var now = new Date(); return now.getTime() } }
}, { collection : 'trace' });

ktbsMongo.createMongoConnection = function() {
	var connection = mongoose.createConnection(mongoURI, function(err) {
		if (err) throw err;
	});

	return connection;
}

ktbsMongo.disconnectMongo = function(connection) {
	connection.close(function(err) {
		if (err) throw err;
	});
}

ktbsMongo.getObselModel = function(connection) {
	return connection.model('obsel', ktbsMongo.obselSchema);
}

ktbsMongo.removeResults = function(functionName, args, callback) {
	var connection = ktbsMongo.createMongoConnection();
	var obselModel = ktbsMongo.getObselModel(connection);

	obselModel.remove({
		'@type' : 'aggregate',
		subject : functionName,
		args : args
	}, function(err) {
		if (err) return callback(err);

		ktbsMongo.disconnectMongo(connection);
		callback();
	})
}

ktbsMongo.storeResults = function(functionName, args, results, callback) {
	var connection = ktbsMongo.createMongoConnection();
	var obselModel = ktbsMongo.getObselModel(connection);

	var now = new Date();

	// TODO Get the oldest and newest obsels for each aggregate function ?
	var obsel = new obselModel({
		'@type' : 'aggregate',
		subject : functionName,
		args : args,
		results : results,
		begin : now.getTime(),
		end : now.getTime()
	});

	obsel.save(function(err) {
		if (err) return callback(err);

		ktbsMongo.disconnectMongo(connection);
		callback(null, results); 
	});
}

ktbsMongo.findResults = function(functionName, args, callback) {
	var connection = ktbsMongo.createMongoConnection();
	var obselModel = ktbsMongo.getObselModel(connection);

	obselModel.find({
		'@type' : 'aggregate',
		subject : functionName,
		args : args
	}, function(err, results) {
		if (err) return callback(err);

		ktbsMongo.disconnectMongo(connection);
		callback(null, results);
	});
}

function generate_uuid() {
	return uuid.v1();
}

module.exports = ktbsMongo;