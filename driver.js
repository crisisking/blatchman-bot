var irc = require('./irc/irc'),
    sys = require('sys'),
    fs = require('fs'),
    filename = '/var/blatchman-logs.db',
    reply_rate = 0.25,
    topic_rate = 0.55,
    bot_nick = 'blatchman',
    owner_nick = 'Xenos';

try {
    var db = JSON.parse(fs.readFileSync(filename, 'utf8'));
}

catch(error) {
    var db = {};
}

var conn = new irc.Connection('irc.synirc.net', 6667, bot_nick);

conn.on('raw', function(message) {
    console.log(message);
});

conn.on('write', function(message) {
    console.log(message);
});

conn.on('ready', function() {
    conn.join('#blatchdev');
    conn.join('#droog');
});

conn.on('PRIVMSG', function(message) {
    var target = message.args.shift(),
        actual_contents = [],
        sender = message.prefix.substring(0, message.prefix.search('!')),
        roll = 0,
        word = '',
        i = '';
       
    
    if(target === '#blatchdev' || target === '#droog') {
        // learning routine
        if(sender != 'bron' && message.args[0] !== '!blatch') {
            setTimeout(function() {
                learn(message.args.slice(0));
            }, 1000);
        }
        
        // speaking routine
        if(message.args[0] === '!blatch') {
            word = message.args[1];
        } else {
            roll = Math.random();
        }
        
        if(roll <= reply_rate) {
            if(!word) {
                roll = Math.random();
                if(roll <= topic_rate) {
                    word = message.args[Math.floor(Math.random() * message.args.length)];
                }
                
            }
            
            setTimeout(function() {
                say_something(target, word);
            }, 300);
            
        }
    
    // private command processing       
    } else if(target === bot_nick && sender === owner_nick) {
        switch(message.args[0]) {
            case '!dump':
                for(i in db) {
                    console.log(i + ': ' + db[i]);
                }
                break;
            case '!save':
                save_db();
                break;
            case '!join':
                conn.join(message.args[1]);
                break;
            case '!quit':
                conn.write('QUIT :' + (message.args.slice(1).join(' ') || "fart lol"));
                setTimeout(on_exit, 1500);
                break;
            case '!speak':
                say_something('#blatchdev');
                say_something('#droog');
                break;
            case '!replyrate':
                reply_rate = Number(message.args[1]);
                break;
            case '!topicrate':
                topic_rate = Number(message.args[1]);
                break;
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
    
    while(sentence.join(' ').length < 500) {
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

function learn(words) {
    var i = 0,
        word = '',
        contents = [];
    
    for(i; i < words.length; i += 1) {
        word = words[i].trim();
        if(word) {
            contents.push(word);
        }
    }
    
    if(contents.length === 1) {
        word = contents[0];
        db[word] = db[word] || [];
        return;
    }
    
    for(i=0; i < contents.length - 1; i += 1) {
        word = contents[i];
        db[word] = db[word] || [];
        db[word].push(contents[i+1]);
    }
    
}

setInterval(save_db, 300000);