Shopping Cart Web Application

A full-stack Shopping Cart Web Application built using React.js, Node.js, Express.js, and SQL. This project provides a seamless online shopping experience where users can browse products, manage their shopping cart, and place orders.

📌 Features
‣ User Registration & Login (Optional)
‣ Product Listing
‣ Product Search & Filter
‣ Add Products to Cart
‣ Update Product Quantity
‣ Remove Products from Cart
‣ Order Summary
‣ Responsive User Interface
‣ RESTful API Integration
‣ SQL Database Management
‣ CRUD Operations
🛠 Tech Stack
📌Frontend
● React.js
● HTML5
● CSS3
● JavaScript (ES6+)
● Axios
📌Backend
● Node.js
● Express.js
📌Database
● MySQL / SQL
● Tools
● Visual Studio Code
● Git & GitHub
● Postman

📂 Project Structure

shopping-cart/
│
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                 # Node Backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── app.js
│   └── package.json
│
├── database/
│   └── shopping_cart.sql
│
└── README.md


⚙️ Installation
 ⁃ Clone Repository
 git clone https://github.com/your-username/shopping-cart.git
 cd shopping-cart

 ⁃ Install Frontend Dependencies
cd client
npm install
npm start

⁃ Install Backend Dependencies
cd server
npm install
npm start
npm run dev

⁃  Configure Environment Variables
Create a .env file inside the server folder.
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=ecom_db
JWT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=+14155238886
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

⁃ Database Setup

CREATE DATABASE shopping_cart;
shopping_cart.sql

  
