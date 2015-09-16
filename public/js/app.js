

var app=angular.module('myapp',['n3-line-chart']);

app.controller('ExampleCtrl', function($scope,$http) {
    // Due to CodePen's API, it's not possible to include functions in dynamic CodePen's such as this one, therefore some closures might be missing (the axes' formatting functions, for example) and need to be added manually. Thanks ! :-)

});


app.controller('mainCtrl',function($scope, socket, $interval,$timeout, $http){
    $scope.connected=false;
    socket.on('connection',function(){
        $scope.connected=true;
    })
    socket.on('temp_data',function(data){

        if(typeof data == 'undefined' || data==null ) return;
        if(isNaN(data[1]) && isNaN(data[2]) || data.length!=4) return;
        $scope.humidity = data[1];
        $scope.temperature = data[2];
    });


    $scope.requestData = function(){
        socket.emit('data_request',{test:'das'},function(result){
            if (!result) {
                alert('There was an error changing your name');
            }
        });
    }


    $interval($scope.requestData,5000);
    $interval(function(){
        var d = new Date();
        $scope.date = d.getTime();
    },1000)

    $scope.$watch('connected',function(newval,oldval){
        if(newval){
            $timeout($scope.requestData,200)

        }
    })

    $scope.interval = 2

    $scope.initGraph = function(){
        $scope.data = [];
        $http.get('http://127.0.0.1:2002/data').then(function(result){
            var dummyDate=0;
            angular.forEach(result.data,function(val){
                if(dummyDate==0){
                    dummyDate = moment(val.date).add($scope.interval,'minutes');
                }
                if(dummyDate.diff(val.date)<0 ){
                    dummyDate = moment(val.date).add($scope.interval,'minutes');
                    $scope.data.push({
                        x: moment(val.date),
                        hum: val.humidity,
                        temp: val.temperature,
                    })
                }
            })
        })
    }


    $scope.$watch('interval',function(newval,oldval){
        $scope.initGraph()
    });

    $scope.options = {
        axes: {x: {type: "date"}},
        series: [
            {
                y: "hum",
                label: "humidity",
                color: "#1E90FF",
                type: "area"
            },
            {
                y: "temp",
                label: "temperature",
                color: "#FFD926",
                type:'area'
            }
        ],
        tooltip: {
            mode: "scrubber",
            formatter: function (x, y, series) {
                return moment(x).fromNow() + ' : ' + y;
            }
        }
    };


});

app.factory('socket', function ($rootScope) {
    var socket = io.connect('http://localhost:8081');
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});