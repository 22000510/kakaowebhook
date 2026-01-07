require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;

// 미들웨어
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());

// 라우팅
const sleepRouter = require('./functions/routes/sleepFeedback');
const welcomeRouter = require('./functions/routes/welcome');
const pullbackRouter = require('./functions/routes/pullback');

app.use('/api/sleep', sleepRouter);
app.use('/api/welcome', welcomeRouter);
app.use('/api/pullback', pullbackRouter);

// 서버 시작
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
