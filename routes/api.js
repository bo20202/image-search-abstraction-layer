var clientId = "dd1e403b523901b";
var http = require("https");

var mongo = require("mongodb").MongoClient;
var mongourl = "mongodb://localhost:27017/queries"

module.exports.search = function(req, res){
    var imageModel = {
        title: null,
        width: null,
        height: null,
        link: null
    };
    var images = [];
    searchForImages(req.params.query, function(result){
        if(result.success){
            result.data.items.forEach(function(item){
                imageModel ={
                    title: item.title,
                    width: item.width,
                    height: item.height,
                    link: item.link
                }
                images.push(imageModel);
            });
            var date = Date();
            addQueryToDb(req.params.query, date, function(err){
                if(err) return res.send("Db error! " + err);
                res.json(images);
            })
            
            
        }
        else{
            res.json(result)
        }
    }, req.query.offset);
};


module.exports.recent = function(req, res){
    getLastQuery(function(err, result){
        if(err) return res.send("Error! " + err);
        res.send(result.reverse())
    })
}


function searchForImages(query, callback, page){
    var request = `/3/gallery/t/${query}/viral/${page ? page : ""}/`;
    var options = {
        hostname: "api.imgur.com",
        path: encodeURI(request),
        headers: {
            "Authorization": "Client-ID " + clientId,
        }
    }
    http.request(options, function(res){
        var images = "";
        res.setEncoding("utf-8")
        res.on('data', function(chunk){
            images += chunk;
        })
        res.on('end', function(){
            images = JSON.parse(images);
            callback(images);
        })
    }).end();
}

function addQueryToDb(query, date, callback){
    mongo.connect(mongourl, function(err, db){
        if(err) return callback(err);
        var queries = db.collection("queries");
        var doc = {
            query: query,
            when: date
        }
        queries.insert(doc, function(err, res){
            if(err) return callback(err);
            callback(null);
            db.close();
        })
    })
}
function getLastQuery(callback){
    mongo.connect(mongourl, function(err, db){
        if(err) return callback(err);
        var urls = db.collection("queries");
        urls.find({},{_id:0},function(err, result){
            if(err) return callback(err);
            result.toArray(function(err, res){
                if(err) return callback(err);
                callback(null, res);
                db.close();
            })
            
        })
    })
}