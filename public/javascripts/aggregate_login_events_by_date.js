var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'countLoginsByDate';

var hourlyFrequency = { frequency : 'hourly' };
var dailyFrequency = { frequency : 'daily' };
var weeklyFrequency = { frequency : 'weekly' };

// As a first exemple, we only aggregate weekly
// TODO add the frequence to sample as a parameter
aggregate.groupByDate = function(frequency, callback) {
	console.log(aggregationType + ', frequency : ' + frequency.frequency);

	var timeCalculation, connection, obselModel;

	connection = mongo.createMongoConnection();
	obselModel = mongo.getObselModel(connection);

	if (frequency.frequency === 'weekly') {
		// Epoch time was a thursday, we need to roll back to monday
		timeCalculation = { 
			$add : [
				{
					$subtract : [
						"$begin",
						{ $mod : [
							{ $add : [
								  "$begin",
									345600000		  
								]
							}, 
							604800000 
						]} 
					]
				},
				86400000
			]	
    };
	} else if (frequency.frequency === 'hourly') {
		timeCalculation = {
			$divide : [
				{ 
					$subtract : [
						{ $mod : ["$begin", 86400000 ] },
						{ $mod : ["$begin", 3600000] }		
					]
				},
				3600000
			]
    };
	} else {
		// Defaults to daily
		timeCalculation = {
			$subtract : [
				"$begin", 
				{ $mod : ["$begin", 86400000 ] } 
			]
    };
	}

	obselModel.aggregate(
	  [
	    {
	      $match : {
	        "@type" : "user_login"
	      }
	    }, { 
	      $project :
	      {
	        time : timeCalculation,
	        user : "$subject"  
	      }
	    }, {
	      $group : 
	        {
	          _id : {
			  						time : "$time",
									},
	          number : { $sum : 1 }
	        }
	    }, {
	      $sort : {
	        "_id.time" : 1
	      }
	    }, {
	      $project : {
					_id : "$_id.time",
					value : "$number"
	      }	
	    }    
	  ]
	).exec(function(err, results) {
		if (err) return callback(err);

		mongo.disconnectMongo(connection);
		callback(null, results);
	});
}

aggregate.clearPreviousResults = function(callback) {
	async.series([
			function clearHourlyResults(callback) {
				mongo.removeResults(aggregationType, hourlyFrequency, callback);
			},
			function clearDailyResults(callback) {
				mongo.removeResults(aggregationType, dailyFrequency, callback);
			},
			function clearWeeklyResults(callback) {
				mongo.removeResults(aggregationType, weeklyFrequency, callback);
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.groupByDateThenStore = function(callback) {
	async.series([
			function groupHourlyAndStore(callback) {
				aggregate.groupByDate(hourlyFrequency, function(err, results) {
					if (err) return callback(err);

					mongo.storeResults(aggregationType, hourlyFrequency, results, callback);
				});
			}, function groupDailyAndStore(callback) {
				aggregate.groupByDate(dailyFrequency, function(err, results) {
					if (err) return callback(err);

					mongo.storeResults(aggregationType, dailyFrequency, results, callback);
				});
			}, function groupWeeklyAndStore(callback) {
				aggregate.groupByDate(weeklyFrequency, function(err, results) {
					if (err) return callback(err);

					mongo.storeResults(aggregationType, weeklyFrequency, results, callback);
				});
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.findHourlyResults = function(callback) {
	mongo.findResults(aggregationType, hourlyFrequency, callback);
}

aggregate.findDailyResults = function(callback) {
	mongo.findResults(aggregationType, dailyFrequency, callback);
}

aggregate.findWeeklyResults = function(callback) {
	mongo.findResults(aggregationType, weeklyFrequency, callback);
}

module.exports = aggregate;