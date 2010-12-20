var irc = require('./irc/irc'),
    sys = require('sys'),
    fs = require('fs'),
    filename = '/var/blatchman-logs2.db',
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
        words = '',
        i = '',
        actual_message = message.args.slice(0);

    if(message.raw.search('pavlovmedia') !== -1) {
        return;
    }
    
    if(target === '#blatchdev' || target === '#droog') {
        // learning routine
        if(message.args[0] !== '!blatch') {
            learn(actual_message);
        }
        
        // speaking routine
        if(actual_message[0] === '!blatch') {
            if(actual_message[1] && actual_message[2]) {
                words = actual_message[1] + ' ' + actual_message[2];
                words = words.trim();
            } else {
                roll = 0;
            }
        } else {
            roll = Math.random();
        }
        
        if(roll <= reply_rate) {
            if(!words) {
                roll = Math.random();
                if(roll <= topic_rate && actual_message[0] !== '!blatch') {
                    word_index = Math.floor(Math.random() * (actual_message.length - 1));
                    words = actual_message[word_index] + ' ' + actual_message[word_index+1];
                }
                
            }
            
            setTimeout(function() {
                say_something(target, words);
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

function say_something(channel, seed_words) {
    var sentence = '';
    var keys = Object.keys(db);
    var new_word = '';
    var source = null;
    
    if(!seed_words) {
        seed_words = keys[Math.floor(Math.random() * keys.length)];
    }
    
    sentence = seed_words;
    
    while(sentence.length < 500) {
        if(new_word) {
            sentence = sentence + ' ' + new_word;
        }
        
        source = db[seed_words];
        
        if(source) {
            new_word = source[Math.floor(Math.random() * source.length)];
            seed_words = seed_words.split(' ')[1] + ' ' + new_word;
        } else {
            break;
        }
    }
    
    conn.message(channel, sentence);
}

function learn(words) {
    
    var i = 0,
        phrase = '',
        contents = [];
    
    for(i; i < words.length; i += 1) {
        phrase = words[i].trim();
        if(phrase) {
            contents.push(phrase);
        }
    }
    
    if(contents.length === 2) {
        phrase = contents.join(' ');
        db[phrase] = db[phrase] || [];
        return;
    }
    
    for(i=0; i < contents.length - 2; i += 1) {
        phrase = contents[i] + ' ' + contents[i+1];
        db[phrase] = db[phrase] || [];
        db[phrase].push(contents[i+2]);
    }
    
}

setInterval(save_db, 300000);