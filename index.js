const CDP = require('chrome-remote-interface');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function sendDebugCommand({Debugger}, command) {
    switch (command) {
        case "s":
        case "step":
            Debugger.stepOver();
            return;
        case "n":
        case "next":
            Debugger.stepOut();
            return;
    };
};

CDP(async (client) => {
    try {
        const {Debugger, Runtime, Page} = client;
        await Page.enable();
        await Page.navigate({url: 'http://example.com'});
        await Runtime.enable();
        const program =
`class Bar {
  constructor(n) {
    this.n = n;
    const foo = {
      n: n,
      japan: "japan",
      america: "america"
    };
  };
  a() {
    return 'foo';
  };
  b() {
    return foo;
  };
};
const bar = new Bar(3);`;
        const {scriptId} = await Runtime.compileScript({
            expression: program,
            sourceURL: "http://localhost/target.js",
            persistScript: true
        });
        await Debugger.enable();
        const {breakpointId} = await Debugger.setBreakpoint({
            location: {
                scriptId,
                lineNumber: 0
            }
        });
        Debugger.paused(() => {
            rl.question("> ", (input) => {
              sendDebugCommand(client, input);
            });
        });
        await Runtime.runScript({scriptId: scriptId});
    } catch (err) {
        console.error(err);
    } finally {
      if (rl) {
          rl.close();
      };
      if (client) {
          client.close();
      };
    }
}).on('error', (err) => {
    console.error(err);
});

