angular.module("rvLayout", [])
.directive("rvLayout", ["$window", "$timeout", function($window, $timeout) {
	return {
		restrict: "EA",
		replace: true,
		transclude: true,
		template: "<div ng-transclude></div>",
		scope: {},
		controller: function ($scope, $element) {
		},
		link: {
			pre: function(scope, element, attrs, ctrl) {
				element.css("position", "absolute");
				element.css("top", "0");
				element.css("right", "0");
				element.css("bottom", "0");
				element.css("left", "0");
				
				scope.childDimensions = [];
				scope.orientation = "";
				
				scope.parseOrientationAttr = function() {
					var orientation = attrs["orientation"];
					
					if (orientation === "columns" || orientation === "rows") {
						scope.orientation = orientation;
					}
					else {
						throw "rvLayout orientation attribute should be either 'columns' or 'rows'.";
					}
				};
				
				scope.getDeclaredDimension = function(element) {
					var retVal;
					var sizeAttr = element.attr("size");
					
					if (sizeAttr === undefined || sizeAttr === "*") {
						retVal = "*";
					}
					else {
						retVal = parseInt(sizeAttr, 10);
					}
					
					return retVal;
				};
				
				scope.parseDeclaredDimensions = function() {
					angular.forEach(element.children(), function(child, i) {
						child = angular.element(child);
						scope.childDimensions[i] = {
							declaredSize: scope.getDeclaredDimension(child),
							calculatedSize: 0
						};
					});
				};
				
				scope.getNrOfStars = function() {
					var nrOfStars = 0;
					angular.forEach(scope.childDimensions, function(dimension) {
						if (dimension.declaredSize == "*") {
							++nrOfStars;
						}
					});
					return nrOfStars;
				};
				
				scope.getStarSpace = function() {
					var starSpace = scope.orientation == "rows" ? element[0].offsetHeight : element[0].offsetWidth;
					
					//console.log("starspace", starSpace, element);
					
					angular.forEach(scope.childDimensions, function(dimension) {
						if (dimension.declaredSize != "*") {
							starSpace -= dimension.declaredSize;
						}
					});
					return starSpace;
				};
				
				scope.calculateSizes = function() {
					var starSpace = scope.getStarSpace();
					var nrOfStars = scope.getNrOfStars();
					angular.forEach(scope.childDimensions, function(dimension) {
						if (dimension.declaredSize == "*") {
							dimension.calculatedSize = Math.floor(starSpace / nrOfStars);
						} else {
							dimension.calculatedSize = dimension.declaredSize;
						}
					});
				};
				
				scope.applyElementSize = function(element, index, currentOffset) {
					if (scope.orientation == "columns") {
						element.css("top", "0");
						element.css("bottom", "0");
						element.css("left", currentOffset + "px");
					}
					else {
						element.css("left", "0");
						element.css("right", "0");
						element.css("top", currentOffset + "px");
					}
					
					if (scope.childDimensions.length == index + 1) {
						var attr = scope.orientation == "columns" ? "right" : "bottom";
						element.css(attr, "0");
					}
					else {
						var elementSize = scope.childDimensions[index].calculatedSize;
						var attr = scope.orientation == "columns" ? "width" : "height";
						element.css(attr, elementSize + "px");
					}
				};
				
				scope.applyDimensions = function() {
					var currentOffset = 0;
					
					angular.forEach(element.children(), function(child, i) {
						var child = angular.element(child);
						child.css("position", "absolute");
						scope.applyElementSize(child, i, currentOffset);
						currentOffset += scope.childDimensions[i].calculatedSize;
					}, this);
				};
				
				scope.setUp = function() {
					scope.parseOrientationAttr();
					scope.parseDeclaredDimensions();
					scope.calculateSizes();
					scope.applyDimensions();
				};
				
				var unRegister = scope.$watch(
					function() {
						return scope.orientation == "rows" ? element[0].offsetHeight : element[0].offsetWidth;
					},
					function(newValue, oldValue) {
						scope.setUp();
						unRegister();
					},
					true
				);
				
				var timer = null;
				
				angular.element($window).bind("resize", function() {
					if (timer != null) {
						$timeout.cancel(timer);
					}
						
					timer = $timeout(function() {
						scope.setUp();
					}, 100);
				});
			}
		}
	};
}])
.directive("rvScrollViewer", [function() {
	return {
		restrict: "EA",
		replace: true,
		transclude: true,
		template: function(element, attrs) {
			if (attrs["padding"] !== undefined) {
				var padding = parseInt(attrs["padding"], 10);
				return '<div><div ng-transclude style="padding: ' + padding + 'px;"></div></div>';
			}
			else {
				return '<div ng-transclude></div>';
			}
		},
		link: function(scope, element, attrs) {
			element.css("position", "absolute");
			element.css("top", "0");
			element.css("right", "0");
			element.css("bottom", "0");
			element.css("left", "0");
			
			if (!(attrs["vertical"] === "false")) {
				element.css("overflow-y", "scroll");
			}
			
			if (!(attrs["horizontal"] === "false")) {
				element.css("overflow-x", "scroll");
			}
		}
	};
}])
.directive("rvPanel", [function() {
	return {
		restrict: "EA",
		replace: true,
		transclude: true,
		template: function(element, attrs) {
			if (attrs["padding"] !== undefined) {
				var padding = parseInt(attrs["padding"], 10);
				return '<div><div ng-transclude style="padding: ' + padding + 'px;"></div></div>';
			}
			else {
				return '<div ng-transclude></div>';
			}
		},
		link: function(scope, element, attrs) {
			element.css("position", "absolute");
			element.css("top", "0");
			element.css("right", "0");
			element.css("bottom", "0");
			element.css("left", "0");
		}
	};
}]);