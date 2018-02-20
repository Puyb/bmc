'use strict';
const _ = require('lodash');

const ANSWERING_STATE = 'answering';
const CHOOSING_STATE = 'choosing';
const RESULT_STATE = 'result';

class Game {
    constructor({ name, questions, answers, secret }) {
        this.name = name;
        this.secret = secret;
        this.players = {}
        this.questions = _.shuffle(questions);
        this.answers = _.shuffle(answers);
        this.cardCount = 11;
        this.rounds = [];
        this.state = ANSWERING_STATE;
    }

    addPlayer({ name, spark }) {
        const player = {
            name,
            spark,
            cards: this.answers.splice(0, this.cardCount);
            wins: 0,
            dealer: !this.players.length,
            answsers: [],
            send: data => spark.write(data);
        };
        this.players.push(player);
        player.send({
            cards: player.cards
            state: this.state,
        });
        spark.on('end' () => {
            _.pull(this.players, player);
            this.updatePlayers();
        });
        spark.on('data', this.onData.bind(this, player));
    }

    sendAll(message) {
        this.players.forEach(player => {
            player.send(message);
        });
    }

    updatePlayers() {
        const players = this.players.map(({ name, wins, dealer, answers }) => {
            const answered = answers.length > 0;
            return { name, wins, dealer, answered };
        });
        this.sendAll({ players });
    }

    updateQuestion() {
        this.round++;
        const question = this.questions.shift();
        this.players.forEach(player => {
            player.answers.forEach(anwser => {
                _.pull(player.cards, answer);
                player.cards.push(this.anwsers.shift());
            });
            player.answers = [];
            player.send({
                cards: player.cards,
                question,
                round,
                state: this.state,
            });
        });
    }

    onData(player, data) {
        if (this.state === ANSWERING_SATE) {
            if (data.anwsers) {
                player.answers = answers;
                this.updatePlayers();
                if (this.players.every(p => p.dealer || p.answers.length)) {
                    this.state = CHOOSING_STATE;
                    this.sendAll({
                        choose: _.fromPairs(this.players, player => [ player.name, player.answers ]),
                    });
                }
                return;
            }
        }
        if (this.state === CHOOSING_SATE) {
            if (data.choosed && player.dealer) {
                this.state = RESULT_STATE;
                winner = _.find(this.players, p => p.name === data.choosed);
                winner.wins++;
                winner.dealer = true;
                player.dealer = false;

                this.sendAll({
                    winner: {
                        name: data.choosed,
                        answers: winner.answers,
                        wins: winner.wins
                    },
                    state: this.state,
                });
                this.updatePlayers();
            }
            return;
        }
        if (this.state === CHOOSING_SATE) {
            if (data.drawQuestion && player.dealer) {
                this.state = ANSWER_STATE;
                this.updateQuestion();
            }
            return
        }
    }
}   
