var VERBOSE = true;
function printv(argument) {
  if (VERBOSE) {
    console.log(argument);
  }
}

angular.module("viewer", ["ui.bootstrap"])
.controller("ViewerController", ["$scope", "$http", "$filter", function($scope, $http, $filter){

  $scope.volumetricFilesPaths=["chgcar.list", "volumetric_data"];

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
    printv("Initialising...");
    $scope.getChgcarNames();
    $scope.addModelObject("CONTCAR", true); // Maybe erase in the future
    //$scope.addChgcarObject("CHGCAR"); // Maybe erase in the future
    $scope.MAIN_VIEWER=$3Dmol.createViewer("viewer");
    $scope.MAIN_VIEWER.setBackgroundColor(0xffffff);
    printv("DEBUG: VIEWER");
    printv($scope.MAIN_VIEWER);
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
      model.format="vasp"; //this would suit me
    }
    model.settings = { sphere:{scale: 0.1}, stick:{radius: 0.1} };
    model.name     = name;
    model.value    = value? true: false;
    $scope.MODELS.push(model);
  }

  $scope.setMaximumIsovalue = function (chgcarObject) {
    if (chgcarObject.data) {
      printv("Looking for maximum data point");
      var data = chgcarObject.data.data;
      var max=0;
      data.forEach(function(value, index){
        if (max < value) {
          max = value;
        }
      });
      printv(max);
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
    chgcarObject.interactive = true;
    chgcarObject.value       = false;
    chgcarObject.wireframe   = false;
    chgcarObject.linewidth   = 1;
    chgcarObject.isovalue    = 0.01;
    chgcarObject.isoStep     = 0.0001;
    chgcarObject.opacity     = 0.95;
    chgcarObject.alpha       = 0.5;
    chgcarObject.smoothness  = 0;
    chgcarObject.voxel       = false;
    chgcarObject.color       = $scope.MAIN_COLORS[chgcarObject.index%$scope.MAIN_COLORS.length];

    //Parse variables
    if (variablesToParse) {
      printv("Parsing variables...");
      var varArray = variablesToParse.split("&");
      for (var i = 0, len = varArray.length; i < len; i++) {
        var key   = varArray[i].split("=")[0];
        var value = varArray[i].split("=")[1];
        if (key&&value) {
          //allow for overriding of keys
          if (chgcarObject[key]!==undefined) {
            if (value == "true") {
              chgcarObject[key] = true;
            } else if (value == "false") {
              chgcarObject[key] = false;
            } else if (isNaN(parseFloat(value))) {
              chgcarObject[key] = value;
            } else {
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

  // conf modal is visible or not
  $scope.volumetric_conf_popover = false;

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
    $scope.volumetricFilesPaths.forEach(function(volumetricFilesPath, index){
      printv("Reading chgcars from  "+volumetricFilesPath);
      $http.get(volumetricFilesPath).then(function(response){
        var data = response.data;
        printv(data);
        data = data.split(/[\n\r]/);
        data.forEach(function(name){
          if (name) {
            $scope.addChgcarObject(name);
            printv($scope.CHGCARS);
          }
        });
      });
    });
  }



  $scope.CAMERA=50000;
  $scope.setCameraSlab = function() {
    $scope.MAIN_VIEWER.setSlab(-$scope.CAMERA,$scope.CAMERA);
  };

  $scope.saveImage = function () {
    alert("Sorry, not yet implented, if you have any ideas..");
  };

  $scope.renderAll = function() {
    var CAMERA = $scope.CAMERA;
    $scope.clear();
    $scope.renderModels();
    $scope.renderVolumetrics();
    $scope.MAIN_VIEWER.setSlab(-CAMERA,CAMERA);
    $scope.render();
  }

  $scope.renderIso = function() {
    $scope.removeChgcars();
    $scope.renderVolumetrics();
  }

  $scope.MAIN_COLORS=[ "white",
  "red",
  "maroon",
  "yellow",
    "cyan",
    "orange",
      "olive",
      "lime",
        "green",
        "aqua",
          "teal",
          "blue",
            "navy",
            "purple",
              "fuchsia",
              "magenta",
                "grey",
                "silver",
                  "gray",
                  "black"
  ];

  $scope.interactiveRenderVolumetric = function (chgcarObject) {
    if (chgcarObject.interactive) {
      $scope.removeShape(chgcarObject);
      $scope.renderVolumetricData(chgcarObject);
    }
  }

  $scope.renderVolumetricData = function (chgcarObject) {

    var format          = chgcarObject.format;
    var volumetric_path = chgcarObject.name;

    var settings = {
      linewidth  : chgcarObject.linewidth,
      wireframe  : chgcarObject.wireframe,
      voxel      : chgcarObject.voxel ,
      isoval     : chgcarObject.isovalue  ,
      color      : chgcarObject.color,
      opacity    : chgcarObject.opacity ,
      smoothness : chgcarObject.smoothness ,
      alpha      : chgcarObject.alpha
    };

    if (chgcarObject.data) {
      if (!chgcarObject.surfaceObject) {
        printv("Rendering volumetric data for "+chgcarObject.name);
        chgcarObject.surfaceObject = $scope.MAIN_VIEWER.addIsosurface(chgcarObject.data , settings);
        chgcarObject.value=true;
        $scope.render();
      }
    } else {
      printv("Loading volumetric_data from "+volumetric_path);
      $http.get(volumetric_path).then(function (response) {
        printv("Volumetric data received");
        var data       = response.data;
        var voldata    = new $3Dmol.VolumeData(data, format);
        chgcarObject.data = voldata;
        $scope.setMaximumIsovalue(chgcarObject);
        if (!$scope.isOverriden(chgcarObject, "isovalue")) {
          chgcarObject.isovalue = parseFloat($filter('number')(chgcarObject.max*0.8, 4));
          var isovalue   = chgcarObject.isovalue;
        }
        chgcarObject.surfaceObject = $scope.MAIN_VIEWER.addIsosurface(chgcarObject.data , settings);
        //printv(chgcarObject.surfaceObject);
        chgcarObject.value=true;
        $scope.render();
      });
    }
  }

  $scope.toggleChgcar = function (chgcarObject) {
    printv("Toggling chgcar");
    if (chgcarObject.value) {
      $scope.removeShape(chgcarObject);
    } else {
      $scope.renderVolumetricData(chgcarObject);
    }
  }

  $scope.removeShape = function (chgcarObject) {
    if (chgcarObject.surfaceObject) {
      //printv("Removing surface from file "+chgcarObject.name);
      $scope.MAIN_VIEWER.removeShape(chgcarObject.surfaceObject);
      chgcarObject.value = false;
      $scope.render();
      chgcarObject.surfaceObject = undefined;
    }
  }

  $scope.renderVolumetrics = function() {
    //printv("Rendering Chgcar");
    $scope.CHGCARS.forEach(function(chgcarObject, index){
      if (chgcarObject.isovalue != 0) {
        $scope.renderVolumetricData(chgcarObject);
      }
    });
  }

  $scope.removeChgcars = function () {
    $scope.CHGCARS.forEach(function(shape){
      $scope.removeShape(shape);
    });
  }

  $scope.clear = function () {
    $scope.removeModels();
    $scope.removeChgcars();
  }

  $scope.render = function () {
    $scope.MAIN_VIEWER.render();
  }


  //////////////
  //  MODELS  //
  //////////////

  $scope.hideModel = function (model) {
    if (model.model_object) {
      printv("Hiding model "+model.name);
      //printv(model.model_object);
      model.model_object.hide();
      $scope.render();
    }
  }

  $scope.removeModels = function () {
    $scope.MODELS.forEach(function(model){
      $scope.removeModel(model);
    });
  }

  $scope.removeModel = function (model) {
    if (model.model_object) {
      $scope.MAIN_VIEWER.removeModel(model.model_object);
      model.model_object = undefined;
      $scope.render();
    }
  }

  $scope.renderModel = function (model) {
    if (model.model_object) {
      model.model_object.show();
      $scope.render();
    } else {
      if (model.data) {
        printv("Rendering model from data we already had");
        model.model_object = $scope.MAIN_VIEWER.addModel(model.data, model.format);
        model.model_object.setStyle({}, model.settings);
        $scope.render();
      } else {
        $http.get(model.name).then(function(response){
          printv("Structural data received");
          model.data         = response.data;
          model.model_object = $scope.MAIN_VIEWER.addModel(model.data, model.format);
          model.model_object.setStyle({}, model.settings);
          //model.model_object.setClickable({}, true, function () { console.log("clicked"); });
          //model.model_object.setStyle({within:{distance:3, sel:{atom:"Ge"}}}, {stick:{radius:1}});
          console.log(model.model_object);
          $scope.render();
        });
      }
    }
  }

  $scope.refreshModel = function (model) {
    $scope.removeModel(model);
    $scope.renderModel(model);
  }

  $scope.renderModels = function() {
    $scope.MODELS.forEach(function(model){
      $scope.renderModel(model);
    });
  }

  ////////////
  //  INIT  //
  ////////////

  $scope.init();

}]);
