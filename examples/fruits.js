
var fruitModule = function(options) {
    var virgilio = this;
    var fruits = [ 'apple', 'pear', 'banana', 'melon' ];

    virgilio.namespace('fruit')
        .defineAction('findAll', function() {
            this.log.info('Searching for fruits...');
            return fruits.slice(0);
        })
        .defineAction('find', function(fruitId) {
            var fruit = fruits[fruitId];
            if (!fruit) {
                throw new Error('No fruit with index: ' + fruitId);
            }
            return fruit;
        })
        .defineAction('create', function(fruit) {
            if (fruits.indexOf(fruit) === -1) {
                fruits.push(fruit);
            }
        })
        .defineAction('delete', function(fruit) {
            var fruitIndex = fruits.indexOf(fruit);
            if (fruitIndex === -1) {
                throw 'fruit `' + fruit + '` does not exist';
            }
            delete fruits[fruitIndex];
        });

    virgilio
        .http({
            '/fruit': {
                'GET': 'fruit.findAll',
                'POST': 'fruit.create',
                '/:id': {
                    'DEL': 'fruit.delete',
                    'GET': {
                        handler: 'fruit.find',
                        respond: function(response, res) {
                            res.send(200, response.toUpperCase());
                        },
                        error: function(err, res) {
                            res.send(404, 'Fruit not found.');
                        }
                    }
                }
            }
        });

};

var fruitSaladModule = function(options) {
    var virgilio = this;
    var getRandomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    virgilio.defineAction('salad.getRandom', function(request) {
        var virgilio = this;
        return virgilio.execute('fruit.findAll')
            .map(function(fruit) {
                return {
                    fruit: fruit,
                    amount: getRandomInt(0, 10)
                };
            });
    });
};

var Virgilio = require('../');
var app = new Virgilio();
app
    .use('virgilio-http')
    .loadModule(fruitModule)
    .loadModule(fruitSaladModule);

// tests
var assert = require('assert');

app.namespace('fruit').execute('fruit.findAll')
    .then(function(fruits) {
        assert.deepEqual(
            fruits.sort(),
            [ 'apple', 'banana', 'melon', 'pear' ]
        );
    }).done();


app.execute('salad.getRandom')
    .then(function(salad) {
        assert(salad);
    }).done();


var exceptionCaught = null;
app.execute('fruit.delete', 'ananas')
.catch(function() {
    exceptionCaught = true;
})
.finally(function() {
    assert(
        exceptionCaught,
        'an error thrown by a service should result in a rejected promise.');
}).done();


var exceptionCaught = null;
app.execute('fruit.eat', 'apple')
.catch(function() {
    exceptionCaught = true;
})
.finally(function() {
    assert(
        exceptionCaught,
        'calling a non-existing service should return a rejected promise.');
}).done();