const puppeteer = require("puppeteer");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { ArgumentParser } = require('argparse');


async function main() {
  // mkdir
  await fs.mkdir(path.resolve("screenshots"), () => {
    console.log("create screenshot");
  });

  const parser = new ArgumentParser({
    description: 'Argparse example'
  });
  
  parser.add_argument('-n', { help: 'number of frame' });
  
  args = parser.parse_args();
  const parameters = {};
  parameters.total_frame_number = args.n;

  // create express
  const app = express();
  const port = 3000;

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  app.use("/scene", express.static("./build/scene"));
  app.get("/parameters", (req, res) => {
    res.json(parameters);
  });

  app.post("/", async (req, res) => {
    const { img, frame } = req.body;

    try {
      const data = img.replace(/^data:image\/png;base64,/, "");
      const f = ("000" + frame).slice(-4);
      const buf = Buffer.from(data, "base64");
      await fs.writeFile(
        path.resolve(path.join("screenshots", `frame${f}.png`)),
        buf,
        () => {}
      );

      console.log("write frame", f);
    } finally {
      res.send();
    }
  });

  // const listen = new ExpressListen(app)
  app.listen(port, async () => {
    console.log(`Example app listening at http://localhost:${port}`);

    // start puppeteer
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--use-gl=egl"],
    });
    // const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({
      width: 800,
      height: 600,
      deviceScaleFactor: 1,
    });

    // wait for the "DONE" log of the scene
    page.on("console", async (message) => {
      if (message.text() === "DONE") {
        await page.close();
        await browser.close();
        console.log("> DONE!");
        process.exit(0);
      }
    });

    await page.setUserAgent('puppeteer')
    const web_url = `http://localhost:${port}/scene/index.html`;
    await page.goto(web_url);
  });

}
main();
