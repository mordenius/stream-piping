var http = require("http");
var fs = require("fs");
const EventEmitter = require("events");


new http.Server(function(req, res) {
	// res instanceof http.ServerResponse < stream.Writable

	if (req.url == "/big.html") {
		var file = new fs.ReadStream("./big.html");
		const pipe = new Pipe(file, res);

		pipe.on("error", err => {
			res.statusCode = 500;
			res.write(`{
				message: ${err.message}
			}`);
			res.end();
		});
	}
}).listen(3000, () => {
	console.log("Server launched");
});

class Pipe extends EventEmitter {
	constructor(source, destination) {
		super();
		this.readable = source;
		this.writable = destination;

		this.binding();
		this.init();
	}

	binding() {
		this.wait = this.wait.bind(this);
		this.resume = this.resume.bind(this);
		this.write = this.write.bind(this);
		this.hadleException = this.hadleException.bind(this);
	}

	init() {
		this.readable.on("data", this.write);
		this.readable.on("end", () => this.writable.end());
		this.readable.on("error", this.hadleException);
	}

	wait() {
		this.readable.pause();
		this.readable.removeListener("data", this.write);
		this.writable.once("drain", this.resume);
	}

	resume() {
		if (this.readable.isPaused()) this.readable.resume();
	}

	write(chunk) {
		const isSended = this.writable.write(chunk);
		if (!isSended) this.wait();
	}

	hadleException(err) {
		this.emit("error", err);
	}
}
