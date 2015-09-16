var express = require('express');
var serialPort = require("serialport");
var app = express();
app.use(express.static('public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);
var moment = require('moment');
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'q1w2e3',
    database : 'wthr'
});

connection.connect();

server.listen(8081);
var serialData;
var timeDiff = moment().add('10', 'seconds');
var SerialPort = serialPort.SerialPort; // localize object constructor
var sp = new SerialPort('/dev/ttyACM0', {
    parser: serialPort.parsers.readline("\n")
});

sp.open(function(){
    sp.write('ok');
    console.log('serialport connected');
    sp.on("data", function (data) {
        serialData = data.split(',');
        if(serialData.length!=4)return;
        if(moment(timeDiff).diff(moment())<0){
            timeDiff = moment().add('10', 'seconds');
            var time=moment().format('HH:mm:ss');
            if(time=='00:00:00') return;
            var sql_data = {
                date: moment().format(),
                time:time,
                humidity: serialData[1],
                temperature: serialData[2]
            }

            var sql = 'INSERT INTO wthr_data SET ?'
            var myQuery = connection.format(sql,sql_data);
            connection.query(myQuery,function(err,result){
                if(err) console.log(err);
            })
        }


    });
})
io.on('connection', function (socket) {

    socket.emit('connection', { msg: 'connected' });
    socket.on('ready', function (data) {

    })
    socket.on('data_request', function (data) {
        socket.emit('temp_data', serialData);
    });
});
//
//app.get('/serialports',function(req,res){
//    serialPort.list(function (err, ports) {
//        if(err) return res.json(500,{error:err});
//        res.json(ports);
//    });
//});
//
//app.post('/serialport/connect',function(req,res){
//    if(typeof req.body.serialportName == 'undefined') return res.json(500, { error: 'serialportName is mandatory'})
//});

app.get('/data',function(req,res){
    var sql = "SELECT * FROM wthr_data";
    connection.query(sql,function(err, result){
        if(err) return console.log(err)
        res.json(result);
    })
});

app.get('/check',function(req,res){
    var sql = "SELECT * from wthr_data";
    connection.query(sql,function(err, result){
        if(err) return console.log(err)
        for(i=0;i<result.length;i++){
            var val = result[i];
            var t = moment(val.time)
            var d = moment(val.date)
            if(d.format('HH')=='00'){
                d = d.add(t.format('HH'),'hours')
                d = d.add(t.format('mm'),'minutes')
                d = d.add(t.format('ss'),'seconds')
            }

        }
        res.json('ok')
    })
})

var server = app.listen(2002, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
