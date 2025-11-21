
# 🩸 BloodMatch  Web Application  

BloodMatch is a robust full-stack web application designed to power blood donation services. It supports user registration, profile management, membership purchases, reminders, notifications, and includes geolocation-based mapping features to help connect donors and recipients effectively.

## Features

- 🔐 **Authentication** – Sign-Up, Login, JWT-based security
- 👤 **Profile** – User Profile Management
- 🗺️ **Geolocation & Mapping** – Find donors and recipients nearby using location-based queries 
- 🌟 **Premium Features** – Reminders & Notifications for donation schedules (via Cashfree payment)  
- 📜**Swagger Api docs** - Auto-generated API documentation with Swagger UI
- ⚡ **Scalable** Scalable and secure REST API architecture
- 📱 **Responsive UI** – Works seamlessly on desktop & mobile  


## Tech Stack


- **Frontend:** Bootstrap, Vanilla JavaScript, Axios — for responsive UI and smooth client-server communication  
- **Backend:** Node.js, Express.js — for building scalable RESTful APIs and server-side logic.
- **Database:** MongoDB (via Mongoose), MongoDB Atlas — NoSQL database with managed cloud services for reliability. 
- **Authentication:** JWT (JSON Web Token) — secure stateless authentication for API endpoints. 
- **Email Sending** SendInBlue API — for transactional and notification emails.
- **Deployment:**AWS EC2 (server hosting), PM2 (process management), Nginx (reverse proxy & load balancing). 
- **Cloud Services:**  
  - **Mongodb Atlas** – Managed mongodb database service
  - **AWS IAM** – Role-based secure access control
  - **AWS Billing & Management Console** – Cost monitoring & resource management  
- **Payment Integration:** Cashfree for premium subscriptions  payments securely.
- **Geolocation & Mapping APIs:** 
  - **OpenCage Geocoder API** –  for autocomplete,forward and reverse geocoding to convert addresses into latitude/longitude and vice versa reliably using worldwide data.
  - **Leaflet.js** – open-source JavaScript library to build interactive and mobile-friendly map interfaces for displaying geographic data visually.

## Installation

Install my-project with github

```bash
git clone https://github.com/alurtaher/bloodmatch

cd BloodMatch

npm install
```
    
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`MONGOURL`

`PORT`

`JWT_SECRET`

`MONGO_TEST_URI`

`OPENCAGE_API_KEY`

`SENDINBLUE_API_KEY`

## Running Tests

To run tests, run the following command

```bash
  node server.js
```


## Documentation

[Swagger Documentation](http://localhost:3000/api-docs/)

## Authors

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/alur-taher-basha-857937233/)
## Other Common Github Profile Sections
👩‍💻 I'm currently working on a Backend project

🧠 I'm exploring backend technologies in depth