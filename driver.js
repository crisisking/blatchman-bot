var irc = require('./irc/irc');
var sys = require('sys');
var fs = require('fs');
var filename = '/var/blatchman-logs.db';
var reply_rate = 0.25;
var topic_rate = 0.55;

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

});

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

        if(actual_contents.length === 1) {
            var word = actual_contents[0];
            db[word] = db[word] || [];
        }

        for(var i=0; i<actual_contents.length - 1; i += 1) {
            var word = actual_contents[i];
            if(word) {
                db[word] = db[word] || [];
                db[word].push(actual_contents[i+1]);
            }
        }
    }

    message.args.unshift(target);

});

conn.on('PRIVMSG', function(message) {
   var target = message.args.shift();
   if(target === '#blatchdev' || target === '#droog') {
       if(message.args[0] === ':!blatch') {
           var roll = 0;
           var forced = true;
       } else {
           var roll = Math.random();
           var forced = false;
       }
       if(roll <= reply_rate) {
           roll = Math.random();
           if(roll <= topic_rate && !forced) {
               message.args[0] = message.args[0].substring(1);
               var word = message.args[Math.floor(Math.random() * message.args.length)];
               message.args[0] = ':' + message.args[0];
               say_something(target, word);
           } else {
               say_something(target);
           }
       }
   }
   
   message.args.unshift(target);
    
});

conn.on('PRIVMSG', function(message) {
    var target = message.args.shift();
    var sender = message.prefix.substring(0, message.prefix.search('!'));

    if(target === 'blatchman' && sender === 'Xenos') {
        if(message.args[0] === ':!dump') {
            for(i in db) {
                console.log(i + ': ' + db[i]);
            }
        } else if(message.args[0] === ':!save') {
            save_db();
        } else if(message.args[0] === ':!join') {
            conn.join(message.args[1]);
        } else if(message.args[0] === ':!quit') {
            conn.write('QUIT :' + (message.args[1] || "fart lol"));
            setTimeout(on_exit, 1500);
        } else if(message.args[0] === ':!speak') {
            say_something('#blatchdev');
            say_something('#droog');
        }
    }

    message.args.unshift(target);

});

process.on('SIGINT', on_exit);
process.on('SIGTERM', on_exit);

process.on('uncaughtException', function(err) {
    console.log(err.message);
    on_exit();
});

function save_db() {
    console.log('Saving DB...');
    fs.writeFileSync(filename, JSON.stringify(db), 'utf8');
    console.log('DB saved.');
}

function on_exit() {
    save_db();
    console.log('exiting!');
    process.exit();
}

function say_something(channel, seed_word) {
    var sentence = [];
    var keys = Object.keys(db);
    if(!seed_word) {
        seed_word = keys[Math.floor(Math.random() * keys.length)];
    }
    
    while(true) {
        sentence.push(seed_word);
        var source = db[seed_word];
        if(source) {
            seed_word = source[Math.floor(Math.random() * source.length)];
        } else {
            break;
        }
    }
    
    conn.message(channel, sentence.join(' '));
}

setInterval(save_db, 300000);