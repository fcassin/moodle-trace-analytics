var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'countByUniqueUserAndDate';

var dailyFrequency = { frequency : 'daily' };
var weeklyFrequency = { frequency : 'weekly' };

aggregate.countByUniqueUserAndDate = function(frequency, callback) {
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
	        day : timeCalculation,
	        user : "$subject"  
	      }
	    }, {
	      $group : 
	        {
	          _id : {
			  						day : "$day",
	                  user : "$user"
									},
	          number : { $sum : 1 }
	        }
	    }, {
		$group :
		  {
		    _id : {
					day : "$_id.day"
		    },
		    number : { $sum : 1 }	
		  }
	    }, {
	      $sort : {
	        "_id.day" : 1
	      }
	    }, {
	      $project : {
					_id : "$_id.day",
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
			function clearDailyUniqueUsersResults(callback) {
				mongo.removeResults(aggregationType, dailyFrequency, callback);
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
			function groupDailyByUniqueUser(callback) {
				aggregate.countByUniqueUserAndDate(
					dailyFrequency, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 dailyFrequency, 
															 results, 
															 callback);
				});
			}, function groupWeeklyByUniqueUser(callback) {
				aggregate.countByUniqueUserAndDate(
					weeklyFrequency, 
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