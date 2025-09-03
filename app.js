const express = require('express');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require("cors")
const path = require("path")
const { requireAuth, checkUser } = require('./server/authMiddleware/authMiddleware');

const app = express();
const PORT = 5500 || process.env.PORT;

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
// Increase request size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
// Configure file-upload to accept multiple files
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file (adjust as needed)
    useTempFiles: true, // Use temp files for large uploads
    tempFileDir: 'public/uploads' // Temporary directory (ensure this exists or adjust)
}));
// app.use(fileUpload({
//     useTempFiles: true,
//     tempFileDir: path.join(__dirname, 'public', 'c'),
//     createParentPath: true
// }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'piuscandothis',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Set view engine
app.set('view engine', 'ejs');

// DB config
const db = 'mongodb+srv://marcelpolocha1:081358pius@cluster0.f9a85hv.mongodb.net/piuscrypto';
mongoose.connect(db)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Middleware to pass flash messages to views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


app.get('*', checkUser);
app.use('/', require('./server/Route/indexRoute'));
app.use('/', requireAuth, require('./server/Route/userRoute'));
app.use('/', requireAuth, require('./server/Route/adminRoute'));

app.listen(PORT, console.log(`Server running on ${PORT}`));
