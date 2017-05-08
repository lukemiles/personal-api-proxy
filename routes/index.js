var express = require('express');
var request = require('request');
var _ = require('lodash');
var URI = require('urijs');
var moment = require('moment');
var sanitizeHtml = require('sanitize-html');

var router = express.Router();
var config = require('../config');

router.get('/', (req, res) => {
  res.json({ error: false })
});
router.get('/music', (req, res) => {
  request({
    url: 'https://ws.audioscrobbler.com/2.0',
    qs: {
      api_key: config('lastfm'),
      method: 'user.getrecenttracks',
      user: 'notlukemiles',
      format: 'json'
    }
  }, (err, data) => {
    if (err) {
      res.status(500);
      res.json({ error: true });
    } else {
      res.type('json');
      res.send(data.body);
    }
  });
});

router.get('/reading/:limit?', (req, res) => {
  let limit = 5;
  if (_.isString(req.params.limit)) {
    try {
      let limitParsed = Number(req.params.limit);
      if (_.isNumber(limitParsed) && limitParsed <= 50) {
        limit = limitParsed;
      }
    } catch (e) {
      limit = 5;
    }
  };
  request({
    url: `https://api.pinboard.in/v1/posts/recent`,
    qs: {
      auth_token: config('pinboard'),
      tag: 'publish',
      count: limit,
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
          var hostname = new URI(post.href).hostname().replace('www.', '');
          var sanitizeOptions = { allowedTags: [], allowedAttributes: [],};
          let description = sanitizeHtml(post.extended, sanitizeOptions);
          description = `<p><blockquote>${description}</blockquote></p>`
          .replace(/\/c\//g, '</p><blockquote>')
          .replace(/\/ec\//g, '</blockquote><p>')
          .replace(/<blockquote><\/blockquote>/g, '')
          .replace(/<p><\/p>/g, '');
          var formatted = {
            href: post.href,
            hostname,
            title: sanitizeHtml(post.description, sanitizeOptions),
            description,
            time: post.time,
            formattedTime: moment(post.time).format('dddd, MMMM Do, YYYY')
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
