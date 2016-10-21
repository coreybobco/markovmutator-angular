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
    $scope.addGene = function(url) {
      var url = (url) ? JSON.stringify(url) : JSON.stringify(document.querySelector("#url").value);
      $http.post('/addGene', url)
      .then(function successCallback(response) {
        document.querySelector("#mutate_button").disabled = false;
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
    };
    $scope.mutate = function() {
      var checked_genes = []
      for(var i = 0; i < $scope.genes.length; i++) {
        if (document.querySelector("#checkbox_gene_" + i.toString()).checked) {
          checked_genes.push($scope.genes[i]);
        }
      }
      $http.post('mutate', checked_genes)
        .then(function successCallback(response) {
          var booklet = $("#mutant_book").booklet({width: '900px', height: '520px', pageTotal: 15});
          var output = response.data;
          var page_texts = output.match(/.{1,1400}[\s$]/g);
          $("#page1").find('p').text(page_texts[1]);
          for (i=0; i < page_texts.length; i++) {
            $("#page" + i.toString()).find('p').text(page_texts[i]);
          }
        },
          function errorCallback(response) {
        console.log("Error\n" + response)
      });
    };
    $scope.deleteGene = function(gene){
      var index = $scope.genes.indexOf(gene);
      $scope.genes.splice(index, 1);
    }
  });
