'use strict';

process.env.NODE_ENV='testing'


const chai = require('chai');
const expect = require('chai').expect;
chai.use(require('chai-http'));
const app = require('../index.js');
const Model = require('../model');


const testData = {
    "symbol": "AAA",
    "e_rate": {
        "jual": 1803.55,
        "beli": 177355
    },
    "tt_counter": {
        "jual": 1803.55,
        "beli": 177355
    },
    "bank_notes": {
        "jual": 1803.55,
        "beli": 177355
    },
    "date": "2018-05-16"
}


describe('API endpoint /api/indexing (no record)', function() {

    this.timeout(50000) 

    before(function(done) {
        Model.Kurs.deleteMany({date: new Date().setHours(0,0,0,0)},(err) => {
           done()
       })
    });

    
    it('GET indexing should proceed', function() {
        return chai.request(app)
        .get('/api/indexing/')
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
        });
    });

});

describe('API endpoint /api/indexing (record exists)', function() {

    this.timeout(50000) 

   it('GET indexing should skipped', function() {
        return chai.request(app)
        .get('/api/indexing/')
        .then(function(res) {
            expect(res).to.have.status(202);
            expect(res).to.be.json;
        });
    });

});


describe('API endpoint /api/kurs (record exists)', function() {

    this.timeout(10000) 

    beforeEach(function(done) {
        var Kurs = new Model.Kurs(testData);

        Kurs.save((err) => {
           done()
       })
    });



    it('POST should failed to create new kurs', function() {
        return chai.request(app)
        .post('/api/kurs/')
        .send(testData)
        .then(function(res) {
            expect(res).to.have.status(202);
            expect(res).to.be.json;
        });
    });


    it('PUT should update if exists', function() {
        return chai.request(app)
        .put('/api/kurs/')
        .send(testData)
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        });
    });

    it('DELETE should delete kurs by date', function() {

        return chai.request(app)
        .delete('/api/kurs/'+testData.date)
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        });
    });

    it('DELETE with Wrong date format should failed to delete record', function() {
        return chai.request(app)
        .get('/api/kurs/30-04-2019')
        .then(function(res) {
            expect(res).to.have.status(422);
            expect(res).to.be.json;
        });
    });
});


describe('API endpoint /api/kurs (record not exists)', function() {

    this.timeout(10000)


    beforeEach(function(done) {
        Model.Kurs.deleteOne({symbol: testData.symbol,date: new Date(testData.date).setHours(0,0,0,0)},(err) => {
           done()
       })
    });

    
    it('POST should success to create new kurs', function() {
        return chai.request(app)
        .post('/api/kurs/')
        .send(testData)
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
        });
    });

     it('POST Wrong format should failed to create new kurs', function() {
        return chai.request(app)
        .post('/api/kurs/')
        .send({symbol: "AAA"})
        .then(function(res) {
            expect(res).to.have.status(202);
            expect(res).to.be.json;
        });
    });

   it('PUT should 404 not exists', function() {
        return chai.request(app)
        .put('/api/kurs/')
        .send(testData)
        .then(function(res) {
            expect(res).to.have.status(404);
            expect(res).to.be.json;
        });
    });


});

describe('API endpoint /api/kurs?startdate=:startdate&enddate=:enddate', function() {


    this.timeout(10000) 

    
    it('GET should success view record', function() {
        return chai.request(app)
        .get('/api/kurs/?startdate=2019-04-30&enddate=2019-05-01')
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        });
    });

    it('GET with Wrong date format should failed view record', function() {
        return chai.request(app)
        .get('/api/kurs/?startdate=30-04-2019&enddate=2019-05-01')
        .then(function(res) {
            expect(res).to.have.status(422);
            expect(res).to.be.json;
        });
    });
});

describe('API endpoint /api/kurs/:symbol?startdate=:startdate&enddate=:enddate', function() {


    this.timeout(10000) 

    
    it('GET should success to view record by currency', function() {
        return chai.request(app)
        .get('/api/kurs/USD?startdate=2019-04-30&enddate=2019-05-01')
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
        });
    });


});

