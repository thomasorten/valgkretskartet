'use strict';

/**
 * @ngdoc function
 * @name valgkretskartetApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the valgkretskartetApp
 */
angular.module('valgkretskartetApp')
  .controller('MainCtrl', function ($scope, $filter) {

  	  // create layer selector
     function createSelector(layer) {
        var sql = new cartodb.SQL({ user: 'valgkretser' });
        var $options = $('#layer_selector li');
        $options.click(function(e) {
          // get the area of the selected layer
          var $li = $(e.target);
          var area = $li.attr('data');
          // deselect all and select the clicked one
          $options.removeClass('selected');
          $li.addClass('selected');
          // create query based on data from the layer
          var query = "select * from european_countries_e";
          if(area !== 'all') {
            query = "select * from european_countries_e where area > " + area;
          }
          // change the query in the layer to update the map
          layer.setSQL(query);
        });
        sql.execute("SELECT * FROM table_algkretskartet")
        .done(function(data) {
        	$scope.$apply(function () {
        		$scope.constituency = [];
        		$scope.data = data.rows;
        		var parties = _.uniq(_.pluck(data.rows, 'parti'));
        		var places = _.uniq(_.pluck(data.rows, 'valgkrets'));
        		_.each(places, function(element, index, list) {
        			var parties = _.where(data.rows, {valgkrets: element});
        			$scope.constituency.push({
        				'place': element,
        				'parties': [
        					parties
        				]
        			});
        		});
        		$scope.parties = parties;
        		$scope.totals = {};
        		$scope.totalVotes = 0;
        		_.each(parties, function(element, index, list) {
        			var party = _.where(data.rows, {parti: element});
        			var total = 0;
        			 _.each(party, function(element, index, list) {
        				total += element.stemmer;
        				$scope.totalVotes += element.stemmer;
        			});
        			$scope.totals[element] = total;
        		});
        	});
        })
        .error(function(errors) {
          // errors contains a list of errors
          console.log("errors:" + errors);
        });
      }

      $scope.findVotes = function(party) {
      	var value = 0;
      	if (!$scope.valgkrets) {
      		value = $filter('number')(($scope.totals[party]/$scope.totalVotes*100), 1);
      	} else {

      	}
      	return value + '%';
      }

      function main() {
        cartodb.createVis('map', 'http://valgkretser.cartodb.com/api/v2/viz/0d91f766-c98a-11e4-9870-0e9d821ea90d/viz.json', {
          tiles_loader: true,
          search: false,
          shareable: false
          //center_lat: 50,
          //center_lon: 20,
          //zoom: 3
        })
        .done(function(vis, layers) {
          // layer 0 is the base layer, layer 1 is cartodb layer
          var subLayer = layers[1].getSubLayer(0);
          createSelector(subLayer);
           layers[1].setInteraction(true);
		    layers[1].on('featureClick', function(e, latlng, pos, data, layerNumber) {
		       var place = _.findWhere($scope.data, {cartodb_id : data.cartodb_id});
		       console.log(place.valgkrets);
		   });
        })
        .error(function(err) {
          console.log(err);
        });
      }

      main();

  });
