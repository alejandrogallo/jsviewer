angular.module("viewer", ["ui.bootstrap"])
.controller("ViewerController", ["$scope", "$http", "$filter", function($scope, $http, $filter){

  $scope.volumetricFilesPath="chgcar.list";

  $scope.CHGCARS=[];
  $scope.MODELS=[];


  $scope.MAIN_VIEWER=undefined;

  $scope.init = function() {
    console.log("Initialising...");
    $scope.getChgcarNames();
    $scope.addModelObject("CONTCAR", true); // Maybe erase in the future
    //$scope.addChgcarObject("CHGCAR"); // Maybe erase in the future
    $scope.MAIN_VIEWER=$3Dmol.createViewer("viewer");
    $scope.MAIN_VIEWER.setBackgroundColor(0xffffff);
    console.log("DEBUG: VIEWER");
    console.log($scope.MAIN_VIEWER);
  }

  $scope.isOverriden = function(object, key) {
    if (object.extras) {
      if (object.extras[key]) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  $scope.addModelObject = function (name, value) {
    var model = {};
    var format = name.match(/\.\w+$/);
    if (format) {
      model.format = format[0].replace(".","");
      if (model.format.match(/ALLK/)) {
        model.format="vasp";
      }
    }
    else {
      //this would suit me
      model.format="vasp";
    }
    model.name = name;
    model.value = value? true: false;
    $scope.MODELS.push(model);
  }

  $scope.setMaximumIsovalue = function (chgcarObject) {
    if (chgcarObject.data) {
      console.log("Looking for maximum data point");
      var data = chgcarObject.data.data;
      var max=0;
      data.forEach(function(value, index){
        if (max < value) {
          max = value;
        }
      });
      console.log(max);
      chgcarObject.max = max;
    }
  }

  $scope.addChgcarObject = function(name) {
    var chgcarObject={};
    chgcarObject.extras = {};
    var path;
    var variablesToParse;

    //see if there are variables to parse
    if (name.match(/\?/)) {
      path = name.split("?")[0];
      variablesToParse = name.split("?")[1];
    }else{
      path=name;
    }

    chgcarObject.index       = $scope.CHGCARS.length +1;
    chgcarObject.name        = path;
    chgcarObject.data        = false;
    chgcarObject.interactive = false;
    chgcarObject.value       = true;
    chgcarObject.isovalue    = 0.01;
    chgcarObject.isoStep     = 0.0001;
    chgcarObject.opacity     = 0.95;
    chgcarObject.alpha       = 0.5;
    chgcarObject.smoothness  = 1;
    chgcarObject.voxel       = false;
    chgcarObject.color       = $scope.MAIN_COLORS[chgcarObject.index%$scope.MAIN_COLORS.length];

    //Parse variables
    if (variablesToParse) {
      console.log("Parsing variables...");
      var varArray = variablesToParse.split("&");
      for (var i = 0, len = varArray.length; i < len; i++) {
        var key   = varArray[i].split("=")[0];
        var value = varArray[i].split("=")[1];
        if (key&&value) {
          //allow for overriding of keys
          if (chgcarObject[key]) {
            if (isNaN(parseFloat(value))) {
              chgcarObject[key] = value;
            }else {
              chgcarObject[key] = parseFloat(value);
            }
          }
          //it will be saved in both objects so that we know that it has been
          //overriden
          chgcarObject.extras[key]=value;
        }
      }
    }

    var format = path.match(/\.\w+$/);
    if (format) {
      chgcarObject.format = format[0].replace(".","");
    }
    else {
      chgcarObject.format="vasp"; //It suits my needs
    }


    $scope.CHGCARS.push(chgcarObject);
  }

  $scope.getChgcarNames = function() {
    console.log("Reading chgcars from  "+$scope.volumetricFilesPath);
    $http.get($scope.volumetricFilesPath).then(function(response){
      var data = response.data;
      console.log(data);
      data = data.split(/[\n\r]/);
      data.forEach(function(name){
        if (name) {
          $scope.addChgcarObject(name);
          console.log($scope.CHGCARS);
        }
      });
    });
  }


  $scope.clear = function() {
    console.log("Clearing..");
    $scope.MAIN_VIEWER.clear();
  }



  $scope.render = function() {
    $scope.clear();
    $scope.renderModels();
    $scope.renderChgcar();
    $scope.MAIN_VIEWER.setSlab(-50,50);
    $scope.MAIN_VIEWER.render();
    //$scope.MAIN_VIEWER.zoomTo();
  }

  $scope.renderIso = function() {
    $scope.MAIN_VIEWER.removeAllShapes();
    $scope.MAIN_VIEWER.removeAllSurfaces();
    $scope.renderChgcar();
  }

  $scope.MAIN_COLORS=[ "white",
  "red",
  "maroon",
  "yellow",
    "orange",
    "olive",
      "lime",
      "green",
        "aqua",
        "cyan",
          "teal",
          "blue",
            "navy",
            "purple",
              "fuchsia",
              "magenta",
              "silver",
                "gray",
                "grey",
                  "black"
  ];

  $scope.clearVolumetric = function (chgcarObject) {
    // TODO
    $scope.clear();
  }

  $scope.interactiveRenderVolumetric = function (chgcarObject) {
    if (chgcarObject.interactive) {
      $scope.clearVolumetric(chgcarObject);
      $scope.renderVolumetricData(chgcarObject);
    }
  }

  $scope.renderVolumetricData = function (chgcarObject) {

    var isovalue   = chgcarObject.isovalue;
    var opacity    = chgcarObject.opacity;
    var alpha      = chgcarObject.alpha;
    var smoothness = chgcarObject.smoothness;
    var voxel      = chgcarObject.voxel;
    var format     = chgcarObject.format;
    var color     = chgcarObject.color;
    var volumetric_path = chgcarObject.name;

    if (chgcarObject.data) {
      $scope.MAIN_VIEWER.addIsosurface(chgcarObject.data , {voxel:voxel , isoval: isovalue  , color: color, opacity:opacity , smoothness:smoothness , alpha: alpha});
      $scope.MAIN_VIEWER.render();
    } else {
      console.log("Loading volumetric_data from "+volumetric_path);
      $http.get(volumetric_path).then(function (response) {
        console.log("Volumetric data received");
        var data       = response.data;
        var voldata    = new $3Dmol.VolumeData(data, format);
        chgcarObject.data = voldata;
        $scope.setMaximumIsovalue(chgcarObject);
        if (!$scope.isOverriden(chgcarObject, "isovalue")) {
          chgcarObject.isovalue = parseFloat($filter('number')(chgcarObject.max*0.8, 4));
          var isovalue   = chgcarObject.isovalue;
        }
        $scope.MAIN_VIEWER.addIsosurface(voldata , {voxel:voxel , isoval: isovalue  , color: color, opacity:opacity , smoothness:smoothness , alpha: alpha});
        $scope.MAIN_VIEWER.render();
      });
    }
  }

  $scope.renderChgcar = function() {
    console.log("Rendering Chgcar");
    $scope.CHGCARS.forEach(function(chgcarObject, index){
      if (chgcarObject.value) {
        $scope.renderVolumetricData(chgcarObject);
      }
    });

  }

  $scope.renderModel = function (model) {
    var modelPath=model.name;
    var format=model.format;
    $http.get(modelPath).then(function(response){
      console.log("Structural data received");
      var data= response.data;
      var model = $scope.MAIN_VIEWER.addModel(data, format);
      model.setStyle({}, {sphere:{scale: 0.2}, stick:{radius:0.1}});
      $scope.MAIN_VIEWER.render();
    });
  }
  $scope.renderModels = function() {
    $scope.MODELS.forEach(function(model){
      $scope.renderModel(model);
    });
  }

  $scope.init();

}]);
