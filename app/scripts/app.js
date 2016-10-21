'use strict';

/**
 * @ngdoc overview
 * @name markovmutatorApp
 * @description
 * # markovmutatorApp
 *
 * Main module of the application.
 */
var myApp = angular
  .module('markovmutatorApp', [
    'ngAnimate',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
myApp.filter('range', function() {
  return function(input, total) {
    total = parseInt(total);

    for (var i=0; i<total; i++) {
      input.push(i);
    }

    return input;
  };
});
