var express = require('express');
var request = require('request');
var _ = require('lodash');
var URI = require('urijs');

var router = express.Router();
var config = require('../config');

router.get('/', (req, res) => {
  res.json({ error: false })
});

router.get('/reading', (req, res) => {
  request({
    url: `https://api.pinboard.in/v1/posts/recent`,
    qs: {
      auth_token: config('pinboard'),
      tag: 'publish',
      count: '5',
      format: 'json',
    }
  }, (err, data) => {
    if (err) {

      res.status(500);
      res.json({ error: true });
    } else {
      try {
        var pinboard = JSON.parse(data.body);
        var posts = [];
        _.each(pinboard.posts, (post) => {
          var hostname = new URI(post.href).domain();
          var formatted = {
            href: post.href,
            hostname,
            title: post.description,
            description: post.extended,
            time: post.time,
          };
          posts.push(formatted);
        })
        res.json({ error: false, posts });
      } catch (e) {
        res.status(500);
        res.json({ error: true });
      }
    }
  });
});

module.exports = router;
