// Angular magic
var trellobot = angular.module('trellobot',[]);

trellobot.controller('botdata', function ($scope, $http, $interval){
  console.log('fired');
  $scope.getData = function(){
    $http.get("data?_=" + Date.now()).success(function(response){
      $scope.restaurantdata = response;
      console.log('fetched');
    });
  }
  $scope.getData();
  $interval($scope.getData, 240000); //240 secs
  $http.get("data").success(function(response){
    $scope.restaurantdata = response;
    console.log($scope.restaurantdata);
  });
});