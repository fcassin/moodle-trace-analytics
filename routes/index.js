var express = require('express');
var router = express.Router();

// Test effectué avec aggregate_login_events_by_date dans un premier temps
var aggregateLogins = require('../public/javascripts/aggregate_login_events_by_date');
var aggregateUsers = require('../public/javascripts/aggregate_unique_users_by_date');

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
