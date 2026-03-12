const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;
const { connectdb } = require('./config/database');
const cors = require('cors');
require('dotenv').config();

const allowedOrigins = [
    'https://e-way.netlify.app',
    'http://localhost:3000',
];

connectdb();
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// root
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Hello Sir Server Running Fine !",
        client : "https://e-way.netlify.app",
        owner : "Manish Kumar",
        email : "manojgeetparmar@gmail.com"
    })
});
// routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/carts', require('./routes/cartRoutes'));
app.use('/api/userorder', require('./routes/orderRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(require('./middleware/errorHandler'));

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});