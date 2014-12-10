var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'countByCategoryAndDate';

var firstLevel = { depth : 1 };
var secondLevel = { depth : 2 };
var thirdLevel = { depth : 3 };
var fourthLevel = { depth : 4 };

aggregate.countByCategoryAndDate = function(args, callback) {
	console.log(aggregationType + ', depth : ' + args.depth);

	var timeCalculation, connection, obselModel;

	var parentCategory = 'category' + (args.depth - 1); 
	var category = 'category' + args.depth;
	var categoryName = '$course.' + category + '.name';
	var categoryId = '$course.' + category + '.moodleId';

	var filter = {};
	filter['course.' + category] = { $exists : true }; 

	if (args.id !== undefined) {
		filter['course.' + parentCategory + '.moodleId'] = args.id;
	}

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
	      category : categoryName
	    }
	  } , {
	    $group : {
	      _id : { day : "$day", category : "$category" },
	      number : { $sum : 1 }
	    }
	  }, {
	    $sort : { "_id.category" : 1, "_id.day" : 1 }
	  }
	]).exec(function(err, results) {
		if (err) return callback(err);

		mongo.disconnectMongo(connection);
		callback(null, results);
	});
}

aggregate.clearPreviousResults = function(callback) {
	async.series([
			function clearDailyCategoryResults(callback) {
				mongo.removeResults(aggregationType, firstLevel, callback);
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.groupLogsByDateAndCategoryThenStore = function(callback) {
	async.series([
			function groupDailyByCategory(callback) {
				aggregate.countByCategoryAndDate(
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
}

aggregate.findFirstLevelResults = function(callback) {
	mongo.findResults(aggregationType, firstLevel, callback);
}

aggregate.findSecondLevelResults = function(idFirstLevel, callback) {
	var args = secondLevel;
	args.id = idFirstLevel;
	mongo.findResults(aggregationType, args, callback);
}

aggregate.findOrComputeSecondLevelResults = function(idFirstLevel, callback) {
	var args = secondLevel;
	args.id = idFirstLevel;
	mongo.findResults(aggregationType, args, function(err, results) {
		if (err) callback(err);

		if (results.length === 0) {
			aggregate.countByCategoryAndDate(
				args,
				function(err, results) {
					if (err) return callback(err);
					mongo.storeResults(aggregationType, 
						args, 
						results, 
						function(err) {
							if (err) return callback(err);

							aggregate.findOrComputeSecondLevelResults(idFirstLevel, callback);
						});
				}
			)	
		} else {
			callback(null, results);
		}
	});	
}

aggregate.findOrComputeThirdLevelResults = function(idSecondLevel, callback) {
	var args = thirdLevel;
	args.id = idSecondLevel;
	mongo.findResults(aggregationType, args, function(err, results) {
		if (err) callback(err);

		if (results.length === 0) {
			aggregate.countByCategoryAndDate(
				args,
				function(err, results) {
					if (err) return callback(err);
					mongo.storeResults(aggregationType, 
						args, 
						results, 
						function(err) {
							if (err) return callback(err);

							aggregate.findOrComputeThirdLevelResults(idSecondLevel, callback);
						});
				}
			)	
		} else {
			callback(null, results);
		}
	});	
}

aggregate.findOrComputeFourthLevelResults = function(idThirdLevel, callback) {
	var args = fourthLevel;
	args.id = idThirdLevel;
	mongo.findResults(aggregationType, args, function(err, results) {
		if (err) callback(err);

		if (results.length === 0) {
			aggregate.countByCategoryAndDate(
				args,
				function(err, results) {
					if (err) return callback(err);
					mongo.storeResults(aggregationType, 
						args, 
						results, 
						function(err) {
							if (err) return callback(err);

							aggregate.findOrComputeFourthLevelResults(idThirdLevel, callback);
						});
				}
			)	
		} else {
			callback(null, results);
		}
	});	
}

module.exports = aggregate;