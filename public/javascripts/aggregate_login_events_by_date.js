var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var dailyFrequency = { frequency : 'daily' };
var weeklyFrequency = { frequency : 'weekly' };

// As a first exemple, we only aggregate weekly
// TODO add the frequence to sample as a parameter
aggregate.groupByDate = function(frequency, callback) {
	var connection = mongo.createMongoConnection();

	var mapReducer = {};

	mapReducer.scope = {
		frequency : frequency
	};

	mapReducer.map = function map() {
		var date = new Date(this.begin);

		var day;
		if (frequency.frequency === 'daily') {
			day = date.getDate();
		} else if (frequency.frequency === 'weekly') {
			day = date.getDate() - date.getDay() + 1;
		} else {
			// Defaults to daily
			day = date.getDate() - date.getDay() + 1;
		}

		var keyDate = new Date(date.getFullYear(),
																 date.getMonth(),
																 day,
																 0, 0, 0, 0);

		emit(keyDate, 1);
	}

	mapReducer.reduce = function(key, values) {
		return Array.sum(values);
	}

	mapReducer.query = { "@type" : "user_login" };
	mapReducer.verbose = true;

	var obselModel = mongo.getObselModel(connection);

	obselModel.mapReduce(mapReducer, function(err, results, stats) {
		if (err) {
			console.log(err);
			throw err;
		}

		console.log('Map/Reduce took %d ms', stats.processtime);
		mongo.disconnectMongo(connection);
		callback(err, results);
	});
}

aggregate.clearPreviousResults = function(callback) {
	async.series([
			function clearDailyResults(callback) {
				mongo.removeResults('countLoginsByDate', dailyFrequency, callback);
			},
			function clearWeeklyResults(callback) {
				mongo.removeResults('countLoginsByDate', weeklyFrequency, callback);
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.groupByDateThenStore = function(callback) {
	async.series([
			function groupDailyAndStore(callback) {
				aggregate.groupByDate(dailyFrequency, function(err, results) {
					if (err) return callback(err);

					mongo.storeResults('countLoginsByDate', dailyFrequency, results, callback);
				});
			}, function groupWeeklyAndStore(callback) {
				aggregate.groupByDate(weeklyFrequency, function(err, results) {
					if (err) return callback(err);

					mongo.storeResults('countLoginsByDate', weeklyFrequency, results, callback);
				});
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.findDailyResults = function(callback) {
	mongo.findResults('countLoginsByDate', dailyFrequency, callback);
}

aggregate.findWeeklyResults = function(callback) {
	mongo.findResults('countLoginsByDate', weeklyFrequency, callback);
}

module.exports = aggregate;