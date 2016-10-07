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
    $scope.genes = [];
    $scope.addGene = function() {
      var url = JSON.stringify(document.querySelector("#url").value);
      $http.post('/addGene', url)
      .then(function successCallback(response) {
        var gene = response.data;
        var duplicate_found = false;
        for(var i = 0; i < $scope.genes.length; i++) {
          if (gene.source == $scope.genes[i].source && gene.document_id == $scope.genes[i].document_id) {
            duplicate_found = true;
            break;
          }
        }
        if (!duplicate_found) {
          $scope.genes.push(gene);
        }
      }, function errorCallback(response) {
        console.log("Error\n" + response)
      });
  }
  });
