var async = require('async');
var express = require('express');
var router = express.Router();

var prefix = '../public/javascripts/';

// Test effectué avec aggregate_login_events_by_date dans un premier temps
var aggregateLogins = require(prefix + 'aggregate_login_events_by_date');
var aggregateUsers = require(prefix + 'aggregate_unique_users_by_date');
var aggregateCategories = require(prefix + 'aggregate_logs_by_category_and_date');
var aggregateUserLogsByModuleAndDate = require(prefix + 'aggregate_logs_by_user_module_and_date');
var orderCategoriesByLogs = require(prefix + 'order_categories_by_logs');
var orderStudentsByCategory = require(prefix + 'order_students_by_category');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Liste des indicateurs Moodle' });
});

router.get('/login/hourly', function(req, res) {
  aggregateLogins.findHourlyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('login/timeline', {
  		title : 'Connexions réparties par heure',
  		logs : results[0].results
  	});
	})
});

router.get('/login/daily', function(req, res) {
  aggregateLogins.findDailyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('login/timeline', {
  		title : 'Connexions journalières',
  		logs : results[0].results
  	});
	})
});

router.get('/login/weekly', function(req, res) {
  aggregateLogins.findWeeklyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('login/timeline', {
  		title : 'Connexions hebdomadaires',
  		logs : results[0].results
  	});
	})
});

router.get('/users/daily', function(req, res) {
  aggregateUsers.findDailyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('login/timeline', {
  		title : 'Visiteurs journaliers',
  		logs : results[0].results
  	});
	})
});

router.get('/users/weekly', function(req, res) {
  aggregateUsers.findWeeklyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('login/timeline', {
  		title : 'Visiteurs hebdomadaires',
  		logs : results[0].results
  	});
	})
});

router.get('/categories/stackedDaily', function(req, res) {
	var data;
	var selectValues;
	async.parallel([
		function(callback) {
			aggregateCategories.findFirstLevelResults(function(err, results) {
				if (err) return callback(err);
				data = results[0].results;
				callback();
			})			
		}, function(callback) {
			orderCategoriesByLogs.findFirstLevelResults(function(err, results) {
				if (err) return callback(err);
				selectValues = results[0].results;
				callback();
			})
		}
	], function(err) {
		if (err) res.send('500 Server error');

		res.render('categories/stacked', {
  		title : 'Catégories importantes',
  		data : data,
  		selectValues : selectValues
  	});
	});
});

router.get('/categories/stackedDaily/:category1', function(req, res) {
	var data;
	var selectValues;
	var category1 = Number(req.param("category1"));

	async.parallel([
		function(callback) {
			aggregateCategories.findOrComputeSecondLevelResults(category1 ,
				function(err, results) {
					if (err) return callback(err);
					data = results[0].results;
					callback();
				}
			)			
		}, function(callback) {
			orderCategoriesByLogs.findOrComputeSecondLevelResults(category1, 
				function(err, results) {
					if (err) return callback(err);
					console.log(JSON.stringify(results));
					selectValues = results[0].results;
					callback();
				}
			)
		}
	], function(err) {
		if (err) res.send('500 Server error');

		res.render('categories/stacked', {
  		title : 'Catégories importantes',
  		data : data,
  		selectValues : selectValues
  	});
	});
});

router.get('/categories/stackedDaily/:category1/:category2', function(req, res) {
	var data;
	var selectValues;
	var category2 = Number(req.param("category2"));
	
	async.parallel([
		function(callback) {
			aggregateCategories.findOrComputeThirdLevelResults(category2 ,
				function(err, results) {
					if (err) return callback(err);
					data = results[0].results;
					callback();
				}
			)			
		}, function(callback) {
			orderCategoriesByLogs.findOrComputeThirdLevelResults(category2, 
				function(err, results) {
					if (err) return callback(err);
					console.log(JSON.stringify(results));
					selectValues = results[0].results;
					callback();
				}
			)
		}
	], function(err) {
		if (err) res.send('500 Server error');

		res.render('categories/stacked', {
  		title : 'Catégories importantes',
  		data : data,
  		selectValues : selectValues
  	});
	});
});

router.get('/categories/stackedDaily/:category1/:category2/:category3', function(req, res) {
	var data;
	var selectValues;
	var category3 = Number(req.param("category3"));
	
	async.parallel([
		function(callback) {
			aggregateCategories.findOrComputeFourthLevelResults(category3 ,
				function(err, results) {
					if (err) return callback(err);
					data = results[0].results;
					callback();
				}
			)			
		}, function(callback) {
			orderCategoriesByLogs.findOrComputeFourthLevelResults(category3, 
				function(err, results) {
					if (err) return callback(err);
					console.log(JSON.stringify(results));
					selectValues = results[0].results;
					callback();
				}
			)
		}
	], function(err) {
		if (err) res.send('500 Server error');

		res.render('categories/stacked', {
  		title : 'Catégories importantes',
  		data : data,
  		selectValues : selectValues
  	});
	});
});

router.get('/students/category', function(req, res) {
	orderCategoriesByLogs.findFirstLevelResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.render('students/category_selection', {
  		title : 'Sélection d\'une catégorie',
  		selectValues : results[0].results
  	});
  });
});

router.get('/students/category/:categoryId', function(req, res) {
	var categoryId = Number(req.param("categoryId"));
	orderStudentsByCategory.findOrComputeStudentsByCategory(categoryId, function(err, results) {
		if (err) res.send('500 Server error');

		res.render('students/student_list', {
  		title : 'Liste des étudiants',
  		category : categoryId,
  		students : results[0].results
  	});
  });
});

router.get('/students/category/:categoryId/:student', function(req, res) {
	var student = req.param("student");
	var categoryId = Number(req.param("categoryId"));

	aggregateUserLogsByModuleAndDate.findOrComputeUserLogs(
		student,
		categoryId,
		function(err, results) {
			if (err) res.send('500 Server error');

			res.render('students/stacked_activity', {
  			title : 'Activité',
  			data : results[0].results,
  		});
  	}
  );
});

router.get('/static/partition', function(req, res) {
	res.render('static/partition', {
		title : 'Hiérarchie des cours'
	})
});

/* GET traces list page */
router.get('/tracelist', function(req, res) {
	/*var db = req.db;
	var collection = db.get('trace');
	collection.find({}, { limit: 5 }, function(err, docs) {
		res.render('tracelist', {
			'tracelist' : docs
		});
	});*/

	// Mongoose version
	var connection = req.db;
	var obselModel = req.obselModel;
	obselModel.find({})
						.limit(10)
						.sort({'attr.moodleId' : -1})	
						.exec(function(err, docs) {
		res.render('tracelist', {
			'tracelist' : docs
		});
	}); 
});

module.exports = router;
