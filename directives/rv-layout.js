angular.module("rvLayout", [])

.directive("rvLayout", ["$window", "$timeout", function($window, $timeout) {
	return {
		restrict: "EA",
		replace: true,
		transclude: true,
		template: "<div ng-transclude></div>",
		scope: {},
		controller: function ($scope, $element) {
			this.getOrientation = function() {
				return $scope.orientation;
			};
			
			this.handleSplitterMove = function(splitterElement, mouseDelta, mousePos) {
				
				// Find the splitter element index
				var splitterIndex = 0;
				angular.forEach($element.children(), function(child, i) {
					if (splitterElement[0] === child) {
						splitterIndex = i;
					}
				});
				
				var aaa = 0;
				for (var i = 0; i <= splitterIndex - 1; ++i) {
					aaa += $scope.childDimensions[i].calculatedSize;
				}
				var delta = mousePos - aaa;
				
				var oldSizeA = $scope.childDimensions[splitterIndex - 1].calculatedSize;
				var newSizeA = $scope.childDimensions[splitterIndex - 1].calculatedSize + delta;
				var oldSizeB = $scope.childDimensions[splitterIndex + 1].calculatedSize;
				var newSizeB = $scope.childDimensions[splitterIndex + 1].calculatedSize - delta;
				
				var minSizeA = $scope.childDimensions[splitterIndex - 1].minSize;
				var minSizeB = $scope.childDimensions[splitterIndex + 1].minSize;
				
				if (newSizeA < minSizeA || newSizeB < minSizeB) {
					newSizeA = oldSizeA;
					newSizeB = oldSizeB;
				}
				
				$scope.childDimensions[splitterIndex - 1].calculatedSize = newSizeA;
				$scope.childDimensions[splitterIndex + 1].calculatedSize = newSizeB;
				
				$scope.applyDimensions();
			};
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
						throw "rvLayout 'orientation' attribute should be either 'columns' or 'rows'.";
					}
				};
				
				scope.parseDeclaredDimensions = function() {
					// Initialize dimensions
					angular.forEach(element.children(), function(child, i) {
						child = angular.element(child);
						var declaredSize = scope.getDeclaredDimension(child);
						
						scope.childDimensions[i] = {
							declaredSize: declaredSize,
							calculatedSize: declaredSize,
							minSize: scope.getMinSize(child)
						};
					});
					
					// Calculate and set dimensions with star
					var stars = scope.getNrOfStars();
					var starSpace = scope.getStarSpace();
					angular.forEach(element.children(), function(child, i) {
						if (scope.childDimensions[i].declaredSize === "*") {
							scope.childDimensions[i].calculatedSize = Math.floor(starSpace / stars);
						}
					});
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
				
				scope.getMinSize = function(element) {
					var retVal = -1;
					var sizeAttr = element.attr("minsize");
					if (sizeAttr) {
						var retVal = parseInt(sizeAttr, 10);
					}					
					return retVal;
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
					
					angular.forEach(scope.childDimensions, function(dimension) {
						if (dimension.declaredSize != "*") {
							starSpace -= dimension.calculatedSize;
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
						scope.calculateSizes();
						scope.applyDimensions();
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

.directive('rvSplitter', [function() {	
	return {
		restrict: 'E',
		require: '^rvLayout',
		scope: {},
		link: function(scope, element, attrs, ctrl) {
			
			scope.lastMousePos = -1;
			
			// Flag to know if the user is dragging
			var dragging = false;
			
			// Get container
			var container = element.parent();
			
			// Get size
			var splitterSize = parseInt(element.attr('size'), 10);
			if (!splitterSize) {
				throw 'Fixed size mandatory on splitters.';
			}
			
			// Init element

			element.bind('mousedown', function (e) {
				e.preventDefault();
				dragging = true;
			});
			
			// Reset 'dragging' flag on 'mouseup' event
			angular.element(document).bind('mouseup', function (ev) {
				dragging = false;
			});
			
			// Update dragHandle position on 'mousemove' events when 'dragging' is true.
			container.bind('mousemove', function (e) {
				if (dragging == true) {
					var bounds = container[0].getBoundingClientRect();
					
					var containerSize = 0;
					var mousePos = 0;
					
					if (ctrl.getOrientation() == "columns") {
						containerSize = bounds.right - bounds.left;
						mousePos = e.clientX - bounds.left;
					}
					else {
						containerSize = bounds.bottom - bounds.top;
						mousePos = e.clientY - bounds.top;
					}
					
					if (mousePos <= containerSize - splitterSize) {
					
						if (scope.lastMousePos == -1) {
							scope.lastMousePos = mousePos;
						}
						
						var delta = scope.lastMousePos - mousePos;
					
						ctrl.handleSplitterMove(element, delta, mousePos);
						scope.lastMousePos = mousePos;
					}
				}
			});
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
}])

.directive("rvBorderPanel", [function() {
	return {
		restrict: "E",
		replace: true,
		transclude: true,
		template: function(element, attrs) {
			return '<div>'
							+ '<div style="position: absolute; top: 5px; right: 5px; bottom: 5px; left: 5px; background: white;">'
								+ '<div style="position: absolute; top: 2px; right: 2px; bottom: 2px; left: 2px; background: #00D; padding: 4px;">'
									+ '<div ng-transclude style="background: blue; color: white; padding: 2px;"></div>'
								+ '</div>'
							+ '</div>'
						+ '</div>';
		}
	};
}])


.directive("rvPanelTitle", [function() {
	return {
		restrict: "E",
		replace: true,
		transclude: true,
		template: function(element, attrs) {
			return '<div class="panelTitle" ng-transclude></div>';
		}
	};
}]);