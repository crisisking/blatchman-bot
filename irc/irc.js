var net = require('net');


function Message(raw_message) {
    var parsed_message = raw_message.match(this.regex);
    return {"prefix": parsed_message[2], 
            "command": parsed_message[3], 
            "args": parsed_message[5].trim().split(' '),
            "raw": raw_message};
}


Message.prototype.regex = new RegExp("^(:([^ ]+) +)?([^ ]+)( *( .+))?");


function Connection(server_name, port, nick) {
    var self = this,
        buffer = '';
    self.connection = net.createConnection(port, server_name);
    self.connection.setEncoding('utf-8');
    
    self.connection.on('connect', function() {
        setTimeout(function() {
            self.connection.write('NICK ' + nick + '\r\n');
            self.connection.write('USER ' + nick + ' 0 * ' + nick + '\r\n');
            setTimeout(function() {
                self.connection.emit('ready');
            }, 1000);
            self.connection.on('PING', function(message) {
                self.connection.write('PONG ' + message.args[0] + '\r\n');
            });
        }, 250);
    });
    
    self.connection.on('data', function(data) {
        self.buffer += data;
        var delim_position = self.buffer.search('\r\n');
        while(delim_position !== -1) {
            var raw_message = self.buffer.substring(0, delim_position),
                parsed_message = '';
            self.buffer = self.buffer.substring(delim_position+2);
            parsed_message = new Message(raw_message);
            self.connection.emit('raw', raw_message);
            self.connection.emit(parsed_message.command, parsed_message);
            delim_position = self.buffer.search('\r\n');
        }
    });
    
    return this;
    
}

Connection.prototype.on = function(command, callback) {
    this.connection.on(command, callback);
};

Connection.prototype.write_raw = function(raw_message) {
    var conn = this.connection;
    setTimeout(function() {
        conn.emit('write_raw', raw_message);
        conn.write(raw_message);
    }, 1000);
};

Connection.prototype.write = function(message) {
    this.connection.emit('write', message);
    this.write_raw(message + '\r\n');
};

Connection.prototype.join = function(channel) {
    this.connection.emit('join', channel);
    this.write('JOIN ' + channel);
};

Connection.prototype.part = function(channel) {
    this.connection.emit('part', channel);
    this.write('PART ' + channel);
};

Connection.prototype.message = function(target, message) {
    this.connection.emit('message', target, message);
    this.write('PRIVMSG ' + target + ' :' + message);
};

exports.Connection = Connection;
