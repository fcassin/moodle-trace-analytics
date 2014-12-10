var aggregate = {};

var async = require('async');
var mongo = require('./ktbs_mongo.js');

var aggregationType = 'orderStudentsByCategoy';

aggregate.orderStudentsByCategory = function(args, callback) {
	console.log(aggregationType + ', category : ' + args.category);

	var timeCalculation, connection, obselModel;

	var filter = {};
	filter.student = true;
	filter['course.category1.moodleId'] = args.category;
	filter['begin'] = { $gt : args.fromDate };
	filter['end'] = { $lt : args.toDate };

	connection = mongo.createMongoConnection();
	obselModel = mongo.getObselModel(connection);

	obselModel.aggregate([
	  {
	    $match : filter
	  }, {
	    $group : {
	      _id : { subject : "$subject" },
	      number : { $sum : 1 }
	    }
	  }, {
	    $sort : { "number": -1 }
	  }
	]
	).exec(function(err, results) {
		if (err) return callback(err);

		mongo.disconnectMongo(connection);
		callback(null, results);
	});
}

aggregate.findOrComputeStudentsByCategory = function(category, fromDate, toDate, callback) {
	var args = { };
	var now = new Date();

	if (fromDate === undefined || fromDate === null) {
		fromDate = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - 30);
	}
	if (toDate === undefined || toDate === null) {
		toDate = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	}

	args.category = category;
	args.fromDate = fromDate;
	args.toDate = toDate;
	mongo.findResults(aggregationType, args, function(err, results) {
		if (err) callback(err);

		if (results.length === 0) {
			aggregate.orderStudentsByCategory(
				args,
				function(err, results) {
					if (err) return callback(err);
					mongo.storeResults(aggregationType, 
						args, 
						results, 
						function(err) {
							if (err) return callback(err);

							aggregate.findOrComputeStudentsByCategory(category, fromDate, toDate, callback);
						});
				}
			)	
		} else {
			// Results found
			callback(null, results);
		}
	});	
}

module.exports = aggregate;