/**
 * node db-create.js [db1] [db2] ...
 */
var util = require('util')
  , url = require('url')
  , cradle = require('cradle')
  , nu = require('nodeutil')
  , _ = require('underscore')
  , fs = require('fs')
  , log = nu.logger.getInstance('coucher');
var fpath = '/tmp/.couchdb';
var dbserver = {};

exports.setup = setup;
function setup(urlstr) {
  dbserver = getConnection(urlstr);

  if(!fs.existsSync(fpath)) {
    fs.mkdirSync(fpath);
  }
}

function getConnection(urlstr) {
  var urlobj = url.parse(urlstr);
  if(!urlobj) {
    console.log('connection string is null');
    return;
  }
  var server = urlobj.protocol + '//' + urlobj.hostname
    , port = urlobj.port
    , username = urlobj.auth.split(':')[0]
    , password = urlobj.auth.split(':')[1];

  return new(cradle.Connection)(server, port, {
    auth: { username: username, password: password },
    cache: false,
    raw: false
  });

}

exports.toolbox = {
  database: {
    // node coucher database -c http://user:pass@123.123.123.123:5984 -a create -d db1,db2,db3
    createdb: function (dblist) {
      doit(dblist.pop());

      function doit(dbname) {
        console.log('Creating database: ' + dbname);
        var db = dbserver.database(dbname);
        db.exists(function (err, exists) {
          if (err) {
            console.log('error', err);
          } else if (exists) {
            console.log('the database:%s is with you.', dbname);
          } else {
            console.log('database:%s does not exists. will create it....', dbname);
            db.create();
          }
          if(dblist.length > 0) doit(dblist.pop());
        });
      }
    },
    // node coucher database -c http://user:pass@123.123.123.123:5984 -a delete -d db1,db2,db3
    deletedb: function (dblist) {
      doit(dblist.pop());

      function doit(dbname) {
        console.log('Creating database: ' + dbname);
        var db = dbserver.database(dbname);
        db.exists(function (err, exists) {
          if (err) {
            console.log('error', err);
          } else if (exists) {
            console.log('the database:%s is exist..., will delete it...', dbname);
            db.destroy();
          } else {
            console.log('database:%s does not exists', dbname);
          }
          if(dblist.length > 0) doit(dblist.pop());
        });
      }
    }, 
    replicate: function(dblist, targetdb){
      doit(dblist.pop());

      function doit(dbname) {
        console.log('Creating database: ' + dbname);
        var db = dbserver.database(dbname);
        db.exists(function (err, exists) {
          if (err) {
            console.log('error', err);
          } else if (exists) {
            console.log('the database:%s is exist..., will replicate...', dbname);
            var _db = getConnection(targetdb).database(dbname);
            db.replicate(_db, {source:dbname, target: targetdb + '/' + dbname}, function(e,d){
              if(e) console.log('[ERROR]', e);
              console.log('Replicate DB:%s done. \nResult:', dbname, d);
            });
          } else {
            console.log('database:%s does not exists', dbname);
          }
          if(dblist.length > 0) doit(dblist.pop());
        });
      }
    }
  }, 
  view : {
    // coucher view -c http://user:pass@123.123.123.123:5984 -a dump -d dbname -v view1,view2
    dump: function dump(dbname, viewgrp, callback) {
      var db = dbserver.database(dbname);
      db.get('_design/' + viewgrp, function(e,d){
        if(e) console.log('[ERROR] Query of view of db:%s error', dbname, e);
        var path =  fpath + '/' + dbname + '/' ;
        if(!fs.existsSync(path)) {
          fs.mkdirSync(path);
        }
        console.log('Got data of %s:%s...', dbname, viewgrp);
        //console.log(d);
				if(!d || !d['views']) {
					console.log('[ERROR] no views defined in database:%s', dbname);
				} else
        fs.writeFileSync(path + '/' + viewgrp + '.json', JSON.stringify(d.views), 'UTF-8', function(e){
          if(e) 
            console.log('[ERROR]', e);
          else
            console.log('save dump file to ' + path + '/' + viewgrp + '.json done!');
        });
        if(callback) callback();
      });
      
    }, 
    // coucher view -c http://user:pass@123.123.123.123:5984 -a import -d dbname -v view1,view2
    import: function save(dbname, viewgrp, callback) {
      var db = dbserver.database(dbname);

      db.exists(function (err, exists) {
        if (err) {
          console.log('error', err);
        } else if (exists) {
          console.log('the database:%s is with you.', dbname);
          doit();
        } else {
          console.log('database:%s does not exists. will create it....', dbname);
          db.create(function() {
            doit();
          });
        }
      });

      function doit() {
        var context = fs.readFileSync(fpath + '/' + dbname + '/' + viewgrp + '.json');
        context = {views: JSON.parse(context)};
        db.save('_design/' + viewgrp, context, function(e,d){
          if(e) 
            console.log(e);
          else
            console.log('save %s:%s done', dbname, viewgrp);
        });
      }
    }
  }
}
