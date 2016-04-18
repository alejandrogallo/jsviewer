angular.module("viewer", ["ui.bootstrap"])
.controller("ViewerController", ["$scope", "$http", "$filter", function($scope, $http, $filter){

  $scope.volumetricFilesPath="chgcar.list";

  //DATABASE
  $scope.CHGCARS=[];
  $scope.MODELS=[];
  $scope.MAIN_VIEWER=undefined;

  //TABBING STUFF
  $scope.volumetricTab=-1;
  $scope.volumetricIsOn=true;
  $scope.setVolumetric = function () { $scope.volumetricIsOn = true; $scope.structureIsOn=false; }
  $scope.setVolumetricTab = function (index) { $scope.volumetricTab = index; }
  $scope.vol_thisTabIsOn = function (index) { return (index == $scope.volumetricTab && $scope.volumetricIsOn)?true:false;}

  //TODO
  $scope.structureTab=-1;
  $scope.structureIsOn=true;
  $scope.setStructure = function () { $scope.structureIsOn = true; $scope.structureIsOn=false; }
  $scope.setStructureTab = function (index) { $scope.structureTab = index; }
  $scope.struc_thisTabIsOn = function (index) { return (index == $scope.structureTab && $scope.structureIsOn)?true:false;}


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
      //special cases
      if (chgcarObject.format.match(/ALLK/)) {
        chgcarObject.format="vasp";
      }
    }
    else {
      chgcarObject.format="vasp"; //It suits my needs
    }


    $scope.CHGCARS.push(chgcarObject);
  }

  $scope.activateAllChgcarobjects = function () {
    $scope.CHGCARS.forEach(function(element, index){
      element.value=true;
    });
  }

  $scope.deactivateAllChgcarobjects = function () {
    $scope.CHGCARS.forEach(function(element, index){
      element.value=false;
    });
  }


  $scope.zoomed=false;
  $scope.zoomToViewer = function () {
    var settings = {
      targetsize:.90,
      animationendcallback:null,
      closeclick:false
    };
    if ($scope.zoomed) {
      $(document.body).zoomTo();
    } else {
      $("#viewer").zoomTo(settings);
    }
    $scope.zoomed = $scope.zoomed?false:true;
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



  $scope.renderAll = function() {
    var CAMERA = 50;
    $scope.clear();
    $scope.renderModels();
    $scope.renderChgcar();
    $scope.MAIN_VIEWER.setSlab(-CAMERA,CAMERA);
    $scope.MAIN_VIEWER.render();
  }

  $scope.renderIso = function() {
    $scope.CHGCARS.forEach(function(shape){
      $scope.removeShape(shape);
    });
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
      $scope.removeShape(chgcarObject);
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
      if (!chgcarObject.surfaceObject) {
        //console.log("Rendering volumetric data for "+chgcarObject.name);
        chgcarObject.surfaceObject = $scope.MAIN_VIEWER.addIsosurface(chgcarObject.data , {voxel:voxel , isoval: isovalue  , color: color, opacity:opacity , smoothness:smoothness , alpha: alpha});
        $scope.render();
      }
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
        chgcarObject.surfaceObject = $scope.MAIN_VIEWER.addIsosurface(chgcarObject.data , {voxel:voxel , isoval: isovalue  , color: color, opacity:opacity , smoothness:smoothness , alpha: alpha});
        console.log(chgcarObject.surfaceObject);
        $scope.render();
      });
    }
  }

  $scope.removeShape = function (chgcarObject) {
    if (chgcarObject.surfaceObject) {
      //console.log("Removing surface from file "+chgcarObject.name);
      $scope.MAIN_VIEWER.removeShape(chgcarObject.surfaceObject);
      $scope.render();
      chgcarObject.surfaceObject = undefined;
    }
  }

  $scope.renderChgcar = function() {
    //console.log("Rendering Chgcar");
    $scope.CHGCARS.forEach(function(chgcarObject, index){
      if (chgcarObject.value) {
        $scope.renderVolumetricData(chgcarObject);
      }
    });
  }

  $scope.clear = function () {
    $scope.MODELS.forEach(function(model){
      $scope.removeModel(model);
    });
    $scope.CHGCARS.forEach(function(shape){
      $scope.removeShape(shape);
    });

  }
  $scope.render = function () {
    $scope.MAIN_VIEWER.render();
  }

  $scope.removeModel = function (model) {
    if (model.model_object) {
      $scope.MAIN_VIEWER.removeModel(model.model_object);
      model.model_object = undefined;
      $scope.render();
    }
  }
  $scope.hideModel = function (model) {
    if (model.model_object) {
      console.log("Hiding model "+model.name);
      console.log(model.model_object);
      model.model_object.hide();
      $scope.render();
    }
  }
  $scope.renderModel = function (model) {
    var modelPath=model.name;
    var format=model.format;
    if (model.model_object) {
      model.model_object.show();
      $scope.render();
    } else {
      $http.get(modelPath).then(function(response){
        console.log("Structural data received");
        var data= response.data;
        var model_object = $scope.MAIN_VIEWER.addModel(data, format);
        model.model_object = model_object;
        model.model_object.setStyle({}, {sphere:{scale: 0.2}, stick:{radius:0.1}});
        $scope.render();
      });
    }
  }

  $scope.renderModels = function() {
    $scope.MODELS.forEach(function(model){
      $scope.renderModel(model);
    });
  }

  $scope.init();

}]);
