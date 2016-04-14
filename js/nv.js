angular.module("viewer", ["ui.bootstrap"])
.controller("ViewerController", ["$scope", "$http", "$filter", function($scope, $http, $filter){

  $scope.volumetricFilesPath="chgcar.list";

  $scope.CHGCARS=[];
  $scope.MODELS=[];


  $scope.MAIN_VIEWER=undefined;

  $scope.init = function() {
    console.log("Initialising...");
    $scope.getChgcarNames();
    //MAIN_VIEWER = $3Dmol.viewers.viewer;
    $scope.addModelObject("CONTCAR", true); // Maybe erase in the future
    //$scope.addChgcarObject("CHGCAR"); // Maybe erase in the future
    $scope.MAIN_VIEWER=$3Dmol.createViewer("viewer");
    $scope.MAIN_VIEWER.setBackgroundColor(0xffffff);
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
    var format = name.match(/\.\w+$/);
    if (format) {
      chgcarObject.format = format[0].replace(".","");
    }
    else {
      chgcarObject.format="vasp"; //It suits my needs
    }
    chgcarObject.name = name;
    chgcarObject.data = false;
    chgcarObject.value = true;
    chgcarObject.isovalue = 0.01;
    chgcarObject.opacity = 0.95;
    chgcarObject.alpha = 0.5;
    chgcarObject.smoothness = 1;
    chgcarObject.voxel = false;
    chgcarObject.color = "blue";
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
        chgcarObject.isovalue = parseFloat($filter('number')(chgcarObject.max*0.8, 4));
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
sovalue
kkkkkk
