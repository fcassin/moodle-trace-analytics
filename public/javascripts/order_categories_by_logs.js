var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'orderCategoriesByLogs';

var firstLevel = { depth : 1 };
var secondLevel = { depth : 2 };
var thirdLevel = { depth : 3 };
var fourthLevel = { depth : 4 };

aggregate.orderCategoriesByLogs = function(args, callback) {
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

	connection = mongo.createMongoConnection();
	obselModel = mongo.getObselModel(connection);

	obselModel.aggregate(
	  [
	    {
	      $match : filter
	    }, { 
	      $project :
	      {
	      	id : categoryId,
	        name : categoryName
	      }
	    }, {
	      $group : 
	        {
	          _id : {
	          	id : "$id",
	          	name : "$name"
	          },
	          number : { $sum : 1 }
	        }
	    }, {
	      $sort : {
	        number : -1
	      }
	    }, {
	      $project : {
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
			function clearFirstLevelResults(callback) {
				mongo.removeResults(aggregationType, firstLevel, callback);
			}
		], function(err) {
			if (err) callback(err);

			callback();
		});
}

aggregate.orderCategoriesByLogsThenStore = function(callback) {
	async.series([
			function groupFirstLevel(callback) {
				aggregate.orderCategoriesByLogs(
					firstLevel, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 firstLevel, 
															 results, 
															 callback);
				});
			}, 
			/*
			function groupSanteLevel(callback) {
				var args = secondLevel;
				secondLevel.id = 377;

				aggregate.orderCategoriesByLogs(
					args, 
					function(err, results) {
						if (err) return callback(err);
						mongo.storeResults(aggregationType, 
															 args, 
															 results, 
															 callback);
				});
			}*/ 
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
			aggregate.orderCategoriesByLogs(
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
			console.log('results found');
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
			aggregate.orderCategoriesByLogs(
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
			console.log('results found');
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
			aggregate.orderCategoriesByLogs(
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
			console.log('results found');
			callback(null, results);
		}
	});	
}

module.exports = aggregate;