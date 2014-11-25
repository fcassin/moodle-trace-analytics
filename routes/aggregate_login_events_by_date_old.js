var aggregate = {};

var mongo = require('./ktbs_mongo.js');

// As a first exemple, we only aggregate weekly
// TODO add the frequence to sample as a parameter
aggregate.groupByDate = function(callback) {
	var connection = mongo.createMongoConnection();

	var mapReducer = {};

	mapReducer.map = function map() {
		var date = new Date(this.begin);
		var startWeekDate = new Date(date.getFullYear(),
																 date.getMonth(),
																 date.getDate() - date.getDay() + 1,
																 0, 0, 0, 0);

		emit(startWeekDate, 1);
	}

	mapReducer.reduce = function(key, values) {
		return Array.sum(values);
	}

	mapReducer.query = { "@type" : "user_login" };
	mapReducer.verbose = true;

	var obselModel = mongo.getObselModel(connection);

	obselModel.mapReduce(mapReducer, function(err, results, stats) {
		if (err) throw err;

		console.log('Map/Reduce took %d ms', stats.processtime);
		mongo.disconnectMongo(connection);
		callback(err, results);
	});
}

aggregate.clearPreviousResults = function(callback) {
	mongo.removeResults('groupByDate', null, callback);
}

aggregate.groupByDateThenStore = function(callback) {
	aggregate.groupByDate(function(err, results) {
		if (err) return callback(err);

		mongo.storeResults('groupByDate', null, results, callback);
	});
}

aggregate.findResults = function(callback) {
	mongo.findResults('groupByDate', null, callback);
}

module.exports = aggregate;