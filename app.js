const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const shortid = require('shortid');
const mongoURL = 'mongodb://ojofemi:bsa17honchos@ds115729.mlab.com:15729/votersapp'

// allow cross origin
app.use(cors());

// standard bodyParser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, '/public')));

app.get('/see', (req,res) => {
  MongoClient.connect(mongoURL, (err,db) => {
    if (err) throw err;
    var dbo = db.db('votersapp');
    dbo.collection('votes').find({}, {projection: {_id: 0}}).toArray((err, response) => {
      res.send(response);
    });
  });
});

app.post('/api/poll', (req,res) => {
  console.log(req.body);
  const obj = {};
  req.body['poll-options'].split(',').map( x => obj[x] = 0);
  
  console.log(obj);
  var vote = {
    voteName: req.body['poll-name'],
    voteOptions: obj,
    uniqueId: shortid.generate()
  };
  MongoClient.connect(mongoURL, (err,db) => {
    if (err) throw err;
    var dbo = db.db('votersapp');
    dbo.collection('votes').insertOne(vote, (err, response) => {
      if (err) throw err;
      console.log(response.result.n);
      res.redirect('/api/poll/' + vote.uniqueId);
      db.close();
    });
  });
});


app.get('/api/poll/:id', (req,res) => {
  var id = req.params.id;
  MongoClient.connect(mongoURL, (err,db) => {
    if(err) throw err;
    var dbo = db.db('votersapp');
    dbo.collection('votes').findOne({uniqueId: id},{projection: {_id: 0}}, (err, response) => {
      if (err) throw err;
      console.log(response);
      res.sendFile(__dirname + '/public/poll.html');
      db.close();
    });
  });
});

app.get('/api/:id', (req,res) => {
  var id = req.params.id;
  MongoClient.connect(mongoURL, (err,db) => {
    if(err) throw err;
    var dbo = db.db('votersapp');
    dbo.collection('votes').findOne({uniqueId: id},{projection: {_id: 0}}, (err, response) => {
      if (err) throw err;
      console.log(response);
      res.send(response);
      db.close();
    });
  });
});

app.post('/api/vote', (req,res)=> {
  const findId = req.headers.referer;
  
  const id = findId.slice(findId.lastIndexOf('/') + 1);
  const option = req.body.option;

  MongoClient.connect(mongoURL, (err,db) => {
    if (err) throw err;
    var dbo = db.db('votersapp');
    
    dbo.collection('votes').findOne({uniqueId: id}, {projection: {_id:0}}, (err,response) => {
      // get the response, and find the option that was selected and update it with one
      const allOptions = response.voteOptions;
      
      for (let x in allOptions){
        if (x == option){
          allOptions[x] += 1;
        }
      }
    const updates = {$set: {voteOptions: allOptions}};
     dbo.collection('votes').updateOne({uniqueId: id}, updates, (err, result) => {
       if (err) throw err;
       console.log('One successfully updated');
      dbo.collection('votes').findOne({uniqueId: id}, {projection: {_id:0}}, (err,response) => {
        if (err) throw err;
        console.log('Sending response');
        res.send(response);
      });
      // res.redirect('/api/poll/' + id);
       db.close();
     });
    });
  });
});

const port = 8080;

app.listen(port, () => console.log(`We're listening on ${port}`));