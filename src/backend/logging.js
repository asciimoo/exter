class Logger {
    info() {
        this.message("[I]", colorize("green"), ...arguments)
    }
    warning() {
        this.message("[W]", colorize("yellow"), ...arguments)
    }
    error() {
        this.message("[E]", colorize("red"), ...arguments)
    }
    message() {
        console.log(new Date(), ...arguments, colorize("reset"))
    }
}

function colorize(color) {
    if(!process.stdout.isTTY) {
        return '';
    }
    switch(color) {
    case "red":
        return "\u001b[31m";
    case "green":
        return "\u001b[32m";
    case "yellow":
        return "\u001b[33m";
    case "reset":
        return "\u001b[0m";
    }
}

const log = new Logger();

export {
    log,
};
