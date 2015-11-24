var fs=require('fs');
var glob = require("glob");
var wavi = require('wavi');
var data=[];

var totLength = -1;


/*not in use yet
 var jsonStructured = {name:"root"};
var buildJson = function(json,jsonObj){
    var currobj = jsonObj[json.name] = {name:json.name,path:json.file};
    if(json.require != null)
    {
        for(var i=0; i<json.require.length; i++) {
            for(var j=0; j<data.length; j++) {
                if(data[j].name == json.require[i]) {
                    buildJson(data[j], currobj);
                }
            }
        }
    }
};*/

var generateLinks = function(json,links,counter){
    if(json.require != null)
    {
        for(var i=0; i<json.require.length; i++) {
            for(var j=0; j<data.length; j++) {
                if(data[j].name == json.require[i]) {
                    counter =counter+"  "+i;
                    links.push({"source":json.id,"target":data[j].id,"relVar":"","type":"","id":counter});
                    data[j].rootParentId=json.id;
                    generateLinks(data[j], links,counter);
                }
            }
        }
    }
};
var buildArray = function(options,callback)
{
    if(data.length == totLength) {
        for(var i=0; i<data.length; i++)
        {
            var filename = data[i].file;
            var html = data[i].html;
            var matches = html.match(/require.*\)/g);
            if(matches) {
                for (var j = 0; j < matches.length; j++) {
                    matches[j] = matches[j].substr(0,matches[j].length-2);
                    matches[j] = matches[j].replace('"', "'");
                    var i1 = matches[j].indexOf("'");
                    var i2 = matches[j].lastIndexOf("'");
                    matches[j] = matches[j].substr(i1+1,  matches[j].length);
                }
            }

            data[i].name = filename.substr(filename.lastIndexOf("/") + 1, filename.length);
            data[i].name = data[i].name.substr(0, data[i].name.indexOf('.jsx'));


            delete data[i].html ;
            data[i].require = matches;

        }
        if(callback) {
            callback(data);
        }

        for(var i=0; i<data.length; i++) {
            data[i].group = "js";
            data[i].groupText = "JS";
            data[i].rawName = data[i].name;
            data[i].id = i;
            var requires = data[i].require;
            if (requires) {
                for (var j = 0; j < requires.length; j++) {
                    if (requires[j].indexOf('.jsx') > -1) {
                        requires[j] = requires[j].substr(requires[j].lastIndexOf("/") + 1, requires[j].length);
                        requires[j] = requires[j].substr(0, requires[j].indexOf('.jsx'));
                    }
                }
                data[i].require = requires;
            }


        }

        var graphJson = {};

        var links = [];
        for(var i=0; i<data.length; i++) {
//            buildJson(data[i],jsonStructured);
            generateLinks(data[i],links,i)
        }
        graphJson.nodes = data;
        graphJson.links = links;

        wavi.generateGraphFromJSON(options.format,graphJson,options.output,function(err){

        });



        /*fs.writeFile("./test/map.json", JSON.stringify(jsonStructured), function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });*/

    }
};


exports.generateDoc = function(options,callback){
    glob(options.components, options, function (err, files) {
        totLength = files.length;
        if(options.singleFiles)
        {
            totLength += options.singleFiles.length;
            for(var i=0; i<options.singleFiles.length; i++){
                var file = options.singleFiles[i];
                    fs.readFile(file, 'utf-8', function (err, html) {
                        if (err) throw err;
                        data.push({file,html});
                        buildArray(options,callback);
                    });
            }
        }
        // files is an array of filenames.
        // If the `nonull` option is set, and nothing
        // was found, then files is ["**/*.js"]
        // er is an error object or null.
       /* var file = './frontend/main.jsx';
        fs.readFile(file, 'utf-8', function (err, html) {
            if (err) throw err;
            data.push({file,html});
            buildArray(callback);
        });*/
        files.forEach(function(file){
                fs.readFile(file, 'utf-8', function (err, html) {
                    if (err) throw err;
                    data.push({file,html});
                    buildArray(options,callback);
                });
        });

    });
};
