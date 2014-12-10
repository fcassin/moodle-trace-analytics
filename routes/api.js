var express = require('express');
var router = express.Router();

/* GET Help JSON doc. */
router.get('/', function(req, res) {
  res.send('{title : \'API Documentation\'}');
});

// Test effectué avec aggregate_login_events_by_date dans un premier temps
var aggregateLogins = require('../public/javascripts/aggregate_login_events_by_date');
var aggregateUsers = require('../public/javascripts/aggregate_unique_users_by_date');
var aggregateCategories = require('../public/javascripts/aggregate_logs_by_category_and_date');

router.get('/login/hourly', function(req, res) {
	aggregateLogins.findHourlyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

router.get('/login/daily', function(req, res) {
	aggregateLogins.findDailyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

router.get('/login/weekly', function(req, res) {
	aggregateLogins.findWeeklyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

router.get('/users/daily', function(req, res) {
	aggregateUsers.findDailyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

router.get('/users/weekly', function(req, res) {
	aggregateUsers.findWeeklyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

router.get('/categories/stackedDaily', function(req, res) {
	aggregateCategories.findDailyResults(function(err, results) {
		if (err) res.send('500 Server error');

		res.send(results[0].results);
	})
});

module.exports = router;
