importScripts('underscore-min.js');
importScripts('sample-data.js');

const stopWordsList = [
  "de", "del", "con",
  "y", "ya", "o", "para", "con", "por", "sin",
  "en", "al", "a",
  "el", "lo", "los", "le", "les", "la", "las", "yo",
  "no", "ni",
  "es", "estan", "se", "he", "son", "esta", "algo", "otra",
  "tiene", "tengo", "hay", "pueden", "hace", "ha", "era", "da", "saben", "tienen", "puedo",
  "uno", "unos", "muy", "una", "un", "como", "mi", "desde",
  "me", "nos", "te",
  "que", "q", "cuando", "hasta",
  "mas", "pero", "si"
];

let stopWords = {};
_.each(stopWordsList, function(word){
  stopWords[word] = true;
});

const cleanupRegexes = [
  [new RegExp("[àáâãäå]", 'g'), "a"],
  [new RegExp("æ", 'g'), "ae"],
  [new RegExp("ç", 'g'), "c"],
  [new RegExp("[èéêë]", 'g'), "e"],
  [new RegExp("[ìíîï]", 'g'), "i"],
  [new RegExp("ñ", 'g'), "n"],
  [new RegExp("[òóôõö]", 'g'), "o"],
  [new RegExp("œ", 'g'), "oe"],
  [new RegExp("[ùúûü]", 'g'), "u"],
  [new RegExp("[ýÿ]", 'g'), "y"]
]

function removeDiacriticsCasero(s) {
  if (s) {
    s = s.toLowerCase();
    _.each(cleanupRegexes, ([regex, replace]) => s = s.replace(regex, replace))
  }
  return s;
}

function removeStopWords(cleanSearch) {
  let words = cleanSearch.split(" ")
  let res = _.filter(words, w => !stopWords[w]);
  return res.join(" ")
}

function getJSON(url, sucessCbk, errCbk = ()=>console.error(err)) {
  let request = new XMLHttpRequest();
  request.open('GET', url, true);

  request.onload = function () {
    if (request.status >= 200 && request.status < 400) {
      sucessCbk(JSON.parse(request.responseText));
    } else {
      errCbk("Error " + request.status)
    }
  };

  request.onerror = function (err) {
    errCbk(err)
  };

  request.send();
}

function log(msg) {
  self.postMessage({action: 'status', message: msg})
  if(msg) console.debug(msg)
}

self.addEventListener('message', function (msg) {
  switch (msg.data.action) {
    case 'search':
      search(new RegExp(msg.data.query, "ig"));
      break;
    case 'loadFile':
      try {
        log("Parsing file as JSON...")
        parseDataObject(JSON.parse(msg.data.fileText))
      } catch (err){
        log("Error loading file: "+err)
      }
      break;
    default:
      console.error("Unknown message action", msg.data);
  }
}, false);

let stringTest = [];
let items = [];
let filtradas = [];
let topMatches = {};
let partial = false;

let searching = false;
let lastSearchTime = 0;
let progressSent = false;

let re = new RegExp();

function sendProgress(query){
  self.postMessage({action: 'search-result', res: {
    filtradas: filtradas.slice(0, 500000),
    filtradasLength: filtradas.length,
    partial,
    lastSearchTime,
    topMatches
  }});
  console.log(`Search progress con '${query}'`)
}

let nextTick = 0;
function search(regex) {
  if(items.length === 0) return;
  re = regex;

  searching = true;

  progressSent = false;
  topMatches = {};
  filtradas = [];

  let START = 0;

  let startTime = new Date();
  let lastPause = new Date();

  function resume(START, query) {
    for (var i = START; i < items.length; i++) {
      let den = items[i];
      let m = (den || "").toString().match(re);
      if (m) {
        topMatches[m[0]] = (topMatches[m[0]] || 0) + 1;
        filtradas.push(den);
      }

      if (new Date() - lastPause > 30) {
        lastPause = new Date();
        START = i;

        log(`Searching ${(START/items.length*100).toFixed(0)}%`);
        // partial = true;
        // finalTopMatches = _.sortBy(_.pairs(JSON.parse(JSON.stringify(topMatches))), "1").reverse();
        // sendProgress(q);
        break;
      }

      if (new Date() - startTime > 35 && !progressSent) {
        partial = true;
        // topMatches = _.sortBy(_.pairs(topMatches), "1").reverse();
        sendProgress(query);
        progressSent = true;
      }
    }

    if(i < items.length){
      nextTick = setTimeout(() => resume(START, query), 0);
    } else {
      topMatches = _.sortBy(_.pairs(topMatches), "1").reverse();
      partial = false;
      searching = false;
      lastSearchTime = new Date().valueOf() - startTime;
      log("");

      sendProgress(query);
    }
  }

  clearTimeout(nextTick);
  resume(START, regex.toString());
}


// Sample data loaded
parseDataObject(sampleData)

function parseDataObject(data){
  items = [];
  log("Preprocessing " + data.length + " strings...");

  let lastStatus = new Date();
  _.each(data, function(search, index) {
    if(_.isObject(search)){
      search = _.map(_.values(search), v => v.toString()).join(" ||| ")
    }
    // let [userId, search] = line.split("\t")
    try {
      let cleanSearch = removeDiacriticsCasero(search || "").trim()
      // cleanSearch = removeStopWords(cleanSearch)
      items.push(cleanSearch)
    } catch (err) {
      console.error(err, search)
    }

    if (new Date() - lastStatus > 400) {
      log("Processing " + data.length + " strings... (" + (100 * index / data.length).toFixed(1) + "%)");
      lastStatus = new Date();
    }
  });

  log(``);

  filtradas = items
  stringTest = items.slice(0, 10000);

  sendProgress("");
}

function loadFile(input) {
  log("Loading huge file...");
  getJSON(input, parseDataObject, function(e) {
    log(`Error loading '${input}': ${e.toString()}`)
  });
}