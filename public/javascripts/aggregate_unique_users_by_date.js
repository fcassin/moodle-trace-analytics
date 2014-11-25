var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'countByUniqueUserAndDate';
var intermediaryAggregationType = 'groupLoginsByDateAndUser';

var dailyFrequency = { frequency : 'daily' };
var weeklyFrequency = { frequency : 'weekly' };

aggregate.groupLoginsByDateAndUser = function(frequency, callback) {
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

		emit({date: keyDate, user_id: this.subject}, 1);
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

		console.log('First Map/Reduce took %d ms', stats.processtime);
		mongo.disconnectMongo(connection);
		callback(err, results);
	});
}

aggregate.countByUniqueUserAndDate = function(frequency, aggregationType, callback) {
	console.log('Frequency : ' + frequency.frequency);
	console.log('Aggregation type : ' + aggregationType);

	var connection = mongo.createMongoConnection();

	var mapReducer = {};

	mapReducer.map = function map() {
		var previousResults = this.results;
		previousResults.forEach(function(previousResult) {
			emit(previousResult._id.date, 1);
		});
	}

	mapReducer.reduce = function(key, values) {
		return Array.sum(values);
	}

	mapReducer.query = { 
		"@type" : 'aggregate',
		"subject" : aggregationType,
		"args.frequency" : frequency.frequency
	};
	mapReducer.verbose = true;

	var obselModel = mongo.getObselModel(connection);

	obselModel.mapReduce(mapReducer, function(err, results, stats) {
		if (err) {
			console.log(err);
			throw err;
		}

		console.log('Second Map/Reduce took %d ms', stats.processtime);
		console.log(results);
		mongo.disconnectMongo(connection);
		callback(err, results);
	});
}

aggregate.clearPreviousResults = function(callback) {
	async.series([
			function clearDailyResults(callback) {
				mongo.removeResults(intermediaryAggregationType, dailyFrequency, callback);
			},
			function clearDailyUniqueUsersResults(callback) {
				mongo.removeResults(aggregationType, dailyFrequency, callback);
			},
			function clearWeeklyResults(callback) {
				mongo.removeResults(intermediaryAggregationType, weeklyFrequency, callback);
			},
			function clearWeeklyUniqueUsersResults(callback) {
				mongo.removeResults(aggregationType, weeklyFrequency, callback);
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.groupLoginsByDateAndUserThenStore = function(callback) {
	async.series([
			function groupDailyAndStore(callback) {
				aggregate.groupLoginsByDateAndUser(
					dailyFrequency,
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(intermediaryAggregationType, 
														 	 dailyFrequency, 
														   results, 
														   callback);
				});
			}, function groupDailyByUniqueUser(callback) {
				aggregate.countByUniqueUserAndDate(
					dailyFrequency, 
					intermediaryAggregationType, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 dailyFrequency, 
															 results, 
															 callback);
				});
			}, function groupWeeklyAndStore(callback) {
				aggregate.groupLoginsByDateAndUser(
					weeklyFrequency, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(intermediaryAggregationType, 
															 weeklyFrequency, 
															 results, 
															 callback);
				});
			}, function groupWeeklyByUniqueUser(callback) {
				aggregate.countByUniqueUserAndDate(
					weeklyFrequency, 
					intermediaryAggregationType, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 weeklyFrequency, 
															 results, 
															 callback);
				});
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.findDailyResults = function(callback) {
	mongo.findResults(aggregationType, dailyFrequency, callback);
}

aggregate.findWeeklyResults = function(callback) {
	mongo.findResults(aggregationType, weeklyFrequency, callback);
}

module.exports = aggregate;