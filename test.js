var Socket = require('net').Socket;
var spies = require('chai-spies');
var chai = require('chai');
chai.use(require('chai-spies'));
var expect = chai.expect;
var spy = chai.spy;
var createGuacamoleClient = require('./index');

chai.use(spies);

it('receives shit', function() {
	var client = createGuacamoleClient();
	var messages = [ ];
	client.on('message', message => {
		messages.push(message);
	});
	client.emit('data', Buffer('1.s,2'));
	client.emit('data', Buffer('.ef;3.'));
	client.emit('data', Buffer('c.s,5.axcvb;'));
	client.emit('data', Buffer('3.dfg;3.gxx'));

	expect(messages).deep.equal([
		[ 's', 'ef' ],
		[ 'c.s', 'axcvb' ],
		[ 'dfg' ]
	])
});

it('sends shit', function() {
	var client = createGuacamoleClient();
	client.write = spy(function(data) {
		expect(this).to.be.instanceOf(Socket);
	});

	client.send([ 'rq23wta', '.:a"1@#$' ]);
	expect(client.write).to.have.been.called.once.with('7.rq23wta,8..:a"1@#$;');
	client.write.reset();

	client.send([ '' ]);
	expect(client.write).to.have.been.called.once.with('0.;');
	client.write.reset();

	client.send([ '!', '' ]);
	expect(client.write).to.have.been.called.once.with('1.!,0.;');
	client.write.reset();
});

it('fires error and closes the socket because of invalid shit', function() {
	var client = createGuacamoleClient();
	client.close = spy(function() {
		expect(this).to.be.instanceOf(Socket);
	});
	var errorSpy = spy();
	client.on('error', errorSpy);

	client.emit('data', 'f.a');

	expect(client.close).to.have.been.called.once();
	expect(errorSpy).to.have.been.called.once();
});
