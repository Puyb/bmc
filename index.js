'use strict';

const express = require('express');
const Primus = require('primus');
const uuid = require('uuid');
const Game = require('./game');

const app = express();
const server = require('http').createServer(app)
const primus = new Primus(server, { });

const games = {}
const players = {};

app.use('/static/', express.static(__dirname + '/static'));

app.get('/', (req, res) => {
});

app.post('/game/', (req, res) => {
    const name = req.param('name');
    const secret = req.param('secret');
    const answers = require('./answers');
    const questions = require('./questions');
    if (name in games) {
        res.send({ error: 'a game with ths name already exists' });
        return;
    }
    const game = new Game({ name, secret, questions, answers });
    games[name] = game;
    res.send({ redirect: `/game/${name}` });
});

app.get(/game\/\w+\//, (req, res) => {
});

app.post(/game\/\w+\//, (req, res) => {
    const gameName = req.path.split('/')[2];
    const game = games[gameName];
    if (!game || req.secret !== game.secret) {
        res.sendStatus(404);
        return;
    }
    const player = {
        name: req.param('name');
        game,
    };
    const token = uuid.v4();
    players[token] = player;
    res.send({ token });
});

primus.on('connection', spark => {
    const token = spark.headers.token;
    const player = tokens[token];
    if (!player) {
        spark.end();
        return;
    }
    const game = games[player.game];
    if (!game) {
        spark.end();
        return;
    }
    game.addPlayer(player.name, spark);
});

primus.save('/static/primus.js');

server.listen(3000);
