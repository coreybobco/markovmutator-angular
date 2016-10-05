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
    $scope.mutagens = [];
    $scope.addBook = function() {
      var url = JSON.stringify(document.querySelector("#url").value);
      $http.post('/addBook', url)
      .then(function successCallback(response) {
        var mutagen = response.data;
        var duplicate_found = false;
        for(var i = 0; i < $scope.mutagens.length; i++) {
          if (mutagen.source == $scope.mutagens[i].source && mutagen.document_id == $scope.mutagens[i].document_id) {
            duplicate_found = true;
            break;
          }
        }
        if (!duplicate_found) {
          $scope.mutagens.push(mutagen);
        }
      }, function errorCallback(response) {
        console.log("Error\n" + response)
      });
  }
  });
