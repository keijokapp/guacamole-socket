const Socket = require('net').Socket;

module.exports = function() {
	const socket = new Socket;

	socket.on('data', data => {
		try {
			for(var i = 0; i < data.length;) {
				i = parse(data, i);
			}
		} catch(e) {
			socket.emit('error', e);
			socket.close();
		}
	});

	var tokenLength = null;
	var buffer = '';

	function parse(data, index) {
		if(tokenLength === null) {
			// expect length of next token (command or argument) and trailing period
			const periodIndex = data.indexOf('.', index);
			if(periodIndex > -1) {
				buffer += data.slice(index, periodIndex).toString();
				tokenLength = parseInt(buffer) + 1; // Include trailing comma or semicolon
				if(isNaN(tokenLength)) {
					throw new Error('Invalid token length: ' + buffer);
				}
				buffer = '';
				return periodIndex + 1;
			} else {
				buffer += data.slice(index).toString();
				return data.length;
			}
		} else {
			// expect token (command or argument) and trailing comma or semicolon
			const neededDataLength = tokenLength - buffer.length;
			if(neededDataLength <= data.length - index) {
				const endIndex = index + neededDataLength;
				buffer += data.slice(index, endIndex).toString();
				parseToken(buffer);
				buffer = '';
				tokenLength = null;
				return endIndex;
			} else {
				buffer += data.slice(index).toString();
				return data.length;
			}
		}
	}

	var command = [];

	function parseToken(token) {
		const lastCharacter = token[token.length - 1];
		token = token.slice(0, -1);
		command.push(token);
		if(lastCharacter === ';') {
			socket.emit('message', command);
			command = [];
		}
	}

	function encode(token) {
		token = String(token);
		return token.length + '.' + token;
	}

	socket.send = function send(tokens) {
		const message = tokens.map(token => encode(token)).join(',') + ';';
		socket.write(message);
	};

	return socket;
};
