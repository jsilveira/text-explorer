angular.module('pruebas', []);

function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

const worker = new Worker('text-processing-worker.js');

function TextExplorerCtrl($scope, $sce, $timeout) {
  // Para poder usar esas funciones en el template de angular
  $scope.Math = Math;
  $scope.JSON = JSON;
  $scope._ = _;


  $scope.lastSearchTime = 0;
  $scope.radio = 30;
  $scope.forceRegexp = true;

  // Cuantoss resultados se muestran a la vez
  $scope.shownRows = 50;

  $scope.denuncias = [];
  $scope.topMatches = [];
  $scope.partial = true

  let re = new RegExp();
  $scope.lastRe = re;

  let filterChanged = 0;
  let queryRegexp = "";

  // Esto crea un watcher para que cada vez que cambia el filtro, actualizo la regular expression
  // Esto es para no construir el bojeto RegExp en cada denuncia.
  $scope.$watch("filtroTexto", function(nuevoValor) {
    if (nuevoValor) {
      if ($scope.forceRegexp) {
        try {
          re = new RegExp(nuevoValor, "ig");
          $scope.invalidRegexp = false;
          filterChanged = new Date().valueOf();
          queryRegexp = nuevoValor;
          $scope.filtrarDenuncias();
        } catch (err) {
          $scope.invalidRegexp = true;
        }
      } else {
        const regexText = escapeRegExp(nuevoValor);
        re = new RegExp(regexText, "ig");
        queryRegexp = regexText;
        $scope.filtrarDenuncias();
      }

    }
    else {
      $scope.invalidRegexp = false;
      filterChanged = new Date().valueOf();
      queryRegexp = ""
      re = new RegExp();
      $scope.filtrarDenuncias();
    }
  });

  let start = new Date();
  $scope.filtrarDenuncias = function() {
    start = new Date();
    worker.postMessage({action: 'search', query: queryRegexp}); // Send data to our worker.
  };

  worker.addEventListener('message', function(e) {
    $scope.$apply(function() {
      const msg = e.data;
      switch (msg.action) {
        case "search-result":
          const res = msg.res;
          $scope.filtradas = res.filtradas;
          $scope.filtradasLength = res.filtradasLength;
          $scope.partial = res.partial;
          $scope.lastSearchTime = res.lastSearchTime;
          // if(!res.partial) {
          $scope.topMatches = res.topMatches;
          // }
          $scope.lastRe = re;
          $scope.realLastTime = new Date() - start;
          break;
        case "status":
          $scope.status = msg.message;
          break;
        default:
          console.error("Unknown message", msg);
      }
      // console.log('Worker said: ', msg);
    });
  }, false);

  // Esto es simplemente para highlightear. Uso la misma regex de búsqueda para wrapear lo que matchea
  // por un span con una clase css que lugo pinto de amarillo
  $scope.resaltarResultado = function(texto) {
    if($scope.filtroTexto){
      // Si hay filtro, creo una regular expresion con el texto escapeado, por los caracteres especiales
      $scope.lastRe.lastIndex = 0;
      const m = $scope.lastRe.exec(texto);
      const from = Math.max(m.index - parseInt($scope.radio), 0);
      const to = m.index + parseInt($scope.radio) + m[0].length;
      texto = texto.slice(from, to)+"...";
      if(from > 0){
        texto = "..."+texto;
      }
      if(to < texto.length - 1){
        texto = texto+"...";
      }

      texto = texto.replace(re, "<span class='resaltado'>$&</span>")
    }

    return  $sce.trustAsHtml(texto);
  };

  $scope.loadingFileProgress = function(progress){
    $scope.$apply(() => $scope.status = progress)
  }

  $scope.fileLoaded = function(fileContent, fileName){
    $scope.partial = true
    $scope.$apply(() => $scope.status = "Sending file to service worker...")
    worker.postMessage({action: 'loadFile', fileText: fileContent}); // Send data to our worker.
  }
}
