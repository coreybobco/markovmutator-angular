'use strict';

/**
 * @ngdoc function
 * @name markovmutatorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the markovmutatorApp
 */
angular.module('markovmutatorApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.books = [];
    $scope.addBook = function() {
      var url = JSON.stringify(document.querySelector("#url").value);
      $http.post('/addBook', url)
      .then(function successCallback(response) {
        $scope.books.push(response.data)
        console.log("Success");
        console.log(response);
        // this callback will be called asynchronously
        // when the response is available
      }, function errorCallback(response) {
        console.log("Error\n" + response)
      });
  }
  });
