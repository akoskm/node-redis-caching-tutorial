const redis = require('redis');
const express = require('express');
const request = require('superagent');
const PORT = process.env.PORT;
const REDIS_PORT = process.env.REDIS_PORT;

const app = express();
const client = redis.createClient(REDIS_PORT);

function respond(org, numberOfRepos) {
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}

function cache(req, res, next) {
    const org = req.query.org;
    client.get(org, function (err, data) {
        if (data != null) {
            res.send(respond(org, data));
        } else {
            next();
        }
    });
}

function getNumberOfRepos(req, res, next) {
    const org = req.query.org;
    request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) {
            throw err;
        }

        var repoNumber = 0;
        if (response && response.body) {
            repoNumber = response.body.length;
        }
        client.setex(org, 5, repoNumber);
        res.send(respond(org, repoNumber));
    });
}

app.get('/repos', cache, getNumberOfRepos);

app.listen(PORT, function () {
    console.log('app listening on port', PORT);
});
