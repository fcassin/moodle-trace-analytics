var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'countByUserModuleAndDate';

// good test subject
// 119fc8dcc7d2c7bdfff06d1446b714941429d6d9

aggregate.countByUserModuleAndDate = function(args, callback) {
	console.log(aggregationType + ', user : ' + args.subject);

	var timeCalculation, connection, obselModel;

	var filter = {};
	filter.student = true;
	filter.subject = args.subject;
	filter['course.category1.moodleId'] = args.category;

	var now = new Date();
	var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	var thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

	connection = mongo.createMongoConnection();
	obselModel = mongo.getObselModel(connection);

	obselModel.aggregate([
	  {
	    $match : filter
	  }, {
	    $project : {
	      day : { $subtract : ["$begin", { $mod : ["$begin", 86400000] } ] },
	      action : "$@type"
	    }
	  } , {
	    $group : {
	      _id : { day : "$day", action : "$action" },
	      number : { $sum : 1 }
	    }
	  }, {
	    $sort : { "_id.day" : 1, "_id.action" : 1 }
	  }
	]).exec(function(err, results) {
		if (err) return callback(err);

		mongo.disconnectMongo(connection);
		callback(null, results);
	});
}

/*aggregate.groupLogsByDateAndCategoryThenStore = function(callback) {
	async.series([
			function groupDailyByCategory(callback) {
				aggregate.countByUserModuleAndDate(
					firstLevel, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 firstLevel, 
															 results, 
															 callback);
				});
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}*/

/*aggregate.findSecondLevelResults = function(subject, callback) {
	var args = {};
	args.subject = subject;
	mongo.findResults(aggregationType, args, callback);
}*/

aggregate.findOrComputeUserLogs = function(subject, category, callback) {
	var args = {};
	args.subject = subject;
	args.category = category;
	mongo.findResults(aggregationType, args, function(err, results) {
		if (err) callback(err);

		if (results.length === 0) {
			aggregate.countByUserModuleAndDate(
				args,
				function(err, results) {
					if (err) return callback(err);
					mongo.storeResults(aggregationType, 
						args, 
						results, 
						function(err) {
							if (err) return callback(err);

							aggregate.findOrComputeUserLogs(subject, category, callback);
						});
				}
			)	
		} else {
			callback(null, results);
		}
	});	
}

module.exports = aggregate;