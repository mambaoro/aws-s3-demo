/* eslint consistent-return:0 import/order:0 */

const bodyParser = require('body-parser');
const express = require('express');
const logger = require('./logger');

const argv = require('./argv');
const port = require('./port');
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ngrok =
  (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel
    ? require('ngrok')
    : false;
const { resolve } = require('path');
const AWS = require('aws-sdk');
const fs = require('fs');
const v4 = require('uuid/v4');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// AWS S3 setup
AWS.config.update({
  accessKeyId: '',
  secretAccessKey: '',
});

const s3 = new AWS.S3();
// const filePath = 'loadMovieDetailsDataset2.js';

// const folder = 'mamadou';

// const params = {
//   Bucket: 'nodes3demo',
//   Body: fs.createReadStream(filePath),
//   Key: `${folder}/${path.basename(filePath)}-${v4()}`,
// };

// const metadata = {
//   userId: 'mamadou_1545451',
//   data: Date.now(),
// };

// s3.upload(params, metadata, (err, data) => {
//   if (err) {
//     console.log('Error', err);
//   }
//   if (data) {
//     console.log(data);
//   }
// });

const params = {
  Bucket: 'nodes3demo',
  Key:
    'mamadou/loadMovieDetailsDataset2.js-c937e6ae-c6df-4524-8a3a-a9f76f11dcef',
};

s3.deleteObject(params, (err, data) => {
  if (err) {
    console.log('Error', err);
  }
  if (data) {
    console.log(data);
  }
});

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';

// use the gzipped bundle
app.get('*.js', (req, res, next) => {
  req.url = req.url + '.gz'; // eslint-disable-line
  res.set('Content-Encoding', 'gzip');
  next();
});

// Start your app.
app.listen(port, host, async err => {
  if (err) {
    return logger.error(err.message);
  }

  // Connect to ngrok in dev mode
  if (ngrok) {
    let url;
    try {
      url = await ngrok.connect(port);
    } catch (e) {
      return logger.error(e);
    }
    logger.appStarted(port, prettyHost, url);
  } else {
    logger.appStarted(port, prettyHost);
  }
});
