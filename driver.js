var irc = require('./irc/irc');
var sys = require('sys');
var fs = require('fs');
var filename = '/var/blatchman-logs.db';

try {
    var db = JSON.parse(fs.readFileSync(filename, 'utf8'));
}

catch(error) {
    var db = {};
}

var conn = new irc.Connection('irc.synirc.net', 6667, 'blatchman');

conn.on('raw', function(message) {
    console.log(message);
});

conn.on('write', function(message) {
    console.log(message);
});

conn.on('ready', function() {
    conn.join('#blatchdev');
    
    conn.on('PRIVMSG', function(message) {
       var target = message.args.shift();
       if(target === '#blatchdev' || target === '#droog') {
           var contents = message.args.join(' ').substring(1).split(' ');
           var actual_contents = [];
           for(var i=0; i<contents.length; i += 1) {
               if(contents[i].trim()) {
                   actual_contents.push(contents[i]);
               } 
           }
                      
           for(var i=0; i<actual_contents.length - 1; i += 1) {
               var word = actual_contents[i];
               if(word) {
                   db[word] = db[word] || [];
                   db[word].push(actual_contents[i+1]);
               }
           }
       }
    });
});

process.on('SIGINT', function() {
    fs.writeFileSync(filename, JSON.stringify(db), 'utf8');
    console.log('exiting!');
    process.exit();
});